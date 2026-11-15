import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Seller Withdrawals (WD) API - GET & POST /api/seller/withdrawals", () => {
  let sellerToken = "";
  let buyerToken = "";
  let sellerId: number;
  let testAccountId: number;
  const initialStoreBalance = 500000;

  beforeAll(async () => {
    // 1. Login Penjual
    const sellerRes = await request(app).post("/api/auth/login").send({
      identifier: "penjual",
      password: "penjual12345",
    });
    expect(sellerRes.status).toBe(200);
    sellerToken = sellerRes.body.token;
    sellerId = sellerRes.body.user.id;

    // 2. Login Pembeli
    const buyerRes = await request(app).post("/api/auth/login").send({
      identifier: "pembeli",
      password: "pembeli12345",
    });
    expect(buyerRes.status).toBe(200);
    buyerToken = buyerRes.body.token;

    // 3. Bersihkan data pengujian lama untuk penjual ini
    db.prepare("DELETE FROM seller_withdrawals WHERE seller_id = ?").run(sellerId);
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);

    // 4. Set saldo awal penjual ke 500.000 untuk pengujian
    db.prepare("UPDATE users SET store_balance = ? WHERE id = ?").run(initialStoreBalance, sellerId);
  });

  afterAll(() => {
    // Bersihkan data uji setelah testing selesai
    db.prepare("DELETE FROM seller_withdrawals WHERE seller_id = ?").run(sellerId);
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);
  });

  describe("GET /api/seller/withdrawals", () => {
    it("harus menolak akses (401) jika tanpa token", async () => {
      const res = await request(app).get("/api/seller/withdrawals");
      expect(res.status).toBe(401);
    });

    it("harus menolak akses (403) jika diakses oleh akun non-penjual (pembeli)", async () => {
      const res = await request(app)
        .get("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });

    it("harus mengembalikan daftar riwayat penarikan kosong di awal", async () => {
      const res = await request(app)
        .get("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("POST /api/seller/withdrawals - Validasi Prasyarat Akun", () => {
    it("harus menolak (400) dengan flag needAccount=true jika penjual belum memiliki akun penarikan tersimpan sama sekali", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: 9999,
          amount: 50000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.needAccount).toBe(true);
      expect(res.body.message).toContain("belum memiliki akun bank atau dompet digital");
    });
  });

  describe("POST /api/seller/withdrawals - Operasi Penarikan Saldo Toko", () => {
    beforeAll(async () => {
      // Tambahkan 1 akun rekening bank yang valid untuk pengujian
      const accRes = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "Bank Central Asia (BCA)",
          accountNumber: "8821990112",
          accountHolderName: "Toko Mitra Official",
          method: "preset",
        });

      expect(accRes.status).toBe(201);
      testAccountId = accRes.body.data.id;
    });

    it("harus menolak (400) jika ID akun tujuan tidak disertakan", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          amount: 50000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("pilih akun rekening atau dompet digital");
    });

    it("harus menolak (404) jika ID akun tujuan tidak ada di daftar milik penjual", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: 88888,
          amount: 50000,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("tidak ditemukan dalam daftar akun tersimpan");
    });

    it("harus menolak (400) jika nominal kurang dari batas minimum Rp 10.000", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: testAccountId,
          amount: 5000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Minimal penarikan saldo adalah Rp 10.000");
    });

    it("harus menolak (400) jika nominal melebihi saldo toko yang tersedia", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: testAccountId,
          amount: 1000000, // Melebihi 500.000
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("tidak mencukupi");
    });

    it("harus berhasil (201) menarik saldo toko ke akun tersimpan, memotong saldo, dan mencatat mutasi", async () => {
      const withdrawAmount = 150000;
      const expectedNewBalance = initialStoreBalance - withdrawAmount;

      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: testAccountId,
          amount: withdrawAmount,
          notes: "Penarikan mingguan toko",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.newBalance).toBe(expectedNewBalance);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.amount).toBe(withdrawAmount);
      expect(res.body.data.payoutAccountId).toBe(testAccountId);
      expect(res.body.data.providerName).toBe("Bank Central Asia (BCA)");
      expect(res.body.data.accountNumber).toBe("8821990112");
      expect(res.body.data.status).toBe("pending");

      // Verifikasi langsung ke database bahwa store_balance terpotong
      const userRow = db
        .prepare("SELECT store_balance FROM users WHERE id = ?")
        .get(sellerId) as { store_balance: number };
      expect(userRow.store_balance).toBe(expectedNewBalance);

      // Verifikasi pencatatan di balance_mutations
      const mutationRow = db
        .prepare(
          "SELECT * FROM balance_mutations WHERE user_id = ? AND type = 'withdrawal' ORDER BY id DESC LIMIT 1"
        )
        .get(sellerId) as {
        amount: number;
        balance_before: number;
        balance_after: number;
        type: string;
      };
      expect(mutationRow).toBeDefined();
      expect(mutationRow.amount).toBe(withdrawAmount);
      expect(mutationRow.balance_before).toBe(initialStoreBalance);
      expect(mutationRow.balance_after).toBe(expectedNewBalance);
    });

    it("harus menampilkan penarikan yang baru saja dilakukan pada riwayat GET /api/seller/withdrawals", async () => {
      const res = await request(app)
        .get("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const latestWd = res.body.data[0];
      expect(latestWd.amount).toBe(150000);
      expect(latestWd.providerName).toBe("Bank Central Asia (BCA)");
      expect(latestWd.accountNumber).toBe("8821990112");
      expect(latestWd.notes).toBe("Penarikan mingguan toko");
    });
  });
});

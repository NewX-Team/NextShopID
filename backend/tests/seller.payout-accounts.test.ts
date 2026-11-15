import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Seller Payout Accounts API - GET, POST & DELETE /api/seller/payout-accounts", () => {
  let sellerToken = "";
  let buyerToken = "";
  let sellerId: number;
  let createdAccountId: number;

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

    // Bersihkan data uji sebelumnya untuk seller ini
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);
  });

  afterAll(() => {
    // Bersihkan data uji setelah testing selesai
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);
  });

  describe("GET /api/seller/payout-accounts", () => {
    it("harus menolak akses (401) jika tanpa token", async () => {
      const res = await request(app).get("/api/seller/payout-accounts");
      expect(res.status).toBe(401);
    });

    it("harus menolak akses (403) jika diakses oleh akun non-penjual (pembeli)", async () => {
      const res = await request(app)
        .get("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });

    it("harus mengembalikan daftar akun penarikan penjual (awalnya kosong)", async () => {
      const res = await request(app)
        .get("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("POST /api/seller/payout-accounts", () => {
    it("harus menolak (400) jika data tidak lengkap atau jenis akun tidak valid", async () => {
      const invalidTypeRes = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "crypto",
          providerName: "Bitcoin",
          accountNumber: "12345678",
          accountHolderName: "Penjual Official",
          method: "preset",
        });
      expect(invalidTypeRes.status).toBe(400);

      const shortNumRes = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "BCA",
          accountNumber: "12",
          accountHolderName: "Penjual Official",
          method: "preset",
        });
      expect(shortNumRes.status).toBe(400);
    });

    it("harus menolak (400) jika nomor rekening atau nomor wallet mengandung huruf atau simbol", async () => {
      const letterInBankRes = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "Bank Central Asia (BCA)",
          accountNumber: "12345ABCDE",
          accountHolderName: "Penjual Official",
          method: "preset",
        });
      expect(letterInBankRes.status).toBe(400);
      expect(letterInBankRes.body.message).toContain("hanya menggunakan angka (0-9)");

      const letterInWalletRes = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "wallet",
          providerName: "GoPay",
          accountNumber: "0812-3456-WALLET",
          accountHolderName: "Penjual Official",
          method: "preset",
        });
      expect(letterInWalletRes.status).toBe(400);
      expect(letterInWalletRes.body.message).toContain("hanya menggunakan angka (0-9)");
    });

    it("berhasil menerima nama pemilik dan nama bank/wallet dengan kombinasi huruf dan angka", async () => {
      const res = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "Bank Digital 88",
          accountNumber: "9988776655",
          accountHolderName: "Toko Mitra 99 Official",
          method: "manual",
          isAgreed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountHolderName).toBe("Toko Mitra 99 Official");
      expect(res.body.data.providerName).toBe("Bank Digital 88");
      expect(res.body.data.accountNumber).toBe("9988776655");
    });

    it("harus menolak (400) metode manual jika tanda persetujuan keabsahan (isAgreed) tidak dicentang", async () => {
      const res = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "Bank Jago",
          accountNumber: "10987654321",
          accountHolderName: "Penjual Official",
          method: "manual",
          isAgreed: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("wajib menyetujui pernyataan");
    });

    it("berhasil menambahkan akun bank penarikan via Fitur 1 (Pilihan Populer / Preset)", async () => {
      const res = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "Bank Central Asia (BCA)",
          accountNumber: "8899771122",
          accountHolderName: "Penjual Official Toko",
          method: "preset",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.providerName).toBe("Bank Central Asia (BCA)");
      expect(res.body.data.accountNumber).toBe("8899771122");
      expect(res.body.data.method).toBe("preset");

      createdAccountId = res.body.data.id;
    });

    it("berhasil menambahkan akun e-wallet penarikan via Fitur 2 (Tambah Manual & Disahkan)", async () => {
      const res = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "wallet",
          providerName: "DOKU Wallet",
          accountNumber: "081299887766",
          accountHolderName: "Penjual Official Toko",
          method: "manual",
          isAgreed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.accountType).toBe("wallet");
      expect(res.body.data.providerName).toBe("DOKU Wallet");
      expect(res.body.data.method).toBe("manual");
      expect(res.body.data.isAgreed).toBe(true);
    });

    it("harus menolak (400) jika mencoba mendaftarkan nomor dan provider yang sama (duplikasi)", async () => {
      const res = await request(app)
        .post("/api/seller/payout-accounts")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          accountType: "bank",
          providerName: "Bank Central Asia (BCA)",
          accountNumber: "8899771122",
          accountHolderName: "Penjual Official Toko",
          method: "preset",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("sudah tersimpan");
    });
  });

  describe("DELETE /api/seller/payout-accounts/:id", () => {
    it("harus menolak (404) jika akun tidak ditemukan", async () => {
      const res = await request(app)
        .delete("/api/seller/payout-accounts/999999")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(res.status).toBe(404);
    });

    it("penjual berhasil menghapus akun penarikan miliknya", async () => {
      const res = await request(app)
        .delete(`/api/seller/payout-accounts/${createdAccountId}`)
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verifikasi bahwa akun tersebut sudah tidak ada lagi di database
      const checkRow = db
        .prepare("SELECT id FROM seller_payout_accounts WHERE id = ?")
        .get(createdAccountId);
      expect(checkRow).toBeUndefined();
    });
  });
});

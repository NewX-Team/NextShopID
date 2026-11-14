import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Admin Seller Balance Management API - GET /api/admin/sellers/balances & POST topup", () => {
  let adminToken = "";
  let sellerToken = "";
  let buyerToken = "";
  let sellerId: number;
  let buyerId: number;
  let initialBalance = 0;
  const currentTestBalance = 50000;

  beforeAll(async () => {
    // 1. Login Admin
    const adminRes = await request(app).post("/api/auth/login").send({
      identifier: "admin",
      password: "admin12345",
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Login Penjual
    const sellerRes = await request(app).post("/api/auth/login").send({
      identifier: "penjual",
      password: "penjual12345",
    });
    expect(sellerRes.status).toBe(200);
    sellerToken = sellerRes.body.token;
    sellerId = sellerRes.body.user.id;

    // 3. Login Pembeli
    const buyerRes = await request(app).post("/api/auth/login").send({
      identifier: "pembeli",
      password: "pembeli12345",
    });
    expect(buyerRes.status).toBe(200);
    buyerToken = buyerRes.body.token;
    buyerId = buyerRes.body.user.id;

    // Cek saldo awal penjual di database dan set nilai awal uji
    const row = db.prepare("SELECT store_balance FROM users WHERE id = ?").get(sellerId) as { store_balance: number };
    initialBalance = row.store_balance || 0;
    db.prepare("UPDATE users SET store_balance = ? WHERE id = ?").run(currentTestBalance, sellerId);
  });

  afterAll(() => {
    // Kembalikan saldo penjual ke initialBalance agar tidak mempengaruhi test lain
    db.prepare("UPDATE users SET store_balance = ? WHERE id = ?").run(initialBalance, sellerId);
    db.prepare("DELETE FROM balance_mutations WHERE user_id = ?").run(sellerId);
  });

  describe("GET /api/admin/sellers/balances", () => {
    it("harus menolak akses (401) jika request tidak menyertakan token", async () => {
      const res = await request(app).get("/api/admin/sellers/balances");
      expect(res.status).toBe(401);
    });

    it("harus menolak akses (403) jika diakses oleh non-admin", async () => {
      const sellerRes = await request(app)
        .get("/api/admin/sellers/balances")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(sellerRes.status).toBe(403);

      const buyerRes = await request(app)
        .get("/api/admin/sellers/balances")
        .set("Authorization", `Bearer ${buyerToken}`);
      expect(buyerRes.status).toBe(403);
    });

    it("admin dapat mengambil daftar seluruh saldo akun penjual beserta metrik statistik", async () => {
      const res = await request(app)
        .get("/api/admin/sellers/balances")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verifikasi struktur data penjual
      const targetSeller = res.body.data.find((s: { id: number }) => s.id === sellerId);
      expect(targetSeller).toBeDefined();
      expect(targetSeller.role).toBe("penjual");
      expect(typeof targetSeller.storeBalance).toBe("number");
      expect(typeof targetSeller.isStoreOpen).toBe("boolean");

      // Verifikasi statistik ringkasan
      expect(res.body.stats).toBeDefined();
      expect(typeof res.body.stats.totalSellers).toBe("number");
      expect(typeof res.body.stats.totalStoreBalance).toBe("number");
      expect(typeof res.body.stats.averageStoreBalance).toBe("number");
      expect(typeof res.body.stats.activeBalanceCount).toBe("number");
      expect(typeof res.body.stats.zeroBalanceCount).toBe("number");
    });

    it("admin dapat memfilter saldo penjual berdasarkan status saldo", async () => {
      const res = await request(app)
        .get("/api/admin/sellers/balances?balanceStatus=has_balance")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Semua penjual yang dikembalikan harus memiliki storeBalance > 0
      for (const seller of res.body.data) {
        expect(seller.storeBalance).toBeGreaterThan(0);
      }
    });
  });

  describe("POST /api/admin/sellers/:id/balance/topup", () => {
    it("harus menolak akses jika tidak diautentikasi atau bukan admin", async () => {
      const noAuth = await request(app)
        .post(`/api/admin/sellers/${sellerId}/balance/topup`)
        .send({ amount: 50000 });
      expect(noAuth.status).toBe(401);

      const sellerAuth = await request(app)
        .post(`/api/admin/sellers/${sellerId}/balance/topup`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({ amount: 50000 });
      expect(sellerAuth.status).toBe(403);
    });

    it("harus menolak (400) jika nominal bernilai 0, negatif, atau bukan angka", async () => {
      const zeroRes = await request(app)
        .post(`/api/admin/sellers/${sellerId}/balance/topup`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 0 });
      expect(zeroRes.status).toBe(400);

      const negativeRes = await request(app)
        .post(`/api/admin/sellers/${sellerId}/balance/topup`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: -50000 });
      expect(negativeRes.status).toBe(400);

      const stringRes = await request(app)
        .post(`/api/admin/sellers/${sellerId}/balance/topup`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: "tidak_valid" });
      expect(stringRes.status).toBe(400);
    });

    it("harus menolak (404) jika user id bukan penjual atau tidak ditemukan", async () => {
      // Akun pembeli bukan penjual
      const notSellerRes = await request(app)
        .post(`/api/admin/sellers/${buyerId}/balance/topup`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 50000 });
      expect(notSellerRes.status).toBe(404);

      // ID tidak ada
      const nonExistentRes = await request(app)
        .post("/api/admin/sellers/999999/balance/topup")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ amount: 50000 });
      expect(nonExistentRes.status).toBe(404);
    });

    it("admin berhasil menambahkan saldo secara manual ke akun penjual", async () => {
      const topupAmount = 250000;
      const note = "Bonus promosi merchant top level";

      const res = await request(app)
        .post(`/api/admin/sellers/${sellerId}/balance/topup`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          amount: topupAmount,
          description: note,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller).toBeDefined();
      expect(res.body.seller.storeBalance).toBe(currentTestBalance + topupAmount);

      expect(res.body.mutation).toBeDefined();
      expect(res.body.mutation.amount).toBe(topupAmount);
      expect(res.body.mutation.balanceBefore).toBe(currentTestBalance);
      expect(res.body.mutation.balanceAfter).toBe(currentTestBalance + topupAmount);
      expect(res.body.mutation.description).toBe(note);

      // Verifikasi langsung ke SQLite DB
      const updatedRow = db
        .prepare("SELECT store_balance FROM users WHERE id = ?")
        .get(sellerId) as { store_balance: number };
      expect(updatedRow.store_balance).toBe(currentTestBalance + topupAmount);
    });
  });

  describe("GET /api/admin/sellers/:id/balance/history", () => {
    it("admin dapat mengambil riwayat mutasi saldo penjual", async () => {
      const res = await request(app)
        .get(`/api/admin/sellers/${sellerId}/balance/history`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const latestMutation = res.body.data[0];
      expect(latestMutation.type).toBe("manual_credit");
      expect(latestMutation.amount).toBe(250000);
      expect(latestMutation.description).toBe("Bonus promosi merchant top level");
    });
  });
});

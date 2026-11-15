import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Admin Seller Withdrawals Management API - GET & PATCH /api/admin/sellers/withdrawals", () => {
  let adminToken = "";
  let sellerToken = "";
  let buyerToken = "";
  let sellerId: number;
  let testAccountId: number;
  const initialStoreBalance = 600000;

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

    // 4. Bersihkan data pengujian
    db.prepare("DELETE FROM seller_withdrawals WHERE seller_id = ?").run(sellerId);
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);
    db.prepare("UPDATE users SET store_balance = ? WHERE id = ?").run(initialStoreBalance, sellerId);

    // 5. Buat 1 akun rekening penarikan untuk penjual
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

  afterAll(() => {
    db.prepare("DELETE FROM seller_withdrawals WHERE seller_id = ?").run(sellerId);
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);
  });

  describe("GET /api/admin/sellers/withdrawals", () => {
    it("harus menolak akses (401) jika tanpa token", async () => {
      const res = await request(app).get("/api/admin/sellers/withdrawals");
      expect(res.status).toBe(401);
    });

    it("harus menolak akses (403) jika diakses oleh akun non-admin (penjual / pembeli)", async () => {
      const sellerAttempt = await request(app)
        .get("/api/admin/sellers/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(sellerAttempt.status).toBe(403);

      const buyerAttempt = await request(app)
        .get("/api/admin/sellers/withdrawals")
        .set("Authorization", `Bearer ${buyerToken}`);
      expect(buyerAttempt.status).toBe(403);
    });

    it("harus berhasil (200) mengembalikan daftar pengajuan dan statistik realtime untuk admin", async () => {
      const res = await request(app)
        .get("/api/admin/sellers/withdrawals")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalCount).toBeDefined();
      expect(res.body.stats.pendingCount).toBeDefined();
    });
  });

  describe("PATCH /api/admin/sellers/withdrawals/:id/decision - ACC & Tolak Transaksi", () => {
    let pendingWdId: number;

    it("harus menolak (400) jika ID atau keputusan tidak valid", async () => {
      const invalidDecisionRes = await request(app)
        .patch("/api/admin/sellers/withdrawals/999/decision")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ decision: "cancel" });
      expect(invalidDecisionRes.status).toBe(400);

      const notFoundRes = await request(app)
        .patch("/api/admin/sellers/withdrawals/99999/decision")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ decision: "approve" });
      expect(notFoundRes.status).toBe(404);
    });

    it("harus berhasil menyetujui (ACC / approve) transaksi penarikan oleh admin", async () => {
      // Penjual ajukan penarikan 100.000
      const wdAmount = 100000;
      const requestRes = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: testAccountId,
          amount: wdAmount,
          notes: "Penarikan untuk tes ACC admin",
        });
      expect(requestRes.status).toBe(201);
      pendingWdId = requestRes.body.data.id;
      expect(requestRes.body.data.status).toBe("pending");

      // Admin ACC transaksi ini
      const approveRes = await request(app)
        .patch(`/api/admin/sellers/withdrawals/${pendingWdId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "approve",
          adminNotes: "Transaksi telah berhasil, silakan periksa mutasi rekening Anda.",
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.status).toBe("completed");
      expect(approveRes.body.adminNotes).toContain("Transaksi telah berhasil");

      // Verifikasi di database bahwa status berubah menjadi completed
      const dbRow = db
        .prepare("SELECT status, admin_notes FROM seller_withdrawals WHERE id = ?")
        .get(pendingWdId) as { status: string; admin_notes: string };
      expect(dbRow.status).toBe("completed");
      expect(dbRow.admin_notes).toContain("Transaksi telah berhasil");

      // Penarikan yang sudah completed tidak boleh diproses ulang
      const reProcessRes = await request(app)
        .patch(`/api/admin/sellers/withdrawals/${pendingWdId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ decision: "approve" });
      expect(reProcessRes.status).toBe(400);
    });

    it("harus menolak (400) jika penolakan tanpa alasan atau alasan kurang dari 3 karakter", async () => {
      // Penjual ajukan penarikan baru 50.000
      const reqRes = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: testAccountId,
          amount: 50000,
        });
      expect(reqRes.status).toBe(201);
      const newWdId = reqRes.body.data.id;

      const noReasonRes = await request(app)
        .patch(`/api/admin/sellers/withdrawals/${newWdId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "reject",
          rejectionReason: "",
        });
      expect(noReasonRes.status).toBe(400);
      expect(noReasonRes.body.message).toContain("wajib diisi minimal 3 karakter");
    });

    it("harus berhasil menolak (reject) transaksi penarikan, menyimpan alasan, dan mengembalikan saldo toko penjual secara realtime", async () => {
      // Cek saldo penjual sebelum pengajuan kedua
      const beforeUser = db
        .prepare("SELECT store_balance FROM users WHERE id = ?")
        .get(sellerId) as { store_balance: number };
      const balanceBeforeWithdrawal = beforeUser.store_balance;

      const rejectAmount = 75000;
      const submitRes = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId: testAccountId,
          amount: rejectAmount,
          notes: "Penarikan yang akan ditolak",
        });
      expect(submitRes.status).toBe(201);
      const wdIdToReject = submitRes.body.data.id;

      // Saldo setelah withdraw berkurang sebesar 75.000
      const afterWithdraw = db
        .prepare("SELECT store_balance FROM users WHERE id = ?")
        .get(sellerId) as { store_balance: number };
      expect(afterWithdraw.store_balance).toBe(balanceBeforeWithdrawal - rejectAmount);

      // Admin menolak transaksi ini dengan alasan
      const rejectionReason = "Nama pemilik rekening dan nomor rekening tidak sesuai.";
      const rejectRes = await request(app)
        .patch(`/api/admin/sellers/withdrawals/${wdIdToReject}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "reject",
          rejectionReason,
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.status).toBe("rejected");
      expect(rejectRes.body.rejectionReason).toBe(rejectionReason);
      expect(rejectRes.body.refundedAmount).toBe(rejectAmount);
      expect(rejectRes.body.newSellerBalance).toBe(balanceBeforeWithdrawal);

      // Verifikasi langsung ke database: saldo toko penjual kembali ke nilai semula (refund)
      const afterRefundUser = db
        .prepare("SELECT store_balance FROM users WHERE id = ?")
        .get(sellerId) as { store_balance: number };
      expect(afterRefundUser.store_balance).toBe(balanceBeforeWithdrawal);

      // Verifikasi pencatatan di balance_mutations
      const refundMutation = db
        .prepare("SELECT * FROM balance_mutations WHERE user_id = ? AND type = 'refund' ORDER BY id DESC LIMIT 1")
        .get(sellerId) as {
        amount: number;
        balance_before: number;
        balance_after: number;
        type: string;
        description: string;
      };
      expect(refundMutation).toBeDefined();
      expect(refundMutation.amount).toBe(rejectAmount);
      expect(refundMutation.type).toBe("refund");
      expect(refundMutation.description).toContain(rejectionReason);

      // Verifikasi bahwa penjual melihat status rejected pada riwayat penarikannya
      const sellerWdRes = await request(app)
        .get("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(sellerWdRes.status).toBe(200);
      const rejectedItem = sellerWdRes.body.data.find((item: any) => item.id === wdIdToReject);
      expect(rejectedItem).toBeDefined();
      expect(rejectedItem.status).toBe("rejected");
      expect(rejectedItem.rejectionReason).toBe(rejectionReason);
    });
  });
});

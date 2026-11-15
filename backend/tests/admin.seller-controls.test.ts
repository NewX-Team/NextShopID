import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Admin Controls for Seller - Mall Suspension & Balance Freezing", () => {
  let adminToken = "";
  let sellerToken = "";
  let sellerId: number;
  let payoutAccountId: number;

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

    // Pastikan status penjual awal verified dan saldo mencukupi untuk uji penarikan
    db.prepare(`
      UPDATE users
      SET verification_status = 'verified',
          store_balance = 500000,
          is_balance_frozen = 0,
          balance_freeze_reason = NULL,
          mall_suspended_until = NULL,
          mall_suspension_reason = NULL,
          mall_suspension_hours = NULL
      WHERE id = ?
    `).run(sellerId);

    // Bersihkan data uji penarikan & payout accounts sebelumnya untuk seller ini
    db.prepare("DELETE FROM seller_withdrawals WHERE seller_id = ?").run(sellerId);
    db.prepare("DELETE FROM seller_payout_accounts WHERE seller_id = ?").run(sellerId);

    // Siapkan akun bank dummy
    const accRes = await request(app)
      .post("/api/seller/payout-accounts")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        method: "preset",
        accountType: "bank",
        providerName: "Bank Central Asia (BCA)",
        accountNumber: "8887776655",
        accountHolderName: "Toko Mitra Resmi",
        isAgreed: true,
      });
    expect([200, 201]).toContain(accRes.status);
    payoutAccountId = accRes.body.data.id;
  });

  afterAll(() => {
    // Bersihkan data uji coba
    db.prepare(`
      UPDATE users
      SET verification_status = 'unverified',
          store_balance = 0,
          is_balance_frozen = 0,
          balance_freeze_reason = NULL,
          mall_suspended_until = NULL,
          mall_suspension_reason = NULL,
          mall_suspension_hours = NULL
      WHERE id = ?
    `).run(sellerId);

    if (payoutAccountId) {
      db.prepare("DELETE FROM seller_withdrawals WHERE payout_account_id = ?").run(payoutAccountId);
      db.prepare("DELETE FROM seller_payout_accounts WHERE id = ?").run(payoutAccountId);
    }
  });

  describe("1. Kontrol Fungsi Mall / Verifikasi Penjual", () => {
    it("admin dapat menghentikan / mencabut status Mall penjual karena kontrak berakhir", async () => {
      const reason = "kontrak telah berakhir silahkan perpanjang kontrak";
      const res = await request(app)
        .patch(`/api/admin/verifications/${sellerId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "revoke",
          reason,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller.verificationStatus).toBe("unverified");
      expect(res.body.seller.verificationRejectionReason).toBe(reason);

      // Verifikasi di endpoint profil penjual
      const profileRes = await request(app)
        .get("/api/seller/profile")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.seller.verificationStatus).toBe("unverified");
    });

    it("admin harus menyertakan alasan saat menghentikan fungsi Mall", async () => {
      const res = await request(app)
        .patch(`/api/admin/verifications/${sellerId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "revoke",
          reason: "   ",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Alasan penghentian fungsi Mall wajib diisi");
    });

    it("admin dapat menyetujui kembali akun penjual menjadi verified", async () => {
      const res = await request(app)
        .patch(`/api/admin/verifications/${sellerId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ decision: "approve" });

      expect(res.status).toBe(200);
      expect(res.body.seller.verificationStatus).toBe("verified");
    });

    it("admin wajib menyertakan durasi penalti minimal 1 jam saat men-suspend toko", async () => {
      const res = await request(app)
        .patch(`/api/admin/verifications/${sellerId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "suspend",
          reason: "kena laporan dan di suspend sementara",
          durationHours: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Durasi penalti suspend wajib diisi minimal 1 jam");
    });

    it("admin dapat men-suspend sementara fungsi Mall penjual dengan durasi spesifik (misal: 24 jam)", async () => {
      const reason = "kena laporan dan di suspend sementara";
      const durationHours = 24;

      const res = await request(app)
        .patch(`/api/admin/verifications/${sellerId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decision: "suspend",
          reason,
          durationHours,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller.verificationStatus).toBe("suspended");
      expect(res.body.seller.mallSuspensionReason).toBe(reason);
      expect(res.body.seller.mallSuspensionHours).toBe(24);
      expect(res.body.seller.mallSuspendedUntil).toBeDefined();

      // Pastikan profil penjual mendeteksi penangguhan Mall aktif
      const profileRes = await request(app)
        .get("/api/seller/profile")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.seller.verificationStatus).toBe("suspended");
      expect(profileRes.body.seller.isMallSuspended).toBe(true);
      expect(profileRes.body.seller.mallSuspensionHours).toBe(24);
    });

    it("admin dapat mengaktifkan kembali (reactivate / buka suspend) status Mall", async () => {
      const res = await request(app)
        .patch(`/api/admin/verifications/${sellerId}/decision`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ decision: "reactivate" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller.verificationStatus).toBe("verified");
      expect(res.body.seller.mallSuspendedUntil).toBeNull();

      const profileRes = await request(app)
        .get("/api/seller/profile")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.seller.verificationStatus).toBe("verified");
      expect(profileRes.body.seller.isMallSuspended).toBe(false);
    });
  });

  describe("2. Fitur Pembekuan Saldo Penjual oleh Admin", () => {
    it("admin wajib menyertakan alasan saat membekukan saldo", async () => {
      const res = await request(app)
        .patch(`/api/admin/sellers/${sellerId}/balance/freeze`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "freeze",
          reason: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Alasan pembekuan saldo wajib diisi");
    });

    it("admin dapat membekukan saldo toko penjual dengan alasan kecurangan/tindakan ilegal", async () => {
      const reason = "Terjadi kecurangan transaksi dan indikasi tindakan ilegal.";
      const res = await request(app)
        .patch(`/api/admin/sellers/${sellerId}/balance/freeze`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "freeze",
          reason,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller.isBalanceFrozen).toBe(true);
      expect(res.body.seller.balanceFreezeReason).toBe(reason);

      // Verifikasi pada list saldo admin
      const balancesRes = await request(app)
        .get("/api/admin/sellers/balances?balanceStatus=frozen")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(balancesRes.status).toBe(200);
      expect(balancesRes.body.stats.frozenSellersCount).toBeGreaterThanOrEqual(1);
      const found = balancesRes.body.data.find((s: any) => s.id === sellerId);
      expect(found).toBeDefined();
      expect(found.isBalanceFrozen).toBe(true);
      expect(found.balanceFreezeReason).toBe(reason);
    });

    it("penjual ditolak (403) saat mengajukan penarikan dana jika saldo dibekukan", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId,
          amount: 50000,
          notes: "Penarikan darurat",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("sedang dibekukan oleh Admin");
    });

    it("admin dapat membuka pembekuan saldo penjual", async () => {
      const res = await request(app)
        .patch(`/api/admin/sellers/${sellerId}/balance/freeze`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: "unfreeze",
          reason: "Penyelidikan selesai, akun dinyatakan bersih.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seller.isBalanceFrozen).toBe(false);
      expect(res.body.seller.balanceFreezeReason).toBeNull();
    });

    it("penjual dapat kembali menarik saldo setelah pembekuan saldo dibuka", async () => {
      const res = await request(app)
        .post("/api/seller/withdrawals")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          payoutAccountId,
          amount: 50000,
          notes: "Penarikan setelah unfreeze",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("pending");
    });
  });
});

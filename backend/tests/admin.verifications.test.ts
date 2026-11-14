import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Admin Merchant Verifications API - GET & PATCH /api/admin/verifications", () => {
  let adminToken = "";
  let sellerToken = "";
  let buyerToken = "";
  let sellerId: number;

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
  });

  it("harus menolak akses (401) jika request tidak menyertakan token", async () => {
    const res = await request(app).get("/api/admin/verifications");
    expect(res.status).toBe(401);
  });

  it("harus menolak akses (403) jika diakses oleh akun non-admin (penjual / pembeli)", async () => {
    const sellerAccess = await request(app)
      .get("/api/admin/verifications")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(sellerAccess.status).toBe(403);

    const buyerAccess = await request(app)
      .get("/api/admin/verifications")
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(buyerAccess.status).toBe(403);
  });

  it("admin dapat mengambil daftar verifikasi seluruh penjual beserta statistik realtime", async () => {
    const res = await request(app)
      .get("/api/admin/verifications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.totalPenjual).toBe("number");
    expect(typeof res.body.stats.pendingCount).toBe("number");
    expect(typeof res.body.stats.verifiedCount).toBe("number");
    expect(typeof res.body.stats.rejectedCount).toBe("number");
    expect(typeof res.body.stats.unverifiedCount).toBe("number");
  });

  it("admin dapat menolak keputusan jika parameter decision tidak valid", async () => {
    const res = await request(app)
      .patch(`/api/admin/verifications/${sellerId}/decision`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "invalid_decision" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("admin wajib menyertakan alasan penolakan saat menolak verifikasi", async () => {
    const res = await request(app)
      .patch(`/api/admin/verifications/${sellerId}/decision`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "reject", reason: "   " });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Alasan penolakan wajib diisi");
  });

  it("admin dapat menolak pengajuan verifikasi penjual dengan alasan spesifik", async () => {
    const rejectionReason = "Foto KTP buram dan NIK tidak terbaca jelas pada sistem OCR.";
    const res = await request(app)
      .patch(`/api/admin/verifications/${sellerId}/decision`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        decision: "reject",
        reason: rejectionReason,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.seller.verificationStatus).toBe("rejected");
    expect(res.body.seller.verificationRejectionReason).toBe(rejectionReason);

    // Verifikasi pada list verifikasi terfilter status 'rejected'
    const listRes = await request(app)
      .get("/api/admin/verifications?status=rejected")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((s: any) => s.id === sellerId);
    expect(found).toBeDefined();
    expect(found.verificationStatus).toBe("rejected");
  });

  it("admin dapat menyetujui (ACC / approve) verifikasi toko penjual", async () => {
    const res = await request(app)
      .patch(`/api/admin/verifications/${sellerId}/decision`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.seller.verificationStatus).toBe("verified");
    expect(res.body.seller.verificationRejectionReason).toBeNull();

    // Verifikasi pada list status 'verified'
    const listRes = await request(app)
      .get("/api/admin/verifications?status=verified")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((s: any) => s.id === sellerId);
    expect(found).toBeDefined();
    expect(found.verificationStatus).toBe("verified");
  });

  it("admin dapat mengembalikan status verifikasi penjual ke pending (tinjau ulang)", async () => {
    const note = "Memerlukan peninjauan berkas tambahan.";
    const res = await request(app)
      .patch(`/api/admin/verifications/${sellerId}/decision`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "pending", reason: note });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.seller.verificationStatus).toBe("pending");
  });

  it("harus mengembalikan 404 jika seller ID tidak ditemukan atau bukan role penjual", async () => {
    const res = await request(app)
      .patch("/api/admin/verifications/999999/decision")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  afterAll(() => {
    // Reset status verifikasi penjual agar database tetap bersih untuk test suite berikutnya
    db.prepare(`
      UPDATE users 
      SET verification_status = 'unverified', 
          verification_data = NULL, 
          verification_submitted_at = NULL, 
          verification_rejection_reason = NULL 
      WHERE username = 'penjual'
    `).run();
  });
});

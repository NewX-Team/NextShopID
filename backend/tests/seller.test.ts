import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/config/database";

describe("Seller API - GET /api/seller/profile & PATCH /api/seller/store-status", () => {
  let sellerToken = "";
  let userToken = "";

  beforeAll(async () => {
    // Reset status verifikasi penjual default ke 'unverified' agar terisolasi dari suite lain
    db.prepare(`
      UPDATE users 
      SET verification_status = 'unverified', 
          verification_data = NULL, 
          verification_submitted_at = NULL, 
          verification_rejection_reason = NULL 
      WHERE username = 'penjual'
    `).run();

    // 1. Login sebagai Penjual
    const sellerRes = await request(app).post("/api/auth/login").send({
      identifier: "penjual",
      password: "penjual12345",
    });
    expect(sellerRes.status).toBe(200);
    sellerToken = sellerRes.body.token;

    // 2. Login sebagai Pembeli biasa
    const userRes = await request(app).post("/api/auth/login").send({
      identifier: "pembeli",
      password: "pembeli12345",
    });
    expect(userRes.status).toBe(200);
    userToken = userRes.body.token;
  });

  it("harus menolak akses (401) jika request tidak menyertakan token", async () => {
    const res = await request(app).get("/api/seller/profile");
    expect(res.status).toBe(401);
  });

  it("harus menolak akses (403) jika diakses oleh user non-penjual", async () => {
    const res = await request(app)
      .get("/api/seller/profile")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("harus berhasil mengembalikan profil dan statistik realtime penjual dengan nilai asli (0)", async () => {
    const res = await request(app)
      .get("/api/seller/profile")
      .set("Authorization", `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.seller).toBeDefined();
    expect(res.body.seller.username).toBe("penjual");
    expect(res.body.seller.role).toBe("penjual");
    expect(typeof res.body.seller.balance).toBe("number");
    expect(typeof res.body.seller.isStoreOpen).toBe("boolean");
    expect(res.body.seller.stats).toBeDefined();
    // Verifikasi bahwa metrik masih kosong / 0 aktual tanpa data dummy
    expect(res.body.seller.stats.totalProducts).toBe(0);
    expect(res.body.seller.stats.totalOrders).toBe(0);
    expect(res.body.seller.stats.totalReviews).toBe(0);
  });

  it("harus dapat mengubah status buka/tutup toko secara realtime via PATCH /api/seller/store-status", async () => {
    // 1. Liburkan toko (tutup)
    const closeRes = await request(app)
      .patch("/api/seller/store-status")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ isStoreOpen: false });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.success).toBe(true);
    expect(closeRes.body.isStoreOpen).toBe(false);

    // Verifikasi bahwa profil toko membaca status toko yang telah ditutup
    const profileAfterClose = await request(app)
      .get("/api/seller/profile")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(profileAfterClose.body.seller.isStoreOpen).toBe(false);

    // 2. Buka kembali toko
    const openRes = await request(app)
      .patch("/api/seller/store-status")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ isStoreOpen: true });

    expect(openRes.status).toBe(200);
    expect(openRes.body.success).toBe(true);
    expect(openRes.body.isStoreOpen).toBe(true);

    const profileAfterOpen = await request(app)
      .get("/api/seller/profile")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(profileAfterOpen.body.seller.isStoreOpen).toBe(true);
  });

  it("harus menolak jika body isStoreOpen bukan boolean", async () => {
    const res = await request(app)
      .patch("/api/seller/store-status")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ isStoreOpen: "buka" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  describe("Seller Verification Flow - GET & POST /api/seller/verification", () => {
    it("harus menolak akses verifikasi tanpa token otentikasi (401)", async () => {
      const getRes = await request(app).get("/api/seller/verification");
      expect(getRes.status).toBe(401);

      const postRes = await request(app).post("/api/seller/verification").send({});
      expect(postRes.status).toBe(401);
    });

    it("harus menolak pengajuan verifikasi jika field wajib tidak lengkap (400)", async () => {
      const res = await request(app)
        .post("/api/seller/verification")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          ownerName: "Jo", // Kurang dari 3 karakter
          idCardNumber: "123", // Kurang dari 8 digit
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("harus berhasil mengajukan verifikasi toko ke admin dan mengubah status menjadi pending", async () => {
      // 1. Dapatkan status awal
      const initialGet = await request(app)
        .get("/api/seller/verification")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(initialGet.status).toBe(200);
      expect(initialGet.body.success).toBe(true);

      // 2. Ajukan verifikasi toko
      const payload = {
        ownerName: "Budi Santoso",
        idCardNumber: "3201234567890001",
        phoneNumber: "081234567890",
        businessType: "umkm",
        storeDescription: "Toko resmi produk kerajinan kulit lokal Nusantara",
        idCardPhoto: "data:image/png;base64,mockKtpData",
        selfiePhoto: "data:image/png;base64,mockSelfieData",
        notes: "Mohon ditinjau verifikasi toko resmi kami, terima kasih admin.",
      };

      const postRes = await request(app)
        .post("/api/seller/verification")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send(payload);

      expect(postRes.status).toBe(200);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.verificationStatus).toBe("pending");
      expect(postRes.body.data.ownerName).toBe("Budi Santoso");

      // 3. Verifikasi pembacaan status terbaru via GET /api/seller/verification
      const updatedGet = await request(app)
        .get("/api/seller/verification")
        .set("Authorization", `Bearer ${sellerToken}`);

      expect(updatedGet.status).toBe(200);
      expect(updatedGet.body.verificationStatus).toBe("pending");
      expect(updatedGet.body.data.idCardNumber).toBe("3201234567890001");
      expect(updatedGet.body.submittedAt).toBeTruthy();

      // 4. Verifikasi bahwa profil penjual juga merefleksikan verificationStatus === "pending"
      const profileRes = await request(app)
        .get("/api/seller/profile")
        .set("Authorization", `Bearer ${sellerToken}`);
      expect(profileRes.body.seller.verificationStatus).toBe("pending");
    });

    it("harus menolak pengajuan ulang jika status verifikasi sedang pending", async () => {
      const duplicateRes = await request(app)
        .post("/api/seller/verification")
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          ownerName: "Budi Santoso",
          idCardNumber: "3201234567890001",
          phoneNumber: "081234567890",
          businessType: "umkm",
        });

      expect(duplicateRes.status).toBe(400);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toContain("sedang dalam proses peninjauan admin");
    });
  });
});

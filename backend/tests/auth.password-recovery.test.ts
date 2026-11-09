import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import { app } from "../src/app";
import { db, resetDatabaseForTesting } from "../src/config/database";
import { ENV } from "../src/config/env";

describe("Auth Password Recovery & Change Password", () => {
  beforeEach(() => {
    resetDatabaseForTesting();
    // Bersihkan file log email testing jika ada
    if (fs.existsSync(ENV.MAIL_LOG_PATH)) {
      fs.unlinkSync(ENV.MAIL_LOG_PATH);
    }
  });

  describe("POST /api/auth/forgot-password", () => {
    it("harus berhasil memproses permintaan reset kata sandi dan membuat token di database", async () => {
      const email = "pembeli@gmail.com";

      const res = await request(app).post("/api/auth/forgot-password").send({ email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verifikasi token tersimpan di database
      const record = db
        .prepare("SELECT * FROM password_resets WHERE email = ?")
        .get(email) as any;

      expect(record).toBeDefined();
      expect(record.token).toHaveLength(64); // 32 byte hex

      // Verifikasi file mail log testing terbuat dan berisi tautan reset
      expect(fs.existsSync(ENV.MAIL_LOG_PATH)).toBe(true);
      const logContent = fs.readFileSync(ENV.MAIL_LOG_PATH, "utf-8");
      expect(logContent).toContain(record.token);
      expect(logContent).toContain(email);
    });

    it("harus mengembalikan status 400 jika field email kosong", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("harus mengembalikan status 400 jika format email tidak valid", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "bukan-email" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("harus mengembalikan status 200 generik walau email tidak terdaftar (anti-enumeration)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "tidak-terdaftar@gmail.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Tidak boleh ada token yang di-insert ke database untuk email tak terdaftar
      const record = db
        .prepare("SELECT * FROM password_resets WHERE email = ?")
        .get("tidak-terdaftar@gmail.com");
      expect(record).toBeUndefined();
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("harus berhasil mereset kata sandi dengan token valid dan token diinvalidasi", async () => {
      const email = "pembeli@gmail.com";

      // 1. Minta token forgot password
      await request(app).post("/api/auth/forgot-password").send({ email });

      const record = db
        .prepare("SELECT token FROM password_resets WHERE email = ?")
        .get(email) as any;
      const validToken = record.token;

      // 2. Reset kata sandi
      const newPassword = "newpembelipassword123";
      const resetRes = await request(app).post("/api/auth/reset-password").send({
        token: validToken,
        password: newPassword,
        confirmPassword: newPassword,
      });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Token harus sudah terhapus dari tabel
      const checkRecord = db
        .prepare("SELECT * FROM password_resets WHERE token = ?")
        .get(validToken);
      expect(checkRecord).toBeUndefined();

      // 4. Pengguna harus bisa login dengan kata sandi baru
      const loginRes = await request(app).post("/api/auth/login").send({
        identifier: email,
        password: newPassword,
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);

      // 5. Login dengan kata sandi lama harus gagal
      const oldLoginRes = await request(app).post("/api/auth/login").send({
        identifier: email,
        password: "pembeli12345",
      });
      expect(oldLoginRes.status).toBe(401);
    });

    it("harus mengembalikan status 400 jika token palsu / tidak valid", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        token: "fake-token-1234567890",
        password: "newpassword123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token.*tidak valid/i);
    });

    it("harus mengembalikan status 400 jika konfirmasi kata sandi tidak cocok", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({
        token: "any-token",
        password: "newpassword123",
        confirmPassword: "differentpassword",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/konfirmasi.*tidak cocok/i);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("harus berhasil mengubah kata sandi untuk pengguna terotentikasi", async () => {
      // 1. Login untuk mendapatkan Bearer token
      const loginRes = await request(app).post("/api/auth/login").send({
        identifier: "pembeli@gmail.com",
        password: "pembeli12345",
      });
      const token = loginRes.body.token;

      // 2. Ganti kata sandi
      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "pembeli12345",
          newPassword: "gantipasswordbaru123",
          confirmPassword: "gantipasswordbaru123",
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // 3. Login ulang dengan kata sandi baru
      const verifyLogin = await request(app).post("/api/auth/login").send({
        identifier: "pembeli@gmail.com",
        password: "gantipasswordbaru123",
      });
      expect(verifyLogin.status).toBe(200);
    });

    it("harus mengembalikan status 400 jika kata sandi lama salah", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        identifier: "pembeli@gmail.com",
        password: "pembeli12345",
      });
      const token = loginRes.body.token;

      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "passwordsalah",
          newPassword: "gantipasswordbaru123",
        });

      expect(changeRes.status).toBe(400);
      expect(changeRes.body.success).toBe(false);
      expect(changeRes.body.message).toMatch(/kata sandi.*salah/i);
    });

    it("harus mengembalikan status 400 jika kata sandi baru sama dengan kata sandi saat ini", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        identifier: "pembeli@gmail.com",
        password: "pembeli12345",
      });
      const token = loginRes.body.token;

      const changeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "pembeli12345",
          newPassword: "pembeli12345",
        });

      expect(changeRes.status).toBe(400);
      expect(changeRes.body.success).toBe(false);
      expect(changeRes.body.message).toMatch(/tidak boleh sama/i);
    });

    it("harus menolak (401 Unauthorized) jika request tidak menyertakan token", async () => {
      const changeRes = await request(app).post("/api/auth/change-password").send({
        currentPassword: "pembeli12345",
        newPassword: "gantipasswordbaru123",
      });

      expect(changeRes.status).toBe(401);
      expect(changeRes.body.success).toBe(false);
    });
  });
});

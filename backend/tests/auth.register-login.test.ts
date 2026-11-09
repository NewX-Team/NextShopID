import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDatabaseForTesting } from "../src/config/database";

describe("Auth API - Register, Login & Profile", () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  describe("POST /api/auth/register", () => {
    it("harus berhasil mendaftarkan pengguna baru dengan status 201", async () => {
      const payload = {
        name: "Testing User",
        username: "testinguser",
        email: "testinguser@example.com",
        password: "password123",
      };

      const res = await request(app).post("/api/auth/register").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.username).toBe("testinguser");
      expect(res.body.user.email).toBe("testinguser@example.com");
      expect(res.body.user.role).toBe("user");
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("harus mengembalikan status 400 jika field tidak lengkap", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "User Incomplete",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("harus mengembalikan status 400 jika password kurang dari 6 karakter", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Short Pass",
        username: "shortpass",
        email: "shortpass@example.com",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/minimal 6 karakter/i);
    });

    it("harus mengembalikan status 400 jika format email tidak valid", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Invalid Email",
        username: "invalidemail",
        email: "bukan-email-valid",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/format email tidak valid/i);
    });

    it("harus mengembalikan status 400 jika username atau email sudah terdaftar", async () => {
      // Akun pembeli@gmail.com sudah dibuat oleh seeder default
      const res = await request(app).post("/api/auth/register").send({
        name: "Duplicate User",
        username: "pembeli",
        email: "pembeli-baru@gmail.com",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/username sudah terdaftar/i);
    });
  });

  describe("POST /api/auth/login", () => {
    it("harus berhasil login menggunakan username terdaftar", async () => {
      const res = await request(app).post("/api/auth/login").send({
        identifier: "pembeli",
        password: "pembeli12345",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.username).toBe("pembeli");
      expect(res.body.user.role).toBe("user");
    });

    it("harus berhasil login menggunakan email terdaftar", async () => {
      const res = await request(app).post("/api/auth/login").send({
        identifier: "pembeli@gmail.com",
        password: "pembeli12345",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("pembeli@gmail.com");
    });

    it("harus mengembalikan status 401 jika password salah", async () => {
      const res = await request(app).post("/api/auth/login").send({
        identifier: "pembeli",
        password: "passwordsalah",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("harus mengembalikan status 401 jika user tidak ditemukan", async () => {
      const res = await request(app).post("/api/auth/login").send({
        identifier: "tidakada@gmail.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me", () => {
    it("harus berhasil mengambil profil jika menyertakan Bearer token valid", async () => {
      // 1. Login dulu untuk mendapatkan JWT token
      const loginRes = await request(app).post("/api/auth/login").send({
        identifier: "pembeli",
        password: "pembeli12345",
      });
      const token = loginRes.body.token;

      // 2. Akses endpoint terproteksi /me
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.user.username).toBe("pembeli");
      expect(meRes.body.user).not.toHaveProperty("password");
    });

    it("harus mengembalikan status 401 jika tidak menyertakan Authorization header", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("harus mengembalikan status 401 jika token JWT tidak valid / corrupt", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken12345");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

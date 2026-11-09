import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDatabaseForTesting } from "../src/config/database";

describe("Auth RBAC (Role-Based Access Control)", () => {
  let adminToken: string;
  let penjualToken: string;
  let userToken: string;

  beforeAll(async () => {
    resetDatabaseForTesting();

    // Login sebagai Admin
    const adminLogin = await request(app).post("/api/auth/login").send({
      identifier: "admin",
      password: "admin12345",
    });
    adminToken = adminLogin.body.token;

    // Login sebagai Penjual
    const penjualLogin = await request(app).post("/api/auth/login").send({
      identifier: "penjual",
      password: "penjual12345",
    });
    penjualToken = penjualLogin.body.token;

    // Login sebagai User/Pembeli
    const userLogin = await request(app).post("/api/auth/login").send({
      identifier: "pembeli",
      password: "pembeli12345",
    });
    userToken = userLogin.body.token;
  });

  describe("GET /api/auth/admin-only", () => {
    it("harus mengizinkan akses jika pengguna ber-role 'admin'", async () => {
      const res = await request(app)
        .get("/api/auth/admin-only")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Selamat datang Admin/i);
    });

    it("harus menolak akses (403 Forbidden) jika pengguna ber-role 'user'", async () => {
      const res = await request(app)
        .get("/api/auth/admin-only")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("harus menolak akses (403 Forbidden) jika pengguna ber-role 'penjual'", async () => {
      const res = await request(app)
        .get("/api/auth/admin-only")
        .set("Authorization", `Bearer ${penjualToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("harus menolak akses (401 Unauthorized) jika tidak menyertakan token", async () => {
      const res = await request(app).get("/api/auth/admin-only");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/penjual-only", () => {
    it("harus mengizinkan akses jika pengguna ber-role 'penjual'", async () => {
      const res = await request(app)
        .get("/api/auth/penjual-only")
        .set("Authorization", `Bearer ${penjualToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Selamat datang Penjual/i);
    });

    it("harus menolak akses (403 Forbidden) jika pengguna ber-role 'user'", async () => {
      const res = await request(app)
        .get("/api/auth/penjual-only")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});

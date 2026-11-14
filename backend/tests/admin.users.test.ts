import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Admin User Management API - GET /api/admin/users & Actions", () => {
  let adminToken = "";
  let userToken = "";
  let testUserId = 0;

  beforeAll(async () => {
    // 1. Login sebagai Admin
    const adminRes = await request(app).post("/api/auth/login").send({
      identifier: "admin",
      password: "admin12345",
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Login sebagai User Biasa (Pembeli)
    const userRes = await request(app).post("/api/auth/login").send({
      identifier: "pembeli",
      password: "pembeli12345",
    });
    expect(userRes.status).toBe(200);
    userToken = userRes.body.token;
  });

  it("harus menolak (401) jika request tidak menyertakan token otentikasi", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("harus menolak (403) jika diakses oleh user non-admin", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("harus berhasil mengambil daftar pengguna dan statistik saat diakses admin", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.total).toBeGreaterThanOrEqual(res.body.data.length);
    expect(res.body.stats.totalAdmin).toBeGreaterThanOrEqual(1);
  });

  it("harus memfilter daftar pengguna berdasarkan role 'penjual'", async () => {
    const res = await request(app)
      .get("/api/admin/users?role=penjual")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((u: { role: string }) => u.role === "penjual")).toBe(true);
  });

  it("harus memfilter daftar pengguna berdasarkan kata kunci pencarian", async () => {
    const res = await request(app)
      .get("/api/admin/users?search=admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      res.body.data.some(
        (u: { username: string; email: string }) =>
          u.username.includes("admin") || u.email.includes("admin")
      )
    ).toBe(true);
  });

  it("harus menolak perubahan role pada superadmin utama #1", async () => {
    const res = await request(app)
      .patch("/api/admin/users/1/role")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "user" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("harus berhasil memperbarui role pengguna lain", async () => {
    // Buat akun dummy baru untuk diubah
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Pengguna Uji Role",
      username: "useruji_" + Date.now(),
      email: "useruji_" + Date.now() + "@gmail.com",
      password: "password123",
    });
    expect(regRes.status).toBe(201);
    testUserId = regRes.body.user.id;

    const patchRes = await request(app)
      .patch(`/api/admin/users/${testUserId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "penjual" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.user.role).toBe("penjual");
  });

  it("harus menolak penghapusan superadmin utama #1", async () => {
    const res = await request(app)
      .delete("/api/admin/users/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("harus berhasil menghapus pengguna", async () => {
    const deleteRes = await request(app)
      .delete(`/api/admin/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it("harus dapat membaca status server dari endpoint publik GET /api/system/status", async () => {
    const res = await request(app).get("/api/system/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.serverActive).toBe("boolean");
  });

  it("admin harus dapat mengubah status on/off server melalui PATCH /api/admin/server-status", async () => {
    // Matikan server (OFF)
    const turnOffRes = await request(app)
      .patch("/api/admin/server-status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ active: false });

    expect(turnOffRes.status).toBe(200);
    expect(turnOffRes.body.serverActive).toBe(false);

    // Verifikasi pada endpoint publik bahwa server benar-benar berstatus OFF
    const checkOff = await request(app).get("/api/system/status");
    expect(checkOff.body.serverActive).toBe(false);

    // Nyalakan kembali server (ON)
    const turnOnRes = await request(app)
      .patch("/api/admin/server-status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ active: true });

    expect(turnOnRes.status).toBe(200);
    expect(turnOnRes.body.serverActive).toBe(true);

    const checkOn = await request(app).get("/api/system/status");
    expect(checkOn.body.serverActive).toBe(true);
  });
});

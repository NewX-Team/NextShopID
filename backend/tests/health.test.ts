import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("Health Check API", () => {
  it("GET /health - harus mengembalikan status ok dan timestamp", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("environment", "test");
  });

  it("GET /api/docs.json - harus mengembalikan spesifikasi OpenAPI 3.0 valid", async () => {
    const res = await request(app).get("/api/docs.json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("openapi", "3.0.0");
    expect(res.body.info).toHaveProperty("title", "NextShopID REST API Documentation");
    expect(res.body.paths).toHaveProperty("/api/auth/login");
    expect(res.body.paths).toHaveProperty("/api/auth/forgot-password");
  });

  it("GET /api/docs/ - harus menyajikan antarmuka visual Swagger UI", async () => {
    const res = await request(app).get("/api/docs/");

    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });
});

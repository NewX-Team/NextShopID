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
});

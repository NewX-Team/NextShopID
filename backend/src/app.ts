import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { ENV } from "./config/env";
import { initDatabase } from "./config/database";
import { swaggerSpec } from "./config/swagger";
import { apiRouter } from "./routes";

// Inisialisasi koneksi SQLite dan schema tabel
initDatabase();

export const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  });
});

// Swagger OpenAPI UI & JSON Spec
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "NextShopID API Documentation",
  })
);
app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// Root API Endpoint
app.use("/api", apiRouter);

import express, { Request, Response } from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { initDatabase } from "./config/database";
import { apiRouter } from "./routes";

// Inisialisasi koneksi SQLite, auto-migrasi tabel, dan seeder admin default
initDatabase();

const app = express();

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

// Root API Endpoint
app.use("/api", apiRouter);

// Start Server
app.listen(ENV.PORT, () => {
  console.log(`[NextShopID Backend] Server running on http://localhost:${ENV.PORT}`);
  console.log(`[NextShopID Backend] API endpoint: http://localhost:${ENV.PORT}/api`);
});

import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { adminRoutes } from "./admin.routes";
import { isServerActive } from "../config/database";

/**
 * Root Router API (/api)
 * Setiap penambahan modul baru (misal: products, orders, cart)
 * tinggal daftarkan router-nya di sini.
 */
const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/admin", adminRoutes);

// Endpoint Publik Status Server (bisa dicek secara realtime oleh frontend)
apiRouter.get("/system/status", (_req, res) => {
  res.json({
    success: true,
    serverActive: isServerActive(),
    timestamp: new Date().toISOString(),
  });
});

export { apiRouter };

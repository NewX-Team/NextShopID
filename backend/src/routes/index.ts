import { Router } from "express";
import { authRoutes } from "./auth.routes";

/**
 * Root Router API (/api)
 * Setiap penambahan modul baru (misal: products, orders, cart)
 * tinggal daftarkan router-nya di sini.
 */
const apiRouter = Router();

apiRouter.use("/auth", authRoutes);

export { apiRouter };

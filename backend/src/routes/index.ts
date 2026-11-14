import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { adminRoutes } from "./admin.routes";

/**
 * Root Router API (/api)
 * Setiap penambahan modul baru (misal: products, orders, cart)
 * tinggal daftarkan router-nya di sini.
 */
const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/admin", adminRoutes);

export { apiRouter };

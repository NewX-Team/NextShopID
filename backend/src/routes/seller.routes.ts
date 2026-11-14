import { Router } from "express";
import { sellerController } from "../controllers/seller.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Seluruh route seller diproteksi: wajib login dan memiliki role 'penjual'
router.use(authenticate, requireRole(["penjual"]));

// Profil & Statistik Realtime Penjual
router.get("/profile", sellerController.getProfile.bind(sellerController));

// Pengajuan & Status Verifikasi Toko ke Admin
router.get("/verification", sellerController.getVerification.bind(sellerController));
router.post("/verification", sellerController.submitVerification.bind(sellerController));

// Kontrol On/Off Operasional Toko (Buka/Tutup)
router.patch("/store-status", sellerController.updateStoreStatus.bind(sellerController));

export const sellerRoutes = router;

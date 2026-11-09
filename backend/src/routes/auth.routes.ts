import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Endpoint Publik: Pendaftaran, Login, dan Pemulihan Kata Sandi
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/forgot-password", authController.forgotPassword.bind(authController));
router.post("/reset-password", authController.resetPassword.bind(authController));

// Endpoint Privat: Ambil profil dan Penggantian Kata Sandi Terotentikasi
router.get("/me", authenticate, authController.me.bind(authController));
router.post("/change-password", authenticate, authController.changePassword.bind(authController));

// Endpoint Khusus Role Admin (RBAC Guard)
router.get(
  "/admin-only",
  authenticate,
  requireRole(["admin"]),
  (req, res) => {
    res.json({
      success: true,
      message: `Akses diterima. Selamat datang Admin: ${req.user?.username}`,
    });
  }
);

// Endpoint Khusus Role Penjual (RBAC Guard)
router.get(
  "/penjual-only",
  authenticate,
  requireRole(["penjual"]),
  (req, res) => {
    res.json({
      success: true,
      message: `Akses diterima. Selamat datang Penjual: ${req.user?.username}`,
    });
  }
);

export const authRoutes = router;

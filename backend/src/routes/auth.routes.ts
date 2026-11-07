import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Endpoint Publik: Pendaftaran dan Login
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));

// Endpoint Privat: Ambil data akun sendiri berdasarkan token
router.get("/me", authenticate, authController.me.bind(authController));

// Endpoint Khusus Admin (RBAC check test)
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

export const authRoutes = router;

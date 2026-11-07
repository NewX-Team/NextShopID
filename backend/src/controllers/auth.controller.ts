import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export class AuthController {
  /**
   * Endpoint: POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, username, email, password } = req.body;

      // Validasi kelengkapan field request
      if (!name || !username || !email || !password) {
        res.status(400).json({
          success: false,
          message: "Field name, username, email, dan password wajib diisi.",
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: "Password minimal 6 karakter.",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Format email tidak valid.",
        });
        return;
      }

      const user = await authService.register({
        name,
        username,
        email,
        password,
      });

      res.status(201).json({
        success: true,
        message: "Pendaftaran akun berhasil.",
        user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat pendaftaran akun.",
      });
    }
  }

  /**
   * Endpoint: POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: "Username/Email dan password wajib diisi.",
        });
        return;
      }

      const { user, token } = await authService.login({
        identifier,
        password,
      });

      res.status(200).json({
        success: true,
        message: "Login berhasil.",
        token,
        user,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Kredensial tidak valid.",
      });
    }
  }

  /**
   * Endpoint: GET /api/auth/me (Protected - butuh header Bearer token)
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Sesi tidak ditemukan.",
        });
        return;
      }

      const user = authService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan di database.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data profil pengguna.",
      });
    }
  }
}

export const authController = new AuthController();

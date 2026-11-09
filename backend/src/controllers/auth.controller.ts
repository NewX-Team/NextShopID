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

  /**
   * Endpoint: POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Field email wajib diisi.",
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

      await authService.forgotPassword({ email });

      res.status(200).json({
        success: true,
        message:
          "Jika email Anda terdaftar, tautan pemulihan kata sandi telah dikirimkan ke kotak masuk Anda.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan saat memproses permintaan reset kata sandi.",
      });
    }
  }

  /**
   * Endpoint: POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: "Token dan kata sandi baru wajib diisi.",
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: "Kata sandi baru minimal 6 karakter.",
        });
        return;
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: "Konfirmasi kata sandi tidak cocok.",
        });
        return;
      }

      await authService.resetPassword({ token, password });

      res.status(200).json({
        success: true,
        message: "Kata sandi Anda berhasil diperbarui. Silakan login kembali dengan kata sandi baru.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Gagal mengatur ulang kata sandi.",
      });
    }
  }

  /**
   * Endpoint: POST /api/auth/change-password (Protected - butuh Bearer token)
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Sesi autentikasi tidak ditemukan.",
        });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Kata sandi saat ini dan kata sandi baru wajib diisi.",
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "Kata sandi baru minimal 6 karakter.",
        });
        return;
      }

      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: "Konfirmasi kata sandi baru tidak cocok.",
        });
        return;
      }

      await authService.changePassword(req.user.id, {
        currentPassword,
        newPassword,
      });

      res.status(200).json({
        success: true,
        message: "Kata sandi berhasil diperbarui.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Gagal mengubah kata sandi.",
      });
    }
  }
}

export const authController = new AuthController();

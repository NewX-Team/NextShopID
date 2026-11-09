import { LoginInput, RegisterInput, AuthResponse } from "@/types/auth";

// URL dasar API Backend Express
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const authService = {
  /**
   * Mengirim request login ke endpoint POST /api/auth/login di Express
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Login gagal, silakan periksa kembali data Anda.",
        };
      }

      return {
        success: true,
        message: result.message || "Login berhasil.",
        token: result.token,
        user: result.user,
      };
    } catch (error) {
      console.error("[authService.login] Gagal memanggil backend Express:", error);
      return {
        success: false,
        message: "Tidak dapat terhubung ke server backend. Pastikan server backend sedang berjalan di http://localhost:5001.",
      };
    }
  },

  /**
   * Mengirim request registrasi user baru ke endpoint POST /api/auth/register di Express
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    try {
      // Exclude field newPassword (hanya dipakai untuk validasi di sisi client)
      const payload = {
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Pendaftaran akun gagal.",
        };
      }

      return {
        success: true,
        message: result.message || "Pendaftaran akun berhasil.",
        user: result.user,
      };
    } catch (error) {
      console.error("[authService.register] Gagal memanggil backend Express:", error);
      return {
        success: false,
        message: "Tidak dapat terhubung ke server backend. Pastikan server backend sedang berjalan di http://localhost:5001.",
      };
    }
  },

  /**
   * Mengambil data profil user saat ini (GET /api/auth/me) menggunakan JWT token
   */
  async getProfile(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Sesi login tidak valid.",
        };
      }

      return {
        success: true,
        message: "Profil berhasil diambil.",
        user: result.user,
      };
    } catch (error) {
      console.error("[authService.getProfile] Gagal mengambil profil:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend.",
      };
    }
  },
};

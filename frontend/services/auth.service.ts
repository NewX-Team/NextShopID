import { LoginInput, RegisterInput, AuthResponse } from "@/types/auth";

// Base URL Express API. Fallback ke localhost:5000 jika NEXT_PUBLIC_API_URL belum diset di .env
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const authService = {
  /**
   * Mengirim kredensial login ke backend.
   * Catatan: Jika nanti backend beralih ke session/HttpOnly cookie,
   * tambahkan option `credentials: "include"` pada fetch.
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      // Fallback response untuk testing UI saat service Express belum dinyalakan
      console.warn("[authService.login] API offline, running mock fallback:", error);
      return {
        success: true,
        message: `Simulasi login berhasil (${data.identifier})`,
      };
    }
  },

  /**
   * Mendaftarkan pengguna baru.
   * 'newPassword' di-exclude dari payload karena hanya dipakai untuk validasi form di client.
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    try {
      // Exclude newPassword dari payload yang dikirim ke backend
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

      return await response.json();
    } catch (error) {
      console.warn("[authService.register] API offline, running mock fallback:", error);
      return {
        success: true,
        message: `Simulasi register berhasil untuk @${data.username}`,
      };
    }
  },
};

import { LoginInput, RegisterInput, AuthResponse } from "@/types/auth";

/**
 * Service Layer Autentikasi Frontend.
 *
 * STATUS: STANDALONE (MOCK / SIMULASI).
 * Belum dihubungkan ke backend Express sesuai arahan.
 * Frontend berjalan mandiri dengan simulasi delay respons agar interaksi UI
 * (seperti status loading dan feedback form) tetap bisa diuji coba.
 */
export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    // Simulasi latency jaringan 500ms
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("[Mock Auth] Data login diterima:", data);

    return {
      success: true,
      message: `Simulasi Login Berhasil!\nSelamat datang, ${data.identifier}`,
      token: "mock-jwt-token-sample-xyz123",
      user: {
        id: 1,
        name: "Pengguna Demo",
        username: data.identifier.includes("@") ? "user_demo" : data.identifier,
        email: data.identifier.includes("@") ? data.identifier : "demo@nextshop.id",
      },
    };
  },

  async register(data: RegisterInput): Promise<AuthResponse> {
    // Simulasi latency jaringan 500ms
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("[Mock Auth] Data register diterima:", data);

    return {
      success: true,
      message: `Simulasi Pendaftaran Berhasil!\nAkun ${data.name} (@${data.username}) berhasil dibuat.`,
      user: {
        id: 2,
        name: data.name,
        username: data.username,
        email: data.email,
      },
    };
  },
};

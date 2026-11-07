/**
 * Kontrak tipe data autentikasi frontend <-> backend Express.
 *
 * Catatan:
 * - 'identifier' dipakai saat login karena auth endpoint backend mendukung login via email ATAU username.
 * - 'newPassword' di RegisterInput hanya untuk validasi konfirmasi di sisi client;
 *   field ini akan di-strip oleh authService sebelum payload dikirim ke API backend.
 */

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
  newPassword: string;
}

// Standar payload JSON yang dikembalikan oleh backend Express
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string | number;
    name: string;
    username: string;
    email: string;
    role?: "admin" | "user";
  };
}

/**
 * Definisi role akun sistem.
 * Mendukung 3 role dengan batasan hak akses masing-masing:
 * - 'admin'   : Administrator platform NextShopID
 * - 'penjual' : Merchant / Penjual toko
 * - 'user'    : Pembeli / Pelanggan e-commerce
 */
export type UserRole = "admin" | "penjual" | "user";

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// User object tanpa field password untuk keamanan response JSON
export type SafeUser = Omit<User, "password">;

// Payload pendaftaran user baru (khusus pembeli/user)
export interface RegisterDTO {
  name: string;
  username: string;
  email: string;
  password: string;
}

// Payload login user
export interface LoginDTO {
  identifier: string; // Bisa username atau email
  password: string;
}

// Payload data yang disimpan di dalam JWT token
export interface AuthTokenPayload {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

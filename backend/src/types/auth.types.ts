/**
 * Definisi role akun sistem.
 * Saat ini dibatasi hanya ada 2 role: 'admin' dan 'user'.
 */
export type UserRole = "admin" | "user";

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

// Payload pendaftaran user baru
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

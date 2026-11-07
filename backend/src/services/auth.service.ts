import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { ENV } from "../config/env";
import {
  User,
  SafeUser,
  RegisterDTO,
  LoginDTO,
  AuthTokenPayload,
} from "../types/auth.types";

export class AuthService {
  /**
   * Mendaftarkan pengguna baru dengan role default 'user'
   */
  async register(dto: RegisterDTO): Promise<SafeUser> {
    const name = dto.name.trim();
    const username = dto.username.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    // 1. Cek apakah username sudah dipakai
    const findUsernameStmt = db.prepare("SELECT id FROM users WHERE username = ?");
    if (findUsernameStmt.get(username)) {
      throw new Error("Username sudah terdaftar, silakan pilih username lain.");
    }

    // 2. Cek apakah email sudah dipakai
    const findEmailStmt = db.prepare("SELECT id FROM users WHERE email = ?");
    if (findEmailStmt.get(email)) {
      throw new Error("Email sudah terdaftar, silakan gunakan email lain.");
    }

    // 3. Hash password pengguna
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan ke database dengan role default 'user'
    const insertStmt = db.prepare(`
      INSERT INTO users (name, username, email, password, role)
      VALUES (?, ?, ?, ?, 'user')
    `);

    const result = insertStmt.run(name, username, email, hashedPassword);
    const newUserId = Number(result.lastInsertRowid);

    const newUser = this.getUserById(newUserId);
    if (!newUser) {
      throw new Error("Gagal mengambil data user setelah registrasi.");
    }

    return newUser;
  }

  /**
   * Memvalidasi login via username atau email, lalu membuat token JWT
   */
  async login(dto: LoginDTO): Promise<{ user: SafeUser; token: string }> {
    const identifier = dto.identifier.trim().toLowerCase();
    const password = dto.password;

    // Cari user berdasarkan username ATAU email
    const findUserStmt = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) = ? OR LOWER(email) = ?
      LIMIT 1
    `);

    const rawUser = findUserStmt.get(identifier, identifier) as User | undefined;

    if (!rawUser) {
      throw new Error("Username/email atau password salah.");
    }

    // Verifikasi hash password
    const isPasswordValid = await bcrypt.compare(password, rawUser.password);
    if (!isPasswordValid) {
      throw new Error("Username/email atau password salah.");
    }

    // Generate JWT token
    const payload: AuthTokenPayload = {
      id: rawUser.id,
      username: rawUser.username,
      email: rawUser.email,
      role: rawUser.role,
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const { password: _pwd, ...safeUser } = rawUser;

    return {
      user: safeUser,
      token,
    };
  }

  /**
   * Helper mengambil detail profil user tanpa password
   */
  getUserById(id: number): SafeUser | null {
    const stmt = db.prepare(`
      SELECT id, name, username, email, role, created_at, updated_at
      FROM users
      WHERE id = ?
    `);

    const row = stmt.get(id) as SafeUser | undefined;
    return row || null;
  }
}

export const authService = new AuthService();

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { ENV } from "../config/env";
import { mailService } from "./mail.service";
import {
  User,
  SafeUser,
  RegisterDTO,
  LoginDTO,
  AuthTokenPayload,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  PasswordResetRecord,
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
      SELECT id, name, username, email, role, status, suspension_reason, created_at, updated_at
      FROM users
      WHERE id = ?
    `);

    const row = stmt.get(id) as SafeUser | undefined;
    return row || null;
  }

  /**
   * Mengirim instruksi pemulihan kata sandi jika email terdaftar.
   * Tetap mengembalikan sukses walau email tidak ditemukan guna mencegah user enumeration attack.
   */
  async forgotPassword(dto: ForgotPasswordDTO): Promise<void> {
    const email = dto.email.trim().toLowerCase();

    const findUserStmt = db.prepare("SELECT id, email FROM users WHERE LOWER(email) = ?");
    const user = findUserStmt.get(email) as { id: number; email: string } | undefined;

    if (!user) {
      return;
    }

    // Buat token kriptografi acak (32 byte hex) dan waktu kedaluwarsa 30 menit
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Hapus token lama untuk email yang sama guna mencegah akumulasi token tak terpakai
    const deleteOldStmt = db.prepare("DELETE FROM password_resets WHERE LOWER(email) = ?");
    deleteOldStmt.run(user.email.toLowerCase());

    const insertTokenStmt = db.prepare(`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (?, ?, ?)
    `);
    insertTokenStmt.run(user.email, token, expiresAt);

    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${token}`;
    await mailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  /**
   * Memvalidasi token dan memperbarui kata sandi akun
   */
  async resetPassword(dto: ResetPasswordDTO): Promise<void> {
    const token = dto.token.trim();
    const newPassword = dto.password;

    const findTokenStmt = db.prepare(
      "SELECT id, email, token, expires_at, created_at FROM password_resets WHERE token = ? LIMIT 1"
    );
    const resetRecord = findTokenStmt.get(token) as PasswordResetRecord | undefined;

    if (!resetRecord) {
      throw new Error("Token pemulihan kata sandi tidak valid atau telah digunakan.");
    }

    // Validasi masa aktif token
    if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
      db.prepare("DELETE FROM password_resets WHERE id = ?").run(resetRecord.id);
      throw new Error("Token pemulihan kata sandi telah kedaluwarsa. Silakan ajukan permohonan baru.");
    }

    const findUserStmt = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?");
    const user = findUserStmt.get(resetRecord.email.toLowerCase()) as { id: number } | undefined;

    if (!user) {
      throw new Error("Pengguna akun pemilik token tidak ditemukan.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatePasswordStmt = db.prepare(`
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updatePasswordStmt.run(hashedPassword, user.id);

    // Bersihkan seluruh token reset untuk akun ini setelah berhasil digunakan
    db.prepare("DELETE FROM password_resets WHERE LOWER(email) = ?").run(
      resetRecord.email.toLowerCase()
    );
  }

  /**
   * Mengganti kata sandi oleh pengguna yang sedang login
   */
  async changePassword(userId: number, dto: ChangePasswordDTO): Promise<void> {
    const { currentPassword, newPassword } = dto;

    const findUserStmt = db.prepare("SELECT id, password FROM users WHERE id = ?");
    const user = findUserStmt.get(userId) as { id: number; password: string } | undefined;

    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Kata sandi lama yang Anda masukkan salah.");
    }

    if (currentPassword === newPassword) {
      throw new Error("Kata sandi baru tidak boleh sama dengan kata sandi saat ini.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updateStmt = db.prepare(`
      UPDATE users
      SET password = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(hashedPassword, user.id);
  }
}

export const authService = new AuthService();

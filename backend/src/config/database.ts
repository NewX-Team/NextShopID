import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { ENV } from "./env";

// Pastikan folder data/ ada sebelum sqlite mencoba membuat file
if (!fs.existsSync(ENV.DATA_DIR)) {
  fs.mkdirSync(ENV.DATA_DIR, { recursive: true });
}

const dbPath = path.join(ENV.DATA_DIR, ENV.DB_NAME);
export const db = new DatabaseSync(dbPath);

/**
 * Inisialisasi schema tabel dan seeder data awal
 */
export function initDatabase(): void {
  // Optimasi performa dan integritas relasional SQLite
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Schema tabel users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  seedDefaultAdmin();
}

/**
 * Otomatis seed akun admin default jika belum ada di database
 */
function seedDefaultAdmin(): void {
  const checkAdminStmt = db.prepare(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
  );
  const existing = checkAdminStmt.get("admin", "admin@gmail.com");

  if (!existing) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("admin12345", salt);

    const insertAdminStmt = db.prepare(`
      INSERT INTO users (name, username, email, password, role)
      VALUES (?, ?, ?, ?, 'admin')
    `);

    insertAdminStmt.run("Admin", "admin", "admin@gmail.com", hashedPassword);
    console.log("[Database] Seeder: Akun admin default berhasil dibuat (user: admin, email: admin@gmail.com)");
  }
}

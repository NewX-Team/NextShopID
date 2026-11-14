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
 * Inisialisasi schema tabel, migrasi role jika diperlukan, dan seeder data dummy
 */
export function initDatabase(): void {
  // Optimasi performa dan integritas relasional SQLite
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // 1. Periksa apakah tabel users sudah ada
  const tableCheckStmt = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'"
  );
  const existingTable = tableCheckStmt.get() as { sql: string } | undefined;

  if (existingTable) {
    // Jika tabel ada tapi belum mendukung role 'penjual', lakukan migrasi schema
    if (!existingTable.sql.includes("'penjual'")) {
      console.log("[Database] Memperbarui schema tabel users untuk mendukung role 'penjual'...");
      db.exec("PRAGMA foreign_keys = OFF;");
      db.exec(`
        CREATE TABLE users_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'penjual', 'user')) DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_temp (id, name, username, email, password, role, created_at, updated_at)
        SELECT id, name, username, email, password, role, created_at, updated_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_temp RENAME TO users;
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
      db.exec("PRAGMA foreign_keys = ON;");
      console.log("[Database] Migrasi schema users selesai.");
    }
  } else {
    // Buat tabel users baru dengan dukungan role admin, penjual, dan user
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'penjual', 'user')) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
  }

  // 2. Inisialisasi tabel token reset kata sandi
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
    CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
  `);

  // 3. Jalankan seeder akun default sistem (admin, penjual, pembeli)
  seedDefaultAdmin();
  seedDefaultPenjual();
  seedDefaultUser();
}

/**
 * Seed Akun Dummy: Administrator NextShopID
 * Akses: role 'admin'
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

    insertAdminStmt.run("Admin NextShopID", "admin", "admin@gmail.com", hashedPassword);
    console.log("[Database] Seeder: Akun admin default berhasil dibuat (user: admin / admin@gmail.com, pass: admin12345)");
  }
}

/**
 * Seed Akun Dummy: Penjual Toko / Merchant NextShopID
 * Akses: role 'penjual'
 */
function seedDefaultPenjual(): void {
  const checkPenjualStmt = db.prepare(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
  );
  const existing = checkPenjualStmt.get("penjual", "penjual@gmail.com");

  if (!existing) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("penjual12345", salt);

    const insertPenjualStmt = db.prepare(`
      INSERT INTO users (name, username, email, password, role)
      VALUES (?, ?, ?, ?, 'penjual')
    `);

    insertPenjualStmt.run("Penjual Official", "penjual", "penjual@gmail.com", hashedPassword);
    console.log("[Database] Seeder: Akun penjual default berhasil dibuat (user: penjual / penjual@gmail.com, pass: penjual12345)");
  }
}

/**
 * Seed Akun Dummy: Pembeli / User Reguler NextShopID
 * Akses: role 'user'
 */
function seedDefaultUser(): void {
  const checkUserStmt = db.prepare(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
  );
  const existing = checkUserStmt.get("pembeli", "pembeli@gmail.com");

  if (!existing) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("pembeli12345", salt);

    const insertUserStmt = db.prepare(`
      INSERT INTO users (name, username, email, password, role)
      VALUES (?, ?, ?, ?, 'user')
    `);

    insertUserStmt.run("Pembeli Contoh", "pembeli", "pembeli@gmail.com", hashedPassword);
    console.log("[Database] Seeder: Akun pembeli default berhasil dibuat (user: pembeli / pembeli@gmail.com, pass: pembeli12345)");
  }
}

/**
 * Membersihkan data tabel dan mengembalikan ke seeder default (khusus fase testing)
 */
export function resetDatabaseForTesting(): void {
  db.exec("DELETE FROM password_resets;");
  db.exec("DELETE FROM users;");
  seedDefaultAdmin();
  seedDefaultPenjual();
  seedDefaultUser();
}

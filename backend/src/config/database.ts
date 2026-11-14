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
    // Buat tabel users baru dengan dukungan role admin, penjual, dan user serta status akun
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'penjual', 'user')) DEFAULT 'user',
        status TEXT NOT NULL CHECK(status IN ('active', 'suspended')) DEFAULT 'active',
        suspension_reason TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
  }

  // Pastikan kolom 'status' & 'suspension_reason' ada jika tabel dibuat dari versi sebelumnya
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as unknown as Array<{ name: string }>;
  if (!userColumns.some((c) => c.name === "status")) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';");
    console.log("[Database] Kolom 'status' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "suspension_reason")) {
    db.exec("ALTER TABLE users ADD COLUMN suspension_reason TEXT DEFAULT NULL;");
    console.log("[Database] Kolom 'suspension_reason' berhasil ditambahkan ke tabel users.");
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

  // 3. Inisialisasi tabel pengaturan sistem (Server ON/OFF status)
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO system_settings (key, value) VALUES ('server_active', '1');
  `);

  // 4. Jalankan seeder akun default sistem (admin, penjual, pembeli)
  seedDefaultAdmin();
  seedDefaultPenjual();
  seedDefaultUser();
}

/**
 * Memeriksa apakah server sedang dalam status aktif (ON) atau nonaktif (OFF)
 */
export function isServerActive(): boolean {
  try {
    const stmt = db.prepare("SELECT value FROM system_settings WHERE key = 'server_active'");
    const row = stmt.get() as unknown as { value: string } | undefined;
    return row ? row.value === "1" : true;
  } catch (error) {
    console.error("[Database.isServerActive] Error:", error);
    return true;
  }
}

/**
 * Memperbarui status aktif/nonaktif server di basis data
 */
export function setServerActive(active: boolean): void {
  const val = active ? "1" : "0";
  const stmt = db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('server_active', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(val);
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

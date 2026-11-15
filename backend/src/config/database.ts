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

  // Pastikan kolom 'status', 'suspension_reason', 'is_store_open', & 'store_balance' ada jika tabel dibuat dari versi sebelumnya
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as unknown as Array<{ name: string }>;
  if (!userColumns.some((c) => c.name === "status")) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';");
    console.log("[Database] Kolom 'status' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "suspension_reason")) {
    db.exec("ALTER TABLE users ADD COLUMN suspension_reason TEXT DEFAULT NULL;");
    console.log("[Database] Kolom 'suspension_reason' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "is_store_open")) {
    db.exec("ALTER TABLE users ADD COLUMN is_store_open INTEGER NOT NULL DEFAULT 1;");
    console.log("[Database] Kolom 'is_store_open' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "store_balance")) {
    db.exec("ALTER TABLE users ADD COLUMN store_balance REAL NOT NULL DEFAULT 0;");
    console.log("[Database] Kolom 'store_balance' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "buyer_balance")) {
    db.exec("ALTER TABLE users ADD COLUMN buyer_balance REAL NOT NULL DEFAULT 0;");
    console.log("[Database] Kolom 'buyer_balance' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "verification_status")) {
    db.exec("ALTER TABLE users ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';");
    console.log("[Database] Kolom 'verification_status' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "verification_submitted_at")) {
    db.exec("ALTER TABLE users ADD COLUMN verification_submitted_at DATETIME DEFAULT NULL;");
    console.log("[Database] Kolom 'verification_submitted_at' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "verification_data")) {
    db.exec("ALTER TABLE users ADD COLUMN verification_data TEXT DEFAULT NULL;");
    console.log("[Database] Kolom 'verification_data' berhasil ditambahkan ke tabel users.");
  }
  if (!userColumns.some((c) => c.name === "verification_rejection_reason")) {
    db.exec("ALTER TABLE users ADD COLUMN verification_rejection_reason TEXT DEFAULT NULL;");
    console.log("[Database] Kolom 'verification_rejection_reason' berhasil ditambahkan ke tabel users.");
  }

  // 2. Inisialisasi tabel riwayat mutasi saldo (penjual & pembeli)
  db.exec(`
    CREATE TABLE IF NOT EXISTS balance_mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      description TEXT NOT NULL,
      admin_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_balance_mutations_user ON balance_mutations(user_id);
    CREATE INDEX IF NOT EXISTS idx_balance_mutations_created ON balance_mutations(created_at);
  `);

  // 3. Inisialisasi tabel rekening & dompet digital penarikan dana penjual (Seller Payout Accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS seller_payout_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('bank', 'wallet')),
      provider_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder_name TEXT NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('preset', 'manual')),
      is_agreed INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_seller_payout_accounts_seller ON seller_payout_accounts(seller_id);
  `);

  // 4. Inisialisasi tabel riwayat penarikan dana (Withdrawal) penjual
  db.exec(`
    CREATE TABLE IF NOT EXISTS seller_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      payout_account_id INTEGER NOT NULL,
      account_type TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder_name TEXT NOT NULL,
      amount REAL NOT NULL,
      fee REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'rejected')),
      notes TEXT DEFAULT NULL,
      admin_notes TEXT DEFAULT NULL,
      rejection_reason TEXT DEFAULT NULL,
      reviewed_by INTEGER DEFAULT NULL,
      reviewed_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (payout_account_id) REFERENCES seller_payout_accounts(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_seller ON seller_withdrawals(seller_id);
    CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_status ON seller_withdrawals(status);
    CREATE INDEX IF NOT EXISTS idx_seller_withdrawals_created ON seller_withdrawals(created_at);
  `);

  // Migrasi kolom tambahan tabel seller_withdrawals
  const wdColumns = db.prepare("PRAGMA table_info(seller_withdrawals);").all() as Array<{ name: string }>;
  if (!wdColumns.some((c) => c.name === "admin_notes")) {
    db.exec("ALTER TABLE seller_withdrawals ADD COLUMN admin_notes TEXT DEFAULT NULL;");
    console.log("[Database] Kolom 'admin_notes' berhasil ditambahkan ke tabel seller_withdrawals.");
  }
  if (!wdColumns.some((c) => c.name === "rejection_reason")) {
    db.exec("ALTER TABLE seller_withdrawals ADD COLUMN rejection_reason TEXT DEFAULT NULL;");
    console.log("[Database] Kolom 'rejection_reason' berhasil ditambahkan ke tabel seller_withdrawals.");
  }
  if (!wdColumns.some((c) => c.name === "reviewed_by")) {
    db.exec("ALTER TABLE seller_withdrawals ADD COLUMN reviewed_by INTEGER DEFAULT NULL;");
    console.log("[Database] Kolom 'reviewed_by' berhasil ditambahkan ke tabel seller_withdrawals.");
  }
  if (!wdColumns.some((c) => c.name === "reviewed_at")) {
    db.exec("ALTER TABLE seller_withdrawals ADD COLUMN reviewed_at DATETIME DEFAULT NULL;");
    console.log("[Database] Kolom 'reviewed_at' berhasil ditambahkan ke tabel seller_withdrawals.");
  }

  // 5. Inisialisasi tabel token reset kata sandi
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

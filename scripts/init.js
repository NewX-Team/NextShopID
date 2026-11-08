const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

console.log("\n========================================");
console.log("   NextShopID - Automated Setup Script   ");
console.log("========================================\n");

// Helper untuk menjalankan perintah shell dengan output langsung ke terminal
function runCommand(command, cwd = rootDir) {
  execSync(command, {
    cwd,
    stdio: "inherit",
    shell: true,
  });
}

// 1. Setup Environment Variables
console.log("-> [1/5] Menyiapkan environment variables...");

const frontendEnvExample = path.join(frontendDir, ".env.example");
const frontendEnvLocal = path.join(frontendDir, ".env.local");

if (!fs.existsSync(frontendEnvLocal) && fs.existsSync(frontendEnvExample)) {
  fs.copyFileSync(frontendEnvExample, frontendEnvLocal);
  console.log("   [OK] frontend/.env.local berhasil dibuat dari .env.example");
} else {
  console.log("   [SKIP] frontend/.env.local sudah tersedia.");
}

const backendEnvExample = path.join(backendDir, ".env.example");
const backendEnv = path.join(backendDir, ".env");

if (!fs.existsSync(backendEnv) && fs.existsSync(backendEnvExample)) {
  fs.copyFileSync(backendEnvExample, backendEnv);
  console.log("   [OK] backend/.env berhasil dibuat dari .env.example");
} else {
  console.log("   [SKIP] backend/.env sudah tersedia.");
}

// 2. Install Dependencies
console.log("\n-> [2/5] Menginstal dependensi Root Workspace (concurrently)...");
runCommand("npm install", rootDir);

console.log("\n-> [3/5] Menginstal dependensi Backend...");
runCommand("npm install", backendDir);

console.log("\n-> [4/5] Menginstal dependensi Frontend...");
runCommand("npm install", frontendDir);

// 3. Build & Inisialisasi Database Backend & Compile Frontend CSS
console.log("\n-> [5/5] Membangun backend & inisialisasi SQLite database...");
runCommand("npm run build", backendDir);

console.log("\n-> Mengompilasi Tailwind CSS stylesheet frontend...");
runCommand("node scripts/compile-css.js", frontendDir);

// Jalankan seeder database secara otomatis
const initDbCode = `
  const { initDatabase } = require('./dist/config/database');
  initDatabase();
  console.log('   [OK] Database SQLite dan default admin siap.');
`;
runCommand(`node -e "${initDbCode.replace(/\n/g, " ")}"`, backendDir);

console.log("\n==================================================");
console.log("   Inisialisasi Proyek NextShopID Selesai!        ");
console.log("==================================================");
console.log("\nUntuk mulai menjalankan development server:");
console.log("  npm run dev\n");
console.log("URL Aplikasi:");
console.log("  * Frontend Web : http://localhost:3000");
console.log("  * Backend API  : http://localhost:5000/api");
console.log("\nAkun Default Admin:");
console.log("  * Username     : admin");
console.log("  * Password     : admin12345");
console.log("==================================================\n");

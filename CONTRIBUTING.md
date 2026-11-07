# Panduan Kontribusi & Aturan Penulisan Kode (NextShopID)

> **Catatan:** Dokumen ini merupakan **Single Source of Truth (SSOT)** standar arsitektur dan konvensi penulisan kode untuk seluruh kontributor, tim developer, maupun AI coding assistant yang bekerja pada repositori **NextShopID**.

---

## 1. Arsitektur Proyek (Monorepo)

NextShopID menggunakan pola monorepo dengan 2 server terpisah yang dijalankan bersamaan:

```text
NextShopID/
├── backend/          # REST API Server murni (Express + TypeScript + SQLite) -> Port 5000
├── frontend/         # Web Client UI (Next.js 15+ App Router + React + TypeScript) -> Port 3000
├── package.json      # Orkestrasi workspace root (concurrently)
└── CONTRIBUTING.md   # Dokumen aturan & panduan kode (file ini)
```

### Menjalankan Proyek Lokal
* Jalankan `npm run dev` di root untuk menjalankan backend dan frontend sekaligus di satu terminal via `concurrently`.
* Jalankan `npm run build` sebelum membuat commit atau Pull Request untuk memverifikasi kompilasi TypeScript dan linting tanpa error (`0 errors, 0 warnings`).

---

## 2. Standar Struktur Modular

### A. Frontend (`frontend/`)
Patuhi pemisahan tanggung jawab (*Separation of Concerns*):
* `types/`: Menyimpan semua definisi tipe TypeScript (DTO, Request/Response contracts).
* `services/`: Layer pemanggilan API (`fetch` / `axios`). **Dilarang** memanggil `fetch()` langsung di dalam komponen UI atau halaman; selalu bungkus melalui service layer.
* `components/ui/`: Komponen atomik/dasar yang *reusable* (`Input.tsx`, `Button.tsx`, `Card.tsx`). Ini adalah *Single Source of Truth* untuk styling.
* `components/forms/`: Komponen form khusus fitur (`LoginForm.tsx`, `RegisterForm.tsx`) yang mengelola state, validasi, dan memanggil service layer.
* `app/`: Routing halaman Next.js. Buat halaman se-ramping dan sedeklaratif mungkin. Jadikan Server Component jika memungkinkan untuk mendukung metadata SEO.

### B. Backend (`backend/src/`)
Terapkan arsitektur berlapis (*layered architecture*):
* `config/`: Konfigurasi environment (`env.ts`) dan inisialisasi database (`database.ts`).
* `types/`: Kontrak antarmuka TypeScript untuk user, DTO, dan payload JWT.
* `services/`: Business logic murni dan query database SQLite.
* `middlewares/`: Verifikasi otentikasi JWT (`authenticate`) dan otorisasi role (`requireRole`).
* `controllers/`: Hanya bertugas memvalidasi request HTTP dan mengembalikan status code response (`200`, `201`, `400`, `401`, `403`, `500`).
* `routes/`: Definisi endpoint RESTful API.

---

## 3. Konvensi Penulisan Komentar Kode

Kita menggunakan standar **Developer-to-Developer Comments**:
* **Fokus pada alasan teknis (*Why*)**, bukan mendeskripsikan sintaks yang sudah jelas (*What*).
* **Hindari komentar AI generik**, seperti:
  * ❌ `// 1. Ini state form`
  * ❌ `// Ini fungsi submit form`
  * ❌ `// Input text field`
  * ❌ `// Wrapper utama di tengah`
* **Gunakan komentar yang memberikan informasi berharga**, contoh:
  * ✅ Menjelaskan keputusan arsitektur atau parameter kontrak API.
  * ✅ Memberikan catatan keamanan (*security caveats*), misalnya penanganan cookie HttpOnly atau CORS credentials.
  * ✅ Menuliskan `// TODO:` atau petunjuk integrasi untuk developer berikutnya.

---

## 4. Keamanan, Database, & Environment Variables

1. **Database SQLite:**
   * Jangan pernah meng-commit file database fisik atau file sementara SQLite (`*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`, `*.sqlite-journal`). Seluruh file ini telah dilindungi di `.gitignore`.
2. **Environment Variables:**
   * File rahasia lokal (`.env`, `.env.local`, `.env.*.local`) **dilarang keras** di-commit ke Git.
   * Setiap kali menambahkan variabel konfigurasi baru, **wajib** mencantumkannya di `.env.example` sebagai referensi tim.
3. **Password & Kredensial:**
   * Seluruh password user di database wajib di-hash menggunakan `bcryptjs` (salt rounds minimal 10).
   * Password mentah atau hash password tidak boleh dikembalikan ke client pada response API.

---

## 5. Konvensi Git & Commit Message

Gunakan standar format **Conventional Commits**:
* `feat:` Penambahan fitur baru (misal: `feat: implement product catalog api`)
* `fix:` Perbaikan bug (misal: `fix: resolve jwt expiration handling`)
* `refactor:` Perubahan struktur kode tanpa mengubah fungsi bisnis (misal: `refactor: extract reusable table component`)
* `docs:` Perubahan dokumentasi (misal: `docs: update contributing guide`)
* `chore:` Perubahan konfigurasi build, tooling, atau update dependency

Pastikan repositori selalu dalam status `clean` dan build berhasil sebelum melakukan `push`.

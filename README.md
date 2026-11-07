# NextShopID

Platform E-Commerce NextShopID (Monorepo).

---

## Panduan Kontribusi & Aturan Koding

Sebelum mulai mengembangkan atau berkontribusi pada proyek ini, **wajib membaca [CONTRIBUTING.md](./CONTRIBUTING.md)** untuk memahami standar arsitektur monorepo, struktur modular, konvensi komentar kode, keamanan database, dan alur commit Git.

---

## Cara Setup & Menjalankan Proyek

### 1. Clone Repositori
```bash
git clone https://github.com/NewX-Team/NextShopID.git
cd NextShopID
```

### 2. Inisialisasi Otomatis (Satu Perintah)
Jalankan perintah berikut di root project untuk otomatis menginstal semua dependensi (root, backend, frontend), menyiapkan berkas `.env`, dan menginisialisasi database SQLite:
```bash
npm run init
```

### 3. Jalankan Project Pengembangan (Development)
Jalankan satu perintah ini untuk menyalakan Backend Express dan Frontend Next.js secara bersamaan:
```bash
npm run dev
```

* **Frontend Web**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

> **Akun Default Admin:**
> * **Username**: `admin` (atau email: `admin@gmail.com`)
> * **Password**: `admin12345`

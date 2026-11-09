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
* **Swagger API Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
* **OpenAPI 3.0 JSON Spec**: [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

---

## Menjalankan Pengujian (Testing)

Jalankan rangkaian unit & integration tests dari root project:
```bash
npm run tests
```

---

## Akun Seeder Default untuk Pengujian

Database SQLite lokal sudah dilengkapi dengan 3 akun contoh untuk masing-masing role:

| Role | Username | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@gmail.com` | `admin12345` | Akses penuh dashboard admin & endpoint `/admin-only` |
| **Penjual** | `penjual` | `penjual@gmail.com` | `penjual12345` | Akses toko merchant & endpoint `/penjual-only` |
| **Pembeli (User)** | `pembeli` | `pembeli@gmail.com` | `pembeli12345` | Belanja, manajemen profil, dan pemulihan password |

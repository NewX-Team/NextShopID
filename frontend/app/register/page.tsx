"use client";

// Pakai "use client" agar halaman bisa berinteraksi langsung (state + submit form)
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  // 1. State untuk menampung semua field pendaftaran
  const [formData, setFormData] = useState({
    name: "",        // Nama lengkap user
    username: "",    // Username unik untuk login
    email: "",       // Email user
    password: "",    // Password utama
    newPassword: "", // Konfirmasi / password baru
  });

  // 2. Handler serbaguna: otomatis mengisi field yang sedang diketik user
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 3. Handler saat form disubmit (klik tombol Register)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman

    // Validasi sederhana: pastikan password dan new password cocok
    if (formData.password !== formData.newPassword) {
      alert("Password dan New Password tidak cocok! Silakan cek kembali.");
      return;
    }

    console.log("Data Register siap dikirim:", formData);
    alert(
      `Pendaftaran Berhasil!\nNama: ${formData.name}\nUsername: ${formData.username}\nEmail: ${formData.email}`
    );
    // Catatan: Nanti di sini tinggal kita POST data ini ke API Express backend (misal: /api/auth/register)
  };

  return (
    // Container utama form: posisi di tengah, gaya hitam putih polos
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "24px",
        fontFamily: "sans-serif",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Judul Halaman */}
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Register
      </h1>

      {/* Form Pendaftaran */}
      <form onSubmit={handleSubmit}>
        {/* Field 1: Name */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="name"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #000",
              backgroundColor: "#fff",
              color: "#000",
              borderRadius: "0",
            }}
          />
        </div>

        {/* Field 2: Username */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="username"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Masukkan username"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #000",
              backgroundColor: "#fff",
              color: "#000",
              borderRadius: "0",
            }}
          />
        </div>

        {/* Field 3: Email */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Masukkan email"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #000",
              backgroundColor: "#fff",
              color: "#000",
              borderRadius: "0",
            }}
          />
        </div>

        {/* Field 4: Password */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Masukkan password"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #000",
              backgroundColor: "#fff",
              color: "#000",
              borderRadius: "0",
            }}
          />
        </div>

        {/* Field 5: New Password (Konfirmasi) */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="newPassword"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Masukkan ulang / konfirmasi password"
            required
            style={{
              width: "100%",
              padding: "10px",
              boxSizing: "border-box",
              border: "1px solid #000",
              backgroundColor: "#fff",
              color: "#000",
              borderRadius: "0",
            }}
          />
        </div>

        {/* Tombol Submit Pendaftaran */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#000",
            color: "#fff",
            border: "1px solid #000",
            fontWeight: "bold",
            cursor: "pointer",
            borderRadius: "0",
          }}
        >
          Register
        </button>
      </form>

      {/* Link pindah ke halaman Login jika sudah punya akun */}
      <p style={{ marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
        Sudah punya akun?{" "}
        <Link
          href="/login"
          style={{
            color: "#000",
            fontWeight: "bold",
            textDecoration: "underline",
          }}
        >
          Login di sini
        </Link>
      </p>
    </div>
  );
}

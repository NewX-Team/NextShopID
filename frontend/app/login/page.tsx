"use client";

// Wajib pakai "use client" karena halaman ini interaktif (pakai state dan event form)
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  // 1. State buat nampung ketikan user di form login
  const [formData, setFormData] = useState({
    identifier: "", // bisa diisi username atau email
    password: "",   // password user
  });

  // 2. Fungsi otomatis update state setiap kali ada input yang diketik
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 3. Fungsi yang jalan saat tombol "Login" ditekan
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // stop reload halaman bawaan browser
    console.log("Data Login siap dikirim:", formData);
    alert(`Data Login:\nUsername/Email: ${formData.identifier}`);
    // Catatan: Nanti di sini tinggal kita fetch() ke API Express backend (misal: /api/auth/login)
  };

  return (
    // Wrapper utama: dibikin pas di tengah, tema hitam putih simpel
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
        Login
      </h1>

      {/* Form Login */}
      <form onSubmit={handleSubmit}>
        {/* Input: Username atau Email */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="identifier"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Username atau Email
          </label>
          <input
            id="identifier"
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Masukkan username atau email"
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

        {/* Input: Password */}
        <div style={{ marginBottom: "20px" }}>
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

        {/* Tombol Submit Login */}
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
          Login
        </button>
      </form>

      {/* Link pindah ke halaman Register jika belum punya akun */}
      <p style={{ marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
        Belum punya akun?{" "}
        <Link
          href="/register"
          style={{
            color: "#000",
            fontWeight: "bold",
            textDecoration: "underline",
          }}
        >
          Register di sini
        </Link>
      </p>
    </div>
  );
}

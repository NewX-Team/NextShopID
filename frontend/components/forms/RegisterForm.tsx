"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authService } from "@/services/auth.service";
import { RegisterInput } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState<RegisterInput>({
    name: "",
    username: "",
    email: "",
    password: "",
    newPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi client-side awal sebelum menembak jaringan
    if (formData.password !== formData.newPassword) {
      setErrorMessage("Password dan Konfirmasi Password tidak cocok. Harap periksa kembali.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authService.register(formData);

      if (response.success) {
        // Otomatis login dengan kredensial baru agar user langsung masuk ke sesi aktif
        const loginRes = await authService.login({
          identifier: formData.email,
          password: formData.password,
        });

        if (loginRes.success && loginRes.token && loginRes.user) {
          login(loginRes.token, loginRes.user);
          router.push("/");
        } else {
          router.push("/login");
        }
      } else {
        setErrorMessage(response.message || "Pendaftaran gagal diverifikasi server.");
      }
    } catch (err) {
      console.error("[RegisterForm] Gagal submit:", err);
      setErrorMessage("Terjadi kendala saat menghubungi server pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Register"
      subtitle="Buat akun baru untuk mulai berbelanja di NextShopID"
      footer={
        <p>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            style={{ color: "#000", fontWeight: "bold", textDecoration: "underline" }}
          >
            Login di sini
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div
            style={{
              padding: "10px",
              marginBottom: "16px",
              border: "1px solid #e11d48",
              backgroundColor: "#fff1f2",
              color: "#be123c",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        <Input
          label="Nama Lengkap"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Masukkan nama lengkap Anda"
          required
        />

        <Input
          label="Username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Pilih username unik"
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="nama@email.com"
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimal 6 karakter"
          required
        />

        <Input
          label="Konfirmasi Password"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Ulangi password di atas"
          required
        />

        <Button type="submit" isLoading={isLoading} style={{ marginTop: "8px" }}>
          Daftar Akun
        </Button>
      </form>
    </Card>
  );
};

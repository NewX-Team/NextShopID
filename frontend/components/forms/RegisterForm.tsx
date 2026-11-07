"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authService } from "@/services/auth.service";
import { RegisterInput } from "@/types/auth";

export const RegisterForm: React.FC = () => {
  const router = useRouter();

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
      setErrorMessage("Password dan New Password tidak cocok. Harap periksa kembali.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authService.register(formData);

      if (response.success) {
        alert(response.message || "Pendaftaran akun berhasil, silakan login!");
        router.push("/login");
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
              border: "1px solid #000",
              backgroundColor: "#f5f5f5",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            {errorMessage}
          </div>
        )}

        <Input
          label="Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nama lengkap"
          required
        />

        <Input
          label="Username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username unik"
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
          placeholder="Minimal 6-8 karakter"
          required
        />

        <Input
          label="New Password"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Ketik ulang password di atas"
          required
        />

        <Button type="submit" isLoading={isLoading} style={{ marginTop: "8px" }}>
          Register
        </Button>
      </form>
    </Card>
  );
};

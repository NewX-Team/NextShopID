"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authService } from "@/services/auth.service";
import { LoginInput } from "@/types/auth";

export const LoginForm: React.FC = () => {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginInput>({
    identifier: "",
    password: "",
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
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await authService.login(formData);

      if (response.success && response.token) {
        // Simpan token JWT dan objek profil user di localStorage browser
        localStorage.setItem("token", response.token);
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }

        alert(response.message || "Login berhasil!");
        router.push("/");
      } else {
        setErrorMessage(response.message || "Kredensial login tidak valid.");
      }
    } catch (err) {
      console.error("[LoginForm] Gagal submit:", err);
      setErrorMessage("Tidak dapat terhubung ke server backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      title="Login"
      subtitle="Silakan masuk ke akun NextShopID Anda"
      footer={
        <p>
          Belum punya akun?{" "}
          <Link
            href="/register"
            style={{ color: "#000", fontWeight: "bold", textDecoration: "underline" }}
          >
            Register di sini
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
          label="Username atau Email"
          name="identifier"
          type="text"
          value={formData.identifier}
          onChange={handleChange}
          placeholder="Masukkan username atau email"
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Masukkan password"
          required
        />

        <Button type="submit" isLoading={isLoading} style={{ marginTop: "8px" }}>
          Login
        </Button>
      </form>
    </Card>
  );
};

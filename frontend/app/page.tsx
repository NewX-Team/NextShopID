"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

interface UserProfile {
  id: number | string;
  name: string;
  username: string;
  email: string;
  role?: string;
}

// Helper membaca perubahan state di localStorage secara reaktif
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  return localStorage.getItem("user");
}

function getServerSnapshot(): null {
  return null;
}

// Entry point route (/) - portal dashboard / landing page
export default function Home() {
  const rawUser = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  let user: UserProfile | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "60px auto",
        padding: "24px",
        fontFamily: "sans-serif",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>
        NextShopID
      </h1>
      <p style={{ fontSize: "16px", marginBottom: "24px" }}>
        Platform E-Commerce NextShopID (Monorepo)
      </p>

      {/* Tampilan jika user sudah login */}
      {user ? (
        <div
          style={{
            padding: "20px",
            border: "1px solid #000",
            marginBottom: "24px",
            backgroundColor: "#fcfcfc",
          }}
        >
          <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
            Status: Sudah Login
          </p>
          <p style={{ margin: "4px 0" }}>Nama: {user.name}</p>
          <p style={{ margin: "4px 0" }}>Username: @{user.username}</p>
          <p style={{ margin: "4px 0" }}>Email: {user.email}</p>
          <p style={{ margin: "4px 0", fontWeight: "bold" }}>
            Role Akun: {user.role || "user"}
          </p>

          <button
            onClick={handleLogout}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#000",
              color: "#fff",
              border: "1px solid #000",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        /* Tampilan jika user belum login */
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/login"
            style={{
              padding: "10px 20px",
              backgroundColor: "#000",
              color: "#fff",
              textDecoration: "none",
              fontWeight: "bold",
              border: "1px solid #000",
            }}
          >
            Ke Halaman Login
          </Link>

          <Link
            href="/register"
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              color: "#000",
              textDecoration: "none",
              fontWeight: "bold",
              border: "1px solid #000",
            }}
          >
            Ke Halaman Register
          </Link>
        </div>
      )}
    </div>
  );
}

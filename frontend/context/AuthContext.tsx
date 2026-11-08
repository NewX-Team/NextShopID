"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/types/auth";
import { authService } from "@/services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inisialisasi state dari localStorage saat client-side hydration selesai
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Verifikasi sesi di background untuk memastikan token belum kedaluwarsa
        authService.getProfile(storedToken).then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem("user", JSON.stringify(res.user));
          } else if (!res.success && res.message?.includes("tidak valid")) {
            // Sesi kedaluwarsa / invalid
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          }
        }).catch(() => {
          // Abaikan jika network offline, tetap gunakan storedUser
        });
      }
    } catch (e) {
      console.error("[AuthContext] Gagal membaca session dari localStorage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sinkronisasi antar tab browser jika ada event login/logout di tab lain
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        const currentToken = localStorage.getItem("token");
        const currentUser = localStorage.getItem("user");
        if (currentToken && currentUser) {
          try {
            setToken(currentToken);
            setUser(JSON.parse(currentUser));
          } catch {
            setToken(null);
            setUser(null);
          }
        } else {
          setToken(null);
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    try {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
    } catch (e) {
      console.error("[AuthContext] Gagal menyimpan ke localStorage:", e);
    }
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {
      console.error("[AuthContext] Gagal menghapus dari localStorage:", e);
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  }
  return context;
};

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isMounted, setIsMounted] = useState(false);

  // Inisialisasi tema saat client hydration selesai
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedTheme = localStorage.getItem("nextshop_theme") as ThemeMode | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
        applyThemeClass(savedTheme);
      } else {
        // Default ke 'light' sesuai preferensi spesifikasi
        applyThemeClass("light");
      }
    } catch (e) {
      console.error("[ThemeContext] Gagal mengakses localStorage:", e);
    }
  }, []);

  const applyThemeClass = (t: ThemeMode) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("nextshop_theme", newTheme);
    } catch (e) {
      console.error("[ThemeContext] Gagal menyimpan tema:", e);
    }
    applyThemeClass(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme harus digunakan di dalam <ThemeProvider>");
  }
  return context;
};

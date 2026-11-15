"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Global Guard untuk membatasi akses Administrator:
 * Admin didedikasikan penuh untuk administrasi sistem dan TIDAK dapat mengakses
 * halaman toko publik (seperti '/', '/katalog', '/terbaru', '/promo', '/favorite', dll).
 * Jika admin berusaha mengakses halaman toko, akan langsung dialihkan ke '/admin'.
 */
export const AdminAccessGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "admin") {
      // Jika pengguna login sebagai admin, pastikan dia tetap berada di area /admin
      const isAllowedAdminPath =
        pathname?.startsWith("/admin") ||
        pathname === "/login";

      if (!isAllowedAdminPath) {
        router.replace("/admin");
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Jika admin sedang berada di luar area /admin dan sedang dialihkan, sembunyikan konten toko
  if (!isLoading && isAuthenticated && user?.role === "admin" && !pathname?.startsWith("/admin") && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Mengarahkan ke Dashboard Admin...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

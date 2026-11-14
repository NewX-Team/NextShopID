"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useServerStatus } from "@/context/ServerStatusContext";
import { LogoutIcon } from "@/components/ui/icons";

/**
 * Modal Popup Notifikasi Khusus User Pembeli saat Server Dinonaktifkan:
 * 
 * Aturan Sistem:
 * 1. Tamu/User belum login: Bebas mengakses beranda & toko publik tanpa gangguan.
 * 2. User Pembeli (role: 'user') yang login saat server OFF:
 *    - Muncul popup modal dengan teks:
 *      "server sedang dimatikan admin silahkan kembali lagi nanti"
 *    - Pilihan aksi HANYA 1: "Logout" (Keluar Akun).
 *    - Menekan tombol Logout akan membersihkan sesi dan mengarahkan kembali ke beranda publik awal.
 * 3. Tidak berlaku untuk Admin atau Penjual.
 */
export const ServerOfflineModal: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isServerActive } = useServerStatus();
  const router = useRouter();

  // Kondisi aktif: User harus dalam keadaan login, memiliki role 'user' (pembeli), dan status server sedang OFF
  const isTargetBuyer = isAuthenticated && user?.role === "user";
  const shouldShowModal = isTargetBuyer && !isServerActive;

  if (!shouldShowModal) {
    return null;
  }

  const handleLogoutOnlyChoice = () => {
    logout();
    router.push("/");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-offline-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop Gelap dengan Blur Kuat (Non-Dismissible) */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Kotak Modal Popup Notifikasi */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 z-10 text-center">
        {/* Glow Aksen Ambient */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 dark:bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Icon Notifikasi Server Dimatikan */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-5 shadow-xs">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="8" x="2" y="2" rx="2" />
            <rect width="20" height="8" x="2" y="14" rx="2" />
            <line x1="6" x2="6.01" y1="6" y2="6" />
            <line x1="6" x2="6.01" y1="18" y2="18" />
            <path d="m2 2 20 20" />
          </svg>
        </div>

        {/* Badge Info Status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Server Nonaktif</span>
        </div>

        {/* Judul Modal */}
        <h2
          id="server-offline-title"
          className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2"
        >
          Pemberitahuan Sistem
        </h2>

        {/* Teks Deskripsi Sesuai Permintaan User */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
          server sedang dimatikan admin silahkan kembali lagi nanti
        </p>

        {/* Satu-satunya Pilihan Aksi: Tombol Logout */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogoutOnlyChoice}
            className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <LogoutIcon size={17} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
          
          <p className="mt-3 text-[11px] text-slate-400">
            Anda akan dialihkan kembali ke halaman utama sebagai pengunjung biasa.
          </p>
        </div>
      </div>
    </div>
  );
};

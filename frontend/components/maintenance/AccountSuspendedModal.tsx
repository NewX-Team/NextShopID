"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Modal Popup Notifikasi saat Akun User Dibekukan (Nonaktif) oleh Admin:
 * 
 * Aturan Sistem:
 * - Ketika akun pembeli atau penjual dinonaktifkan oleh admin, bahkan saat server online,
 *   akan muncul popup notifikasi:
 *   "Akun Anda sedang dibekukan admin, silakan hubungi admin untuk meninjau status akun Anda."
 * - Pengguna menekan tombol "OK":
 *   Otomatis redirect / logout dan kembali ke halaman beranda awal.
 */
export const AccountSuspendedModal: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Tampilkan popup jika pengguna login dan status akunnya 'suspended' (dibekukan)
  const isSuspended = isAuthenticated && user?.status === "suspended";

  if (!isSuspended) {
    return null;
  }

  const handleOkRedirectLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-suspended-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
    >
      {/* Backdrop Gelap dengan Blur Kuat (Non-Dismissible) */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Kotak Modal Popup Notifikasi */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 z-10 text-center">
        {/* Glow Aksen Ambient Merah/Amber */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500/20 dark:bg-rose-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Icon Gembok / Akun Dibekukan */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-5 shadow-xs">
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
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.5" />
          </svg>
        </div>

        {/* Badge Info Status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Akun Dibekukan</span>
        </div>

        {/* Judul Modal */}
        <h2
          id="account-suspended-title"
          className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2"
        >
          Akun Dinonaktifkan
        </h2>

        {/* Teks Deskripsi Sesuai Permintaan User */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 font-medium">
          Akun Anda sedang dibekukan oleh admin. Silakan hubungi admin untuk meninjau status akun Anda.
        </p>

        {/* Detail Alasan Pembekuan oleh Admin */}
        <div className="mb-6 p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/25 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span>Alasan Pembekuan Akun:</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-rose-100 font-medium leading-relaxed">
            {user?.suspension_reason || "Pelanggaran pedoman kebijakan dan keamanan platform."}
          </p>
        </div>

        {/* Tombol OK (Redirect & Logout Otomatis) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleOkRedirectLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
          >
            <span>OK, Keluar Sesi</span>
          </button>
          
          <p className="mt-3 text-[11px] text-slate-400">
            Anda akan dialihkan kembali ke halaman utama platform.
          </p>
        </div>
      </div>
    </div>
  );
};

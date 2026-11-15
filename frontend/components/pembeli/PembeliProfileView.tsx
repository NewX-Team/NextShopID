"use client";

import React from "react";
import { UserIcon, CheckCircleIcon, MailIcon, ShieldIcon } from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";

export const PembeliProfileView: React.FC = () => {
  const { user } = useAuth();
  const initialChar = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <UserIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Profil Saya
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Kelola informasi data diri, username, dan kontak akun pembeli Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kartu Profil Utama */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-white/5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-sm shrink-0">
            {initialChar}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.name || "Pelanggan NextShopID"}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                <CheckCircleIcon size={12} className="text-blue-600 dark:text-blue-400" />
                Akun Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-400">
              @{user?.username || "username"} • Pelanggan Resmi
            </p>
          </div>
        </div>

        {/* Data Formulir Rincian Profil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Nama Lengkap
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {user?.name || "-"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Username
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              @{user?.username || "-"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Alamat Email
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {user?.email || "-"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Peran Akun
            </span>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              Pembeli (Customer)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

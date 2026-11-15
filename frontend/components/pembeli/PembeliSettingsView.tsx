"use client";

import React, { useState } from "react";
import { SettingsIcon, LockIcon, ShieldIcon, CheckIcon } from "@/components/ui/icons";

export const PembeliSettingsView: React.FC = () => {
  const [emailNotification, setEmailNotification] = useState(true);
  const [promoNotification, setPromoNotification] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Pengaturan Akun
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Kelola keamanan kata sandi, preferensi notifikasi, dan pengaturan akun pembeli.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keamanan & Kata Sandi */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <LockIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Keamanan & Kata Sandi
            </h3>
            <p className="text-xs text-slate-400">
              Amankan akun belanja Anda dengan kata sandi yang kuat
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ubah Kata Sandi
            </div>
            <div className="text-[11px] text-slate-400">
              Disarankan memperbarui kata sandi secara berkala
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            Ubah Password
          </button>
        </div>
      </div>

      {/* Preferensi Notifikasi */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Preferensi Notifikasi
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Notifikasi Status Pesanan
              </div>
              <div className="text-[11px] text-slate-400">
                Terima update email saat paket Anda diproses dan dikirim
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailNotification}
              onChange={(e) => setEmailNotification(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Promo & Diskon Eksklusif
              </div>
              <div className="text-[11px] text-slate-400">
                Dapatkan info penawaran voucher belanja dan flash sale
              </div>
            </div>
            <input
              type="checkbox"
              checked={promoNotification}
              onChange={(e) => setPromoNotification(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

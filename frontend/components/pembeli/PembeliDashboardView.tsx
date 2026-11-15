"use client";

import React from "react";
import Link from "next/link";
import {
  PackageIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  UserIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";

interface PembeliDashboardViewProps {
  onNavigateTab?: (tab: "orders" | "profile" | "settings") => void;
  buyerBalance?: number;
}

export const PembeliDashboardView: React.FC<PembeliDashboardViewProps> = ({
  onNavigateTab,
  buyerBalance = 0,
}) => {
  const { user } = useAuth();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Banner Sambutan Pembeli */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold border border-white/20">
            <span>Selamat Datang, Pelanggan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Halo, {user?.name || "Pelanggan Setia"}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Pantau status pengiriman pesanan Anda dan kelola informasi akun dengan mudah di dashboard pembeli.
          </p>
        </div>

        <div className="relative z-10">
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 shadow-xs transition-all cursor-pointer"
          >
            <ShoppingBagIcon size={16} />
            <span>Mulai Belanja</span>
          </Link>
        </div>
      </div>

      {/* 3 Kartu Metrik Pembeli */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metrik 1: Saldo Belanja */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Saldo Akun
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <CreditCardIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
              {formatRupiah(buyerBalance)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Saldo dompet pembeli</p>
          </div>
        </div>

        {/* Metrik 2: Pesanan Aktif */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pesanan Aktif
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <PackageIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              0 <span className="text-sm font-normal text-slate-400">Paket</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sedang dalam proses / kirim</p>
          </div>
        </div>

        {/* Metrik 3: Status Akun */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Status Akun
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckCircleIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>Aktif & Terverifikasi</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Siap bertransaksi</p>
          </div>
        </div>
      </div>

      {/* Akses Cepat Menu Pembeli */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Pesanan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <PackageIcon size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Pesanan & Riwayat Transaksi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Cek nomor resi pengiriman kurir, invoice transaksi belanja, dan konfirmasi barang sampai.
            </p>
          </div>
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => onNavigateTab("orders")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <span>Buka Pesanan Saya</span>
              <ArrowRightIcon size={14} />
            </button>
          ) : (
            <Link
              href="/pembeli/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <span>Buka Pesanan Saya</span>
              <ArrowRightIcon size={14} />
            </Link>
          )}
        </div>

        {/* Card Profil & Pengaturan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <UserIcon size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Profil & Pengaturan Akun
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Kelola informasi profil pribadi, alamat penerima barang, dan preferensi akun belanja Anda.
            </p>
          </div>
          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => onNavigateTab("profile")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              <span>Buka Profil Saya</span>
              <ArrowRightIcon size={14} />
            </button>
          ) : (
            <Link
              href="/pembeli/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>Buka Profil Saya</span>
              <ArrowRightIcon size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

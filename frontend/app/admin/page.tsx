"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar, AdminMenuKey } from "@/components/admin/AdminSidebar";
import {
  DashboardIcon,
  ShoppingBagIcon,
  PackageIcon,
  UsersIcon,
  LayersIcon,
  DollarSignIcon,
  PercentIcon,
  SettingsIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";
import Link from "next/link";

interface MenuMeta {
  title: string;
  badge: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const MENU_METAS: Record<AdminMenuKey, MenuMeta> = {
  dashboard: {
    title: "Dashboard Utama",
    badge: "Ringkasan Eksekutif",
    description:
      "Pusat kendali dan ringkasan metrik penjualan, performa toko, dan aktivitas transaksi seluruh platform NextShopID.",
    icon: DashboardIcon,
  },
  produk: {
    title: "Manajemen Produk",
    badge: "Katalog & Verifikasi",
    description:
      "Daftar seluruh katalog produk, persetujuan pengajuan barang baru dari penjual, serta pemantauan stok barang.",
    icon: ShoppingBagIcon,
  },
  pesanan: {
    title: "Manajemen Pesanan",
    badge: "Transaksi Masuk",
    description:
      "Pelacakan seluruh pesanan masuk, verifikasi konfirmasi pembayaran, dan pemantauan status pengiriman kurir.",
    icon: PackageIcon,
  },
  kategori: {
    title: "Kategori Produk",
    badge: "Struktur Katalog",
    description:
      "Pengaturan hierarki kategori, subkategori, serta pemetaan katalog produk di beranda aplikasi.",
    icon: LayersIcon,
  },
  pengguna: {
    title: "Manajemen Pengguna",
    badge: "Pembeli & Penjual",
    description:
      "Kelola data akun pembeli, verifikasi pendaftaran akun merchant/penjual baru, dan manajemen status akun.",
    icon: UsersIcon,
  },
  keuangan: {
    title: "Laporan Keuangan",
    badge: "Settlement & Komisi",
    description:
      "Pencatatan komisi platform, mutasi transaksi, saldo dompet merchant, dan persetujuan penarikan dana (payout).",
    icon: DollarSignIcon,
  },
  promo: {
    title: "Promo & Voucher",
    badge: "Pemasaran",
    description:
      "Pembuatan voucher diskon belanja, pengelolaan banner promosi halaman depan, dan pengaturan flash sale.",
    icon: PercentIcon,
  },
  pengaturan: {
    title: "Pengaturan Platform",
    badge: "Sistem & Konfigurasi",
    description:
      "Konfigurasi umum platform e-commerce, integrasi payment gateway, opsi ekspedisi kurir, dan keamanan sistem.",
    icon: SettingsIcon,
  },
};

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>("dashboard");

  // Validasi Hak Akses Role Admin (RBAC Security Guard)
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Hindari flash layout sebelum verifikasi auth selesai
  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return <div className="min-h-screen bg-white dark:bg-[#090d16]" />;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const currentMeta = MENU_METAS[activeMenu];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#090d16] text-slate-900 dark:text-white transition-colors duration-200">
      
      {/* 1. Sidebar Navigasi Admin di Sisi Kiri */}
      <AdminSidebar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={handleLogout}
      />

      {/* 2. Konten Utama di Sisi Kanan */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar Admin */}
        <header className="h-16 shrink-0 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 pl-10 md:pl-0">
            {/* Breadcrumb Path */}
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {currentMeta.title}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Server Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Online</span>
            </div>

            {/* Quick Link ke Halaman Toko Publik */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span>Buka Toko</span>
              <ExternalLinkIcon size={13} />
            </Link>
          </div>
        </header>

        {/* Canvas Body: Placeholder Sesuai Menu yang Sedang Aktif */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl mx-auto text-center">
            
            {/* Kartu Hero Placeholder Menu */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-[#0b132b]/50 p-8 sm:p-12 shadow-sm backdrop-blur-xs">
              
              {/* Icon Bulat Menu */}
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-5 shadow-2xs">
                <CurrentIcon size={28} />
              </div>

              {/* Tag Kategori Menu */}
              <div className="mb-3">
                <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/50 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  {currentMeta.badge}
                </span>
              </div>

              {/* Teks Judul Utama Halaman Sesuai Permintaan */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                ini page admin - {currentMeta.title}
              </h1>

              {/* Deskripsi Menu */}
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
                {currentMeta.description}
              </p>

              {/* Banner Info Desain Sidebar */}
              <div className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 dark:border-white/15 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-black/20">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>
                  Sidebar di sisi kiri siap digunakan. Anda dapat mengklik menu lain untuk berpindah navigasi.
                </span>
              </div>
            </div>

            {/* Placeholder Baris Kartu Metrik Dummy (Memberikan Nuansa Dashboard Nyata) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-left">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Produk</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">1,482</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">+12 hari ini</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-left">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Pesanan Aktif</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">128</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Perlu diproses</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-left">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Penjual / Toko</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">46</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">3 verifikasi baru</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-left">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Pengguna Aktif</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">8,920</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">+5.4% bln ini</p>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

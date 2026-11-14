"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar, AdminMenuKey } from "@/components/admin/AdminSidebar";
import { UserManagementView } from "@/components/admin/UserManagementView";
import {
  DashboardIcon,
  ShoppingBagIcon,
  PackageIcon,
  UsersIcon,
  LayersIcon,
  DollarSignIcon,
  PercentIcon,
  SettingsIcon,
} from "@/components/ui/icons";

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

  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>("pengguna");
  const [isServerActive, setIsServerActive] = useState<boolean>(true);

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
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-white transition-colors duration-200">
      
      {/* 1. Sidebar Navigasi Admin di Sisi Kiri */}
      <AdminSidebar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={handleLogout}
        isServerActive={isServerActive}
      />

      {/* 2. Konten Utama di Sisi Kanan */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar Admin */}
        <header className="h-16 shrink-0 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 pl-10 md:pl-0">
            {/* Breadcrumb Path */}
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Admin Panel</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {currentMeta.title}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Switch Toggle Status Server ON / OFF */}
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-2xs">
              {/* Teks Status */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isServerActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isServerActive ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
                    }`}
                  />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {isServerActive ? "Server Online" : "Server Offline"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    (Port 5000)
                  </span>
                </div>
              </div>

              {/* Tombol Switch ON / OFF Interaktif */}
              <button
                type="button"
                role="switch"
                aria-checked={isServerActive}
                onClick={() => setIsServerActive((prev) => !prev)}
                className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
                  isServerActive
                    ? "bg-emerald-500 shadow-xs shadow-emerald-500/30"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
                title={
                  isServerActive
                    ? "Server sedang aktif. Klik untuk beralih ke nonaktif."
                    : "Server sedang nonaktif. Klik untuk beralih ke aktif."
                }
                aria-label="Pengalih Status Server (ON / OFF)"
              >
                <span className="sr-only">Toggle server status</span>
                {/* Bulatan Switch Thumb yang Bergerak Halus */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isServerActive ? "translate-x-5" : "translate-x-0"
                  }`}
                >
                  <span
                    className={`text-[8px] font-black uppercase tracking-tighter ${
                      isServerActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {isServerActive ? "ON" : "OFF"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Canvas Body: Manajemen Pengguna atau Placeholder Menu */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeMenu === "pengguna" ? (
              <UserManagementView />
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                {/* Kartu Hero Placeholder Menu */}
                <div className="w-full max-w-2xl rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0b132b]/50 p-8 sm:p-12 shadow-sm backdrop-blur-xs">
                  
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mb-6">
                    {currentMeta.description}
                  </p>

                  {/* Shortcut Cepat Buka Manajemen Pengguna */}
                  <button
                    type="button"
                    onClick={() => setActiveMenu("pengguna")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <UsersIcon size={16} />
                    <span>Buka Manajemen Pengguna</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

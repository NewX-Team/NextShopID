"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DashboardIcon,
  ShoppingBagIcon,
  PackageIcon,
  PercentIcon,
  SettingsIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  ExternalLinkIcon,
  StoreIcon,
  StarIcon,
  WalletIcon,
  TruckIcon,
  PlusIcon,
  MenuIcon,
  CloseIcon,
  CheckIcon,
  ShieldIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { SellerStats, SellerVerificationStatus } from "@/services/seller.service";

export type PenjualMenuKey =
  | "dashboard"
  | "pesanan"
  | "pengiriman"
  | "produk"
  | "tambah_produk"
  | "promosi"
  | "ulasan"
  | "keuangan"
  | "verifikasi"
  | "pengaturan";

interface PenjualSidebarProps {
  activeMenu: PenjualMenuKey;
  onSelectMenu: (menu: PenjualMenuKey) => void;
  onLogout: () => void;
  isStoreOpen: boolean;
  onToggleStoreStatus: () => void;
  isUpdatingStoreStatus?: boolean;
  storeBalance?: number;
  stats?: SellerStats;
  verificationStatus?: SellerVerificationStatus;
}

interface MenuItemDef {
  key: PenjualMenuKey;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: "blue" | "amber" | "emerald" | "purple" | "rose";
}

interface MenuGroupDef {
  title: string;
  items: MenuItemDef[];
}

export const PenjualSidebar: React.FC<PenjualSidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onLogout,
  isStoreOpen,
  onToggleStoreStatus,
  isUpdatingStoreStatus = false,
  storeBalance = 0,
  stats,
  verificationStatus = "unverified",
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menu groups dengan badge dinamis realtime murni
  const menuGroups: MenuGroupDef[] = [
    {
      title: "Penjualan & Operasional",
      items: [
        {
          key: "dashboard",
          label: "Dashboard Toko",
          icon: DashboardIcon,
        },
        {
          key: "pesanan",
          label: "Pesanan Masuk",
          icon: PackageIcon,
          badge: stats && stats.newOrdersCount > 0 ? `${stats.newOrdersCount} Baru` : undefined,
          badgeColor: "blue",
        },
        {
          key: "pengiriman",
          label: "Pengiriman Kurir",
          icon: TruckIcon,
          badge: stats && stats.shippingOrdersCount > 0 ? `${stats.shippingOrdersCount} Proses` : undefined,
          badgeColor: "amber",
        },
      ],
    },
    {
      title: "Katalog & Inventaris",
      items: [
        {
          key: "produk",
          label: "Katalog Produk",
          icon: ShoppingBagIcon,
          badge: stats && stats.totalProducts > 0 ? `${stats.totalProducts} Produk` : undefined,
          badgeColor: "emerald",
        },
        {
          key: "tambah_produk",
          label: "Tambah Produk",
          icon: PlusIcon,
        },
      ],
    },
    {
      title: "Pemasaran & Reputasi",
      items: [
        {
          key: "promosi",
          label: "Voucher & Promosi",
          icon: PercentIcon,
        },
        {
          key: "ulasan",
          label: "Ulasan Pembeli",
          icon: StarIcon,
          badge: stats && stats.totalReviews > 0 ? `${stats.averageRating} ★` : undefined,
          badgeColor: "amber",
        },
      ],
    },
    {
      title: "Keuangan & Pengaturan",
      items: [
        {
          key: "keuangan",
          label: "Saldo & Penarikan",
          icon: WalletIcon,
        },
        {
          key: "verifikasi",
          label: "Verifikasi Toko",
          icon: ShieldIcon,
          badge:
            verificationStatus === "verified"
              ? "Resmi"
              : verificationStatus === "pending"
              ? "Review"
              : verificationStatus === "rejected"
              ? "Ditolak"
              : "Ajukan",
          badgeColor:
            verificationStatus === "verified"
              ? "emerald"
              : verificationStatus === "pending"
              ? "amber"
              : verificationStatus === "rejected"
              ? "rose"
              : "blue",
        },
        {
          key: "pengaturan",
          label: "Pengaturan Toko",
          icon: SettingsIcon,
        },
      ],
    },
  ];

  const getBadgeClass = (color?: "blue" | "amber" | "emerald" | "purple" | "rose") => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "amber":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "rose":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      case "blue":
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
    }
  };

  const formattedBalance = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(storeBalance);

  return (
    <>
      {/* Tombol Pemicu Hamburger Drawer (Mobile View) */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-40 p-2 rounded-xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-md cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
        aria-label="Buka menu navigasi penjual"
      >
        <MenuIcon size={20} />
      </button>

      {/* Overlay Backdrop Mobile */}
      {isMobileOpen && (
        <div
          role="presentation"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Container Sidebar Penjual */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-10 h-screen w-72 shrink-0 flex flex-col bg-white dark:bg-[#070b14] border-r border-slate-200/80 dark:border-white/10 shadow-lg md:shadow-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* 1. Header Identitas Portal Penjual */}
        <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <Link
            href="/penjual"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setIsMobileOpen(false)}
          >
            {/* Logo Hexagon / Badge Mitra Penjual */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <StoreIcon size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  NextShop
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Seller
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 truncate">
                Pusat Mitra Penjual
              </p>
            </div>
          </Link>

          {/* Tombol Tutup Sidebar di Layar Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            aria-label="Tutup menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* 2. Kartu Profil Toko & Status Verifikasi Admin (Realtime) */}
        <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
          {/* Info Singkat Toko */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div
                  className={`h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs transition-all ${
                    verificationStatus === "verified"
                      ? "ring-2 ring-red-500 ring-offset-1 dark:ring-offset-[#070b14]"
                      : ""
                  }`}
                >
                  {user?.name ? user.name[0]?.toUpperCase() : "T"}
                </div>
                {verificationStatus === "verified" && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded-xs bg-red-600 text-white text-[7.5px] font-black uppercase tracking-tight shadow-xs border border-white dark:border-[#070b14] leading-none pointer-events-none select-none z-10">
                    Mall
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Toko Mitra"}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="truncate">@{user?.username || "penjual"}</span>
                  <span>•</span>
                  {/* Badge Verifikasi Toko di Bawah Username */}
                  {verificationStatus === "verified" ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircleIcon size={11} className="shrink-0" />
                      <span>Verified</span>
                    </span>
                  ) : verificationStatus === "pending" ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                      <ClockIcon size={11} className="shrink-0" />
                      <span>Review</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectMenu("verifikasi")}
                      className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Ajukan Verifikasi
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Link Eksternal: Kunjungi Toko */}
            <Link
              href="/"
              target="_blank"
              title="Lihat tampilan toko publik di NextShopID"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <ExternalLinkIcon size={14} />
            </Link>
          </div>

          {/* Saklar Operasional Toko (Buka / Tutup Toko) Realtime */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isStoreOpen ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                  {isStoreOpen ? "Toko Sedang Buka" : "Toko Sedang Libur"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isStoreOpen ? "Menerima pesanan baru" : "Pesanan baru ditahan"}
                </p>
              </div>
            </div>

            {/* Switch Taktil Buka / Tutup Toko */}
            <button
              type="button"
              role="switch"
              aria-checked={isStoreOpen}
              disabled={isUpdatingStoreStatus}
              onClick={onToggleStoreStatus}
              className={`group relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 disabled:opacity-50 ${
                isStoreOpen
                  ? "bg-emerald-500 shadow-xs shadow-emerald-500/30"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
              title={isStoreOpen ? "Klik untuk meliburkan toko" : "Klik untuk membuka toko"}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isStoreOpen ? "translate-x-4" : "translate-x-0"
                }`}
              >
                {isStoreOpen ? (
                  <CheckIcon size={10} className="text-emerald-600 stroke-[3]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                )}
              </span>
            </button>
          </div>

          {/* Banner Mini Promosi Verifikasi Toko (Hanya tampil bila belum verifikasi) */}
          {verificationStatus === "unverified" && (
            <div
              onClick={() => onSelectMenu("verifikasi")}
              className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ShieldIcon size={11} /> Verifikasi Toko
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Ajukan →</span>
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                Dapatkan centang verified & prioritas pencarian
              </p>
            </div>
          )}
        </div>

        {/* 3. Area Scroll Menu Navigasi Penjual */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <nav className="space-y-5" aria-label="Navigasi Penjual">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <h5 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </h5>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeMenu === item.key;
                    const IconComponent = item.icon;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          onSelectMenu(item.key);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/25"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComponent
                            size={16}
                            className={`shrink-0 ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : getBadgeClass(item.badgeColor)
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* 4. Bagian Bawah: Widget Saldo Toko Realtime & Opsi Akun */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-black/20 space-y-3">
          {/* Mini Card Saldo Penghasilan Penjual (Realtime) */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-blue-950/20 border border-emerald-500/20 dark:border-emerald-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <WalletIcon size={12} className="text-emerald-500" /> Saldo Toko
              </span>
              <button
                type="button"
                onClick={() => onSelectMenu("keuangan")}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Rincian →
              </button>
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formattedBalance}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {storeBalance > 0 ? "Dapat dicairkan ke rekening" : "Belum ada saldo penghasilan"}
            </p>
          </div>

          {/* Kontrol Tema & Tombol Logout */}
          <div className="flex items-center justify-between pt-1">
            {/* Pengalih Tema Terang / Gelap */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            >
              {theme === "dark" ? (
                <>
                  <SunIcon size={14} className="text-amber-400" />
                  <span className="text-[11px]">Terang</span>
                </>
              ) : (
                <>
                  <MoonIcon size={14} className="text-slate-600" />
                  <span className="text-[11px]">Gelap</span>
                </>
              )}
            </button>

            {/* Tombol Logout Penjual */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Keluar dari sesi portal penjual"
            >
              <LogoutIcon size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DashboardIcon,
  ShoppingBagIcon,
  PackageIcon,
  UsersIcon,
  LayersIcon,
  DollarSignIcon,
  PercentIcon,
  SettingsIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  ExternalLinkIcon,
  ShieldIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export type AdminMenuKey =
  | "dashboard"
  | "produk"
  | "pesanan"
  | "pengguna"
  | "kategori"
  | "keuangan"
  | "promo"
  | "pengaturan";

interface AdminSidebarProps {
  activeMenu: AdminMenuKey;
  onSelectMenu: (menu: AdminMenuKey) => void;
  onLogout: () => void;
}

interface MenuItemDef {
  key: AdminMenuKey;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: "blue" | "amber" | "emerald";
}

interface MenuGroupDef {
  title: string;
  items: MenuItemDef[];
}

const MENU_GROUPS: MenuGroupDef[] = [
  {
    title: "Menu Utama",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: DashboardIcon,
      },
    ],
  },
  {
    title: "Katalog & Transaksi",
    items: [
      {
        key: "produk",
        label: "Manajemen Produk",
        icon: ShoppingBagIcon,
        badge: "4",
        badgeColor: "amber",
      },
      {
        key: "pesanan",
        label: "Manajemen Pesanan",
        icon: PackageIcon,
        badge: "12",
        badgeColor: "blue",
      },
      {
        key: "kategori",
        label: "Kategori Produk",
        icon: LayersIcon,
      },
    ],
  },
  {
    title: "Pengguna & Merchant",
    items: [
      {
        key: "pengguna",
        label: "Manajemen Pengguna",
        icon: UsersIcon,
        badge: "3",
        badgeColor: "emerald",
      },
    ],
  },
  {
    title: "Finansial & Pemasaran",
    items: [
      {
        key: "keuangan",
        label: "Laporan Keuangan",
        icon: DollarSignIcon,
      },
      {
        key: "promo",
        label: "Promo & Voucher",
        icon: PercentIcon,
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      {
        key: "pengaturan",
        label: "Pengaturan Platform",
        icon: SettingsIcon,
      },
    ],
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeMenu,
  onSelectMenu,
  onLogout,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderBadge = (badge?: string, color: "blue" | "amber" | "emerald" = "blue") => {
    if (!badge) return null;
    const colorClasses = {
      blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };

    return (
      <span
        className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full border ${colorClasses[color]}`}
      >
        {badge}
      </span>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Bagian Atas: Header Logo Brand & Daftar Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
        {/* Brand Header: NextShopID Admin */}
        <div className="flex items-center justify-between pb-6 mb-5 border-b border-slate-200/80 dark:border-white/10">
          <Link
            href="/"
            className="group flex items-center gap-1.5 focus-visible:outline-none"
            title="Kembali ke Beranda Publik"
          >
            <span className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white">
              NextShop
            </span>
            <span className="text-blue-600 font-bold text-[18px]">ID</span>
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <ShieldIcon size={11} />
              <span>Admin</span>
            </span>
          </Link>

          {/* Tombol Tutup Sidebar Khusus Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            aria-label="Tutup menu sidebar"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Grup Menu Navigasi Admin */}
        <nav className="space-y-6">
          {MENU_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {group.title}
              </p>
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
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium tracking-tight transition-all duration-150 text-left cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        }`}
                      >
                        <IconComponent size={18} />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {renderBadge(item.badge, item.badgeColor)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bagian Bawah: Aksi Cepat, Profil Admin, & Tombol Logout */}
      <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-100/50 dark:bg-black/20">
        
        {/* Tautan Cepat: Lihat Toko Publik & Theme Toggle */}
        <div className="flex items-center justify-between mb-3.5 px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Buka Toko Publik NextShopID"
          >
            <span>Lihat Toko Publik</span>
            <ExternalLinkIcon size={13} />
          </Link>

          {/* Tombol Pengalih Tema Sun/Moon */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            aria-label="Pengalih Tema"
          >
            {theme === "dark" ? (
              <SunIcon size={16} className="text-amber-400" />
            ) : (
              <MoonIcon size={16} className="text-slate-600" />
            )}
          </button>
        </div>

        {/* Profil Akun Admin */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-2xs mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xs">
            {user?.name ? user.name[0]?.toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
              {user?.name || "Administrator"}
            </p>
            <p className="truncate text-[10px] text-slate-400 font-mono">
              {user?.email || "admin@gmail.com"}
            </p>
          </div>
          <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Admin
          </span>
        </div>

        {/* Tombol Logout Admin */}
        <button
          type="button"
          onClick={onLogout}
          className="group w-full flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 cursor-pointer active:scale-95"
        >
          <LogoutIcon size={15} />
          <span>Keluar Sesi (Logout)</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop (Selalu Tampil di Layar Desktop >= md) */}
      <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col h-screen sticky top-0 bg-[#f8fafc] dark:bg-[#0b132b] border-r border-slate-200/90 dark:border-white/10 transition-colors duration-200 z-30">
        {sidebarContent}
      </aside>

      {/* Tombol Pemicu Sidebar Mobile (Layar < md) */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white shadow-md active:scale-95"
          aria-label="Buka Menu Sidebar Admin"
        >
          <MenuIcon size={20} />
        </button>
      </div>

      {/* Drawer Overlay Mobile */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Gelap */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Konten Sidebar Mobile */}
          <aside className="relative w-72 max-w-[85vw] h-full flex flex-col bg-[#f8fafc] dark:bg-[#0b132b] border-r border-slate-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-left duration-200 z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DashboardIcon,
  PackageIcon,
  HeartIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  CreditCardIcon,
  MenuIcon,
  CloseIcon,
  ShoppingBagIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export type PembeliMenuKey =
  | "dashboard"
  | "orders"
  | "favorites"
  | "profile"
  | "settings";

interface PembeliSidebarProps {
  activeMenu: PembeliMenuKey;
  onSelectMenu?: (menu: PembeliMenuKey) => void;
  buyerBalance?: number;
}

interface MenuItemDef {
  key: PembeliMenuKey;
  label: string;
  href: string;
  icon: React.FC<{ size?: number; className?: string }>;
  badge?: string;
}

export const PembeliSidebar: React.FC<PembeliSidebarProps> = ({
  activeMenu,
  onSelectMenu,
  buyerBalance = 0,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems: MenuItemDef[] = [
    {
      key: "dashboard",
      label: "Dashboard Akun",
      href: "/pembeli",
      icon: DashboardIcon,
    },
    {
      key: "orders",
      label: "Pesanan Saya",
      href: "/pembeli/orders",
      icon: PackageIcon,
    },
    {
      key: "favorites",
      label: "Produk Favorit",
      href: "/pembeli/favorites",
      icon: HeartIcon,
    },
    {
      key: "profile",
      label: "Profil Akun",
      href: "/pembeli/profile",
      icon: UserIcon,
    },
    {
      key: "settings",
      label: "Pengaturan Akun",
      href: "/pembeli/settings",
      icon: SettingsIcon,
    },
  ];

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const initialChar = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const renderContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Bagian Atas: Header Akun & Saldo */}
      <div className="space-y-5">
        {/* Profil Singkat Pembeli */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white shrink-0 shadow-xs">
            {initialChar}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.name || "Pelanggan"}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.email || "pembeli@nextshop.id"}
            </p>
            <span className="inline-block mt-1 px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
              Role: Pembeli
            </span>
          </div>
        </div>

        {/* Kartu Saldo / Dompet Pembeli */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium opacity-90 mb-1">
            <span>Saldo Akun Belanja</span>
            <CreditCardIcon size={16} />
          </div>
          <div className="text-xl font-black tracking-tight">
            {formatRupiah(buyerBalance)}
          </div>
          <p className="text-[10px] opacity-80 mt-1">
            Dapat digunakan untuk pembayaran pesanan & refund
          </p>
        </div>

        {/* Menu Navigasi Utama Pembeli */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Aktivitas Belanja
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.key;

            return onSelectMenu ? (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelectMenu(item.key);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              </button>
            ) : (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bagian Bawah: Switcher Tema & Logout */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-2">
        <Link
          href="/katalog"
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ShoppingBagIcon size={16} className="text-emerald-500" />
          <span>Lanjut Belanja di Katalog</span>
        </Link>

        {/* Toggle Mode Gelap / Terang */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            {theme === "dark" ? <SunIcon size={16} className="text-amber-400" /> : <MoonIcon size={16} className="text-blue-500" />}
            <span>{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400">
            {theme}
          </span>
        </button>

        {/* Tombol Logout */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
        >
          <LogoutIcon size={16} />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Tombol Toggle Sidebar Mobile */}
      <div className="lg:hidden mb-4 flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {initialChar}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {user?.name || "Pelanggan"}
            </div>
            <div className="text-[10px] text-slate-400">Area Akun Pembeli</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          {isMobileOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}
        </button>
      </div>

      {/* Drawer Mobile */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#0f172a] p-5 h-full z-10 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/10">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Menu Akun Pembeli
              </span>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      )}

      {/* Desktop Sidebar Static Card */}
      <aside className="hidden lg:block w-72 shrink-0 p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs h-fit sticky top-24">
        {renderContent()}
      </aside>
    </>
  );
};

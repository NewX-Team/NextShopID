"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SearchIcon,
  CartIcon,
  MenuIcon,
  CloseIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  PackageIcon,
  ShieldIcon,
  SunIcon,
  MoonIcon,
} from "@/components/ui/icons";
import { SearchModal } from "./SearchModal";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface NavbarProps {
  cartItemCount?: number;
}

// Menu navigasi utama e-commerce dengan routing URL nyata
const NAV_ITEMS = [
  { label: "Home", id: "Home", href: "/" },
  { label: "Katalog", id: "Katalog", href: "/katalog" },
  { label: "Terbaru", id: "Terbaru", href: "/terbaru" },
  { label: "Promo", id: "Promo", href: "/promo" },
  { label: "Favorite", id: "Favorite", href: "/favorite" },
];

export const Navbar: React.FC<NavbarProps> = ({ cartItemCount = 0 }) => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Khusus halaman privat Admin & Penjual: Tanpa Navbar sama sekali (kanvas putih kosong)
  const isPrivatePanel = pathname?.startsWith("/admin") || pathname?.startsWith("/penjual");

  // Sinkronkan activeMenu secara reaktif berdasarkan URL route saat ini
  const activeMenu = useMemo(() => {
    if (!pathname) return "Home";
    if (pathname === "/") return "Home";
    if (pathname === "/katalog" || pathname.startsWith("/katalog/")) return "Katalog";
    if (pathname === "/terbaru" || pathname.startsWith("/terbaru/")) return "Terbaru";
    if (pathname === "/promo" || pathname.startsWith("/promo/")) return "Promo";
    if (
      pathname === "/favorite" ||
      pathname.startsWith("/favorite/") ||
      pathname === "/favorites" ||
      pathname.startsWith("/favorites/")
    ) {
      return "Favorite";
    }
    // Jika di halaman lain seperti /login, /register, /profile, /settings, sembunyikan glider
    return "";
  }, [pathname]);

  // State posisi dan dimensi glider bulatan fisik yang bergeser
  const [gliderStyle, setGliderStyle] = useState({
    left: 0,
    width: 0,
    top: 0,
    height: 0,
    isReady: false,
  });

  // Referensi DOM tiap button/link menu untuk pelacakan posisi presisi
  const menuRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  // Fungsi kalkulasi koordinat dan ukuran elemen aktif secara subpixel
  const updateGlider = useCallback((menuId: string) => {
    if (!menuId) {
      setGliderStyle((prev) => ({ ...prev, isReady: false }));
      return;
    }
    const activeEl = menuRefs.current[menuId];
    if (activeEl) {
      setGliderStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        top: activeEl.offsetTop,
        height: activeEl.offsetHeight,
        isReady: true,
      });
    }
  }, []);

  // Update posisi glider setiap kali activeMenu / route berubah
  useEffect(() => {
    updateGlider(activeMenu);
    const frameId = requestAnimationFrame(() => {
      updateGlider(activeMenu);
    });
    return () => cancelAnimationFrame(frameId);
  }, [activeMenu, updateGlider]);

  // Handle resize layar agar glider selalu tepat di posisinya
  useEffect(() => {
    const handleResize = () => updateGlider(activeMenu);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMenu, updateGlider]);

  // Deteksi click outside untuk menutup profile dropdown popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  // Deteksi scroll untuk micro-interaction elevasi navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Shortcut keyboard global: Cmd+K / Ctrl+K untuk membuka quick search, dan ESC untuk dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsProfileDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Khusus halaman privat Admin & Penjual, serta pengguna dengan role 'admin':
  // Tidak me-render Navbar sama sekali karena admin fokus pada administrasi sistem di /admin
  if (isPrivatePanel || (isAuthenticated && user?.role === "admin")) {
    return null;
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ease-out border-b ${
          isScrolled
            ? "border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-[#0b0f19]/95 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] py-0"
            : "border-slate-100 bg-white/90 dark:border-white/10 dark:bg-[#0b0f19]/90 backdrop-blur-xs py-0.5"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
          
          {/* Sisi Kiri: Brand Logo & Container Pill Navigasi */}
          <div className="flex items-center gap-5 lg:gap-8">
            
            {/* Logo NextShopID: Navigasi Cepat ke Beranda */}
            <Link
              href="/"
              className="group flex items-center text-[19px] font-bold tracking-tight text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 rounded-lg py-1 px-1 transition-opacity hover:opacity-90"
              aria-label="NextShopID Beranda"
            >
              <span className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5">
                NextShop
              </span>
              <span className="text-blue-600 dark:text-blue-500 font-bold transition-colors duration-200 group-hover:text-blue-700 ml-0.5">
                ID
              </span>
            </Link>

            {/* Container Utama Navigasi:
                - Tema Light: Abu-abu terang (#e9edf5) selaras dengan background putih
                - Tema Dark: Navy gelap (#0b132b) selaras dengan background hitam/gelap
            */}
            <nav
              className="relative hidden md:inline-flex items-center p-1.5 px-3.5 gap-1 rounded-full bg-[#e9edf5] dark:bg-[#0b132b] border border-slate-300/70 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03),0_2px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-4px_rgba(11,19,43,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-colors duration-200"
              aria-label="Navigasi Utama"
            >
              {/* Bulatan Fisik Glider: Tetap Navy Terang (Royal Sapphire) di Tema Gelap MAUPUN Terang */}
              <div
                className={`absolute left-0 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 border-t border-white/30 border-x border-b border-blue-600/50 shadow-[0_2px_12px_rgba(37,99,235,0.45),0_0_12px_rgba(37,99,235,0.2)] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none ${
                  gliderStyle.isReady ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: `translateX(${gliderStyle.left}px)`,
                  width: `${gliderStyle.width}px`,
                  top: `${gliderStyle.top}px`,
                  height: `${gliderStyle.height}px`,
                }}
                aria-hidden="true"
              />

              {NAV_ITEMS.map((item) => {
                const isActive = activeMenu === item.id;
                const isPromo = item.id === "Promo";

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    ref={(el) => {
                      menuRefs.current[item.id] = el;
                    }}
                    onClick={() => {
                      updateGlider(item.id);
                    }}
                    className={`relative z-10 flex items-center justify-center px-4 py-1.5 h-8 rounded-full text-[13px] font-medium tracking-tight transition-colors duration-150 select-none leading-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
                      isActive
                        ? isPromo
                          ? "text-amber-200 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                          : "text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                        : isPromo
                        ? "text-amber-600 hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200 font-semibold"
                        : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tengah: Search Trigger Bar (Command Palette Trigger dengan Refined Input Pill) */}
          <div className="hidden sm:flex flex-1 max-w-md justify-center">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="group relative flex items-center w-full rounded-full border border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-slate-900/80 px-4 py-2 text-left text-sm text-slate-400 dark:text-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 active:scale-[0.99]"
              aria-label="Buka pencarian cepat (Command + K)"
            >
              <span className="mr-2.5 text-slate-400 dark:text-slate-500 transition-colors duration-150 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                <SearchIcon size={16} />
              </span>
              <span className="flex-1 truncate text-[13px] font-normal">
                Cari produk, kategori, atau brand...
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-400 shadow-2xs transition-colors duration-150 group-hover:border-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Sisi Kanan: Search Mobile Trigger, Cart, Theme Toggle, Auth Status (Login/Register ATAU Profile Dropdown) */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            
            {/* Search Trigger Khusus Layar Ponsel */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Pencarian"
            >
              <SearchIcon size={18} />
            </button>

            {/* Cart Icon & Mini Bag Preview Popover */}
            <div className="relative group">
              <Link
                href="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 dark:text-slate-300 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white active:scale-95"
                aria-label="Keranjang Belanja"
              >
                <CartIcon
                  size={20}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5"
                />

                {cartItemCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-2xs">
                    {cartItemCount}
                  </span>
                ) : null}
              </Link>

              {/* Micro-interaction: Mini Bag Peek on Hover (Desktop Only) */}
              <div className="pointer-events-none absolute right-0 top-full pt-2 opacity-0 -translate-y-1 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 hidden sm:block z-50">
                <div className="w-64 rounded-2xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-slate-900 p-4 shadow-xl ring-1 ring-slate-900/5">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-white/10">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Keranjang
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {cartItemCount} item
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    {cartItemCount === 0
                      ? "Keranjang belanja Anda masih kosong."
                      : `${cartItemCount} produk siap di-checkout.`}
                  </p>
                  <Link
                    href="/cart"
                    className="mt-2 block w-full rounded-full bg-blue-600 hover:bg-blue-700 py-2 text-center text-xs font-medium text-white transition-colors shadow-xs"
                  >
                    Lihat Keranjang
                  </Link>
                </div>
              </div>
            </div>

            {/* Tombol Pengalih Tema: Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white active:scale-95 cursor-pointer"
              aria-label={theme === "dark" ? "Ganti ke Mode Terang (Light)" : "Ganti ke Mode Gelap (Dark)"}
              title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
            >
              {theme === "dark" ? (
                <SunIcon size={19} className="text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <MoonIcon size={18} className="text-slate-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
              )}
            </button>

            {/* Divider Halus */}
            <span className="hidden sm:inline-block h-4 w-[1px] bg-slate-200/80 dark:bg-white/15 mx-0.5" aria-hidden="true" />

            {/* KONDISIONAL: Jika Sudah Login -> Tampilkan Bulatan Avatar Profile dengan Dropdown Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#0b132b] to-slate-800 text-white font-semibold text-sm shadow-[0_2px_10px_rgba(11,19,43,0.25)] border-2 border-white dark:border-slate-800 ring-1 ring-slate-900/10 transition-all duration-200 hover:ring-2 hover:ring-blue-500/50 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Menu profil dan akun"
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="select-none tracking-tight">
                    {user?.name ? user.name[0]?.toUpperCase() : <UserIcon size={18} />}
                  </span>

                  {/* Micro-indicator: Status Online Emerald */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                    aria-hidden="true"
                  />
                </button>

                {/* Dropdown Menu Profile & Settings */}
                {isProfileDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2.5 w-72 rounded-2xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-slate-900 p-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-150 z-50"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* Header Profil User Card */}
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 p-3 border border-slate-100 dark:border-white/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xs">
                        {user?.name ? user.name[0]?.toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                            {user?.name || "User NextShopID"}
                          </p>
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-medium border ${
                            user?.role === "admin"
                              ? "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
                              : user?.role === "penjual"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                              : "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60"
                          }`}>
                            {user?.role === "admin" ? "Admin" : user?.role === "penjual" ? "Penjual" : "Member"}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {user?.email || `@${user?.username}`}
                        </p>
                      </div>
                    </div>

                    {/* Navigasi Profil & Pengaturan */}
                    <div className="py-1">
                      {/* Shortcut Dashboard Khusus Admin */}
                      {user?.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors"
                          role="menuitem"
                        >
                          <span className="text-amber-600 dark:text-amber-400">
                            <ShieldIcon size={16} />
                          </span>
                          <div className="flex-1">
                            <span className="block leading-none font-semibold">Dashboard Admin</span>
                            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">Panel kontrol sistem</span>
                          </div>
                        </Link>
                      )}

                      {/* Shortcut Dashboard Khusus Penjual */}
                      {user?.role === "penjual" && (
                        <Link
                          href="/penjual"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 transition-colors"
                          role="menuitem"
                        >
                          <span className="text-emerald-600 dark:text-emerald-400">
                            <PackageIcon size={16} />
                          </span>
                          <div className="flex-1">
                            <span className="block leading-none font-semibold">Dashboard Penjual</span>
                            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">Panel kelola toko</span>
                          </div>
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                        role="menuitem"
                      >
                        <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                          <UserIcon size={16} />
                        </span>
                        <div className="flex-1">
                          <span className="block leading-none">Profil Saya</span>
                          <span className="text-[10px] text-slate-400 font-normal">Informasi data diri & kontak</span>
                        </div>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                        role="menuitem"
                      >
                        <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                          <SettingsIcon size={16} />
                        </span>
                        <div className="flex-1">
                          <span className="block leading-none">Pengaturan</span>
                          <span className="text-[10px] text-slate-400 font-normal">Preferensi akun & keamanan</span>
                        </div>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                        role="menuitem"
                      >
                        <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                          <PackageIcon size={16} />
                        </span>
                        <div className="flex-1">
                          <span className="block leading-none">Pesanan Saya</span>
                          <span className="text-[10px] text-slate-400 font-normal">Riwayat belanja & status paket</span>
                        </div>
                      </Link>
                    </div>

                    <div className="h-[1px] bg-slate-100 dark:bg-white/10 my-1 mx-1" />

                    {/* Tombol Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300 transition-colors text-left"
                      role="menuitem"
                    >
                      <span className="text-rose-500 transition-colors">
                        <LogoutIcon size={16} />
                      </span>
                      <span>Keluar Akun (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* KONDISIONAL: Jika Belum Login -> Tampilkan Login & Register Buttons */
              <>
                {/* Editorial Typographic Login Action Link */}
                <Link
                  href="/login"
                  className="group relative px-3 py-1.5 text-[13px] font-medium tracking-tight text-slate-700 dark:text-slate-300 transition-colors duration-200 hover:text-slate-950 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 rounded-full hover:bg-slate-100/70 dark:hover:bg-white/10"
                >
                  <span>Login</span>
                  <span className="absolute inset-x-3 bottom-1 h-[1.5px] bg-blue-600 scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100 origin-center" />
                </Link>

                {/* Tombol Register: Menggunakan NAVY TERANG di Tema Terang MAUPUN Gelap */}
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-5 py-2 text-[13px] font-medium tracking-tight text-white shadow-[0_2px_10px_rgba(37,99,235,0.3)] border border-blue-500/40 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Register
                </Link>
              </>
            )}

            {/* Mobile Navigation Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all md:hidden ml-1"
              aria-label="Toggle Menu Navigasi"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sheet */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-100 dark:border-white/10 bg-white/98 dark:bg-[#0b0f19]/98 backdrop-blur-md px-4 py-4 md:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="rounded-2xl bg-[#e9edf5] dark:bg-[#0b132b] p-3 text-slate-900 dark:text-white border border-slate-300/60 dark:border-white/10 shadow-lg">
              <nav className="flex flex-col gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeMenu === item.id;
                  const isPromo = item.id === "Promo";

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-full px-4 py-2.5 text-sm font-medium tracking-tight transition-all duration-150 text-left ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-xs"
                          : isPromo
                          ? "text-amber-600 dark:text-amber-300 hover:bg-white/20 dark:hover:bg-white/5 font-semibold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Sesi Pengguna di Tampilan Mobile */}
              {isAuthenticated ? (
                <div className="mt-3 pt-3 border-t border-slate-300/40 dark:border-white/10 flex flex-col gap-1">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-300/40 dark:border-white/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
                      {user?.name ? user.name[0]?.toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                        <span className="text-[10px] px-1 rounded bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {user?.role === "admin" ? "Admin" : user?.role === "penjual" ? "Penjual" : "Member"}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 font-mono">{user?.email}</p>
                    </div>
                  </div>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 rounded-lg hover:bg-white/20 dark:hover:bg-white/5"
                    >
                      <ShieldIcon size={16} />
                      <span>Dashboard Admin</span>
                    </Link>
                  )}

                  {user?.role === "penjual" && (
                    <Link
                      href="/penjual"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg hover:bg-white/20 dark:hover:bg-white/5"
                    >
                      <PackageIcon size={16} />
                      <span>Dashboard Penjual</span>
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-white/20 dark:hover:bg-white/5"
                  >
                    <UserIcon size={16} />
                    <span>Profil Saya</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-white/20 dark:hover:bg-white/5"
                  >
                    <SettingsIcon size={16} />
                    <span>Pengaturan</span>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-white/20 dark:hover:bg-white/5"
                  >
                    <PackageIcon size={16} />
                    <span>Pesanan Saya</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg hover:bg-white/20 dark:hover:bg-white/5 text-left"
                  >
                    <LogoutIcon size={16} />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-300/40 dark:border-white/10 flex items-center gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 rounded-full border border-slate-300 dark:border-white/20 py-2 text-center text-xs font-medium text-slate-700 dark:text-white hover:bg-white/30 dark:hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 rounded-full bg-blue-600 py-2 text-center text-xs font-medium text-white hover:bg-blue-700 shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Spotlight Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

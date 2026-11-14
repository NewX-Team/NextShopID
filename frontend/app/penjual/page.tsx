"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  PenjualSidebar,
  PenjualMenuKey,
} from "@/components/penjual/PenjualSidebar";
import { PenjualPlaceholderView } from "@/components/penjual/PenjualPlaceholderView";
import {
  sellerService,
  SellerProfile,
} from "@/services/seller.service";
import { ExternalLinkIcon, StoreIcon } from "@/components/ui/icons";

export default function PenjualPage() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // State menu aktif, profil realtime, dan status pembaruan
  const [activeMenu, setActiveMenu] = useState<PenjualMenuKey>("dashboard");
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [storeBalance, setStoreBalance] = useState<number>(0);
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState<boolean>(false);

  // Ambil profil & statistik toko realtime dari backend Express
  const fetchSellerData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await sellerService.getProfile(token);
      if (res.success && res.seller) {
        setSellerProfile(res.seller);
        setIsStoreOpen(res.seller.isStoreOpen);
        setStoreBalance(res.seller.balance);
      }
    } catch (err) {
      console.error("[PenjualPage] Gagal mengambil data realtime penjual:", err);
    }
  }, [token]);

  // Muat data saat token tersedia
  useEffect(() => {
    if (isAuthenticated && user?.role === "penjual") {
      fetchSellerData();
    }
  }, [isAuthenticated, user?.role, fetchSellerData]);

  // Polling berkala di latar belakang setiap 15 detik agar selalu realtime
  useEffect(() => {
    if (!token || !isAuthenticated || user?.role !== "penjual") return;

    const interval = setInterval(() => {
      fetchSellerData();
    }, 15000);

    return () => clearInterval(interval);
  }, [token, isAuthenticated, user?.role, fetchSellerData]);

  // Handler toggle status operasional toko buka / tutup (realtime ke database)
  const handleToggleStoreStatus = async () => {
    if (!token || isUpdatingStoreStatus) return;
    const targetStatus = !isStoreOpen;
    setIsUpdatingStoreStatus(true);

    // Optimistic UI Update
    setIsStoreOpen(targetStatus);

    try {
      const res = await sellerService.updateStoreStatus(token, targetStatus);
      if (res.success && typeof res.isStoreOpen === "boolean") {
        setIsStoreOpen(res.isStoreOpen);
        if (sellerProfile) {
          setSellerProfile({
            ...sellerProfile,
            isStoreOpen: res.isStoreOpen,
          });
        }
      } else {
        // Rollback jika request gagal
        setIsStoreOpen(!targetStatus);
      }
    } catch {
      setIsStoreOpen(!targetStatus);
    } finally {
      setIsUpdatingStoreStatus(false);
    }
  };

  // Validasi Hak Akses Role Penjual (RBAC Security Guard)
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "penjual") {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Hindari flash layout sebelum verifikasi otentikasi selesai
  if (isLoading || !isAuthenticated || user?.role !== "penjual") {
    return <div className="min-h-screen bg-white dark:bg-[#070b14]" />;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#070b14] text-slate-900 dark:text-white transition-colors duration-200">
      {/* 1. Sidebar Khusus Penjual dengan Fitur Realtime Murni */}
      <PenjualSidebar
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        onLogout={handleLogout}
        isStoreOpen={isStoreOpen}
        onToggleStoreStatus={handleToggleStoreStatus}
        isUpdatingStoreStatus={isUpdatingStoreStatus}
        storeBalance={storeBalance}
        stats={sellerProfile?.stats}
        verificationStatus={sellerProfile?.verificationStatus}
      />

      {/* 2. Area Konten Utama Portal Penjual */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar Penjual */}
        <header className="h-16 shrink-0 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 pl-12 md:pl-0">
            {/* Breadcrumb Path Navigasi */}
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Seller Center</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-semibold capitalize">
                {activeMenu.replace("_", " ")}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Operasional Toko Pill Badge Realtime */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 text-xs">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isStoreOpen ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isStoreOpen ? "Toko Buka" : "Toko Libur"}
              </span>
            </div>

            {/* Tombol Kunjungi Etalase Toko */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors"
              title="Lihat tampilan etalase produk di halaman beranda"
            >
              <StoreIcon size={14} className="text-emerald-500" />
              <span className="hidden md:inline">Lihat Toko Publik</span>
              <ExternalLinkIcon size={12} className="text-slate-400" />
            </Link>

            {/* Profil Penjual Ringkas */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {user?.name ? user.name[0]?.toUpperCase() : "P"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  {user?.name || "Mitra Penjual"}
                </p>
                <p
                  className={`text-[10px] font-medium mt-0.5 ${
                    sellerProfile?.verificationStatus === "verified"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : sellerProfile?.verificationStatus === "pending"
                      ? "text-amber-600 dark:text-amber-400"
                      : sellerProfile?.verificationStatus === "rejected"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {sellerProfile?.verificationStatus === "verified"
                    ? "Official Merchant"
                    : sellerProfile?.verificationStatus === "pending"
                    ? "Menunggu Tinjauan"
                    : sellerProfile?.verificationStatus === "rejected"
                    ? "Perlu Perbaikan"
                    : "Belum Verifikasi"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Canvas Body: Tempat Merender Masing-Masing Halaman Menu Secara Realtime */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <PenjualPlaceholderView
              activeMenu={activeMenu}
              sellerProfile={sellerProfile || undefined}
              token={token || undefined}
              onNavigateToMenu={setActiveMenu}
              onVerificationSubmitted={(updated) => {
                setSellerProfile(updated);
                fetchSellerData();
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

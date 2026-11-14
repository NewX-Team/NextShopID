"use client";

import React from "react";
import { PenjualMenuKey } from "./PenjualSidebar";
import { SellerProfile } from "@/services/seller.service";
import { PenjualVerificationView } from "./PenjualVerificationView";
import {
  DashboardIcon,
  PackageIcon,
  TruckIcon,
  ShoppingBagIcon,
  PlusIcon,
  PercentIcon,
  StarIcon,
  WalletIcon,
  SettingsIcon,
  StoreIcon,
  CheckCircleIcon,
  SearchIcon,
  FilterIcon,
  ShieldIcon,
  ClockIcon,
} from "@/components/ui/icons";

interface PenjualPlaceholderViewProps {
  activeMenu: PenjualMenuKey;
  sellerProfile?: SellerProfile;
  token?: string;
  onNavigateToMenu?: (menu: PenjualMenuKey) => void;
  onVerificationSubmitted?: (updatedProfile: SellerProfile) => void;
}

export const PenjualPlaceholderView: React.FC<PenjualPlaceholderViewProps> = ({
  activeMenu,
  sellerProfile,
  token,
  onNavigateToMenu,
  onVerificationSubmitted,
}) => {
  const stats = sellerProfile?.stats || {
    totalProducts: 0,
    totalOrders: 0,
    newOrdersCount: 0,
    shippingOrdersCount: 0,
    totalReviews: 0,
    averageRating: 0,
    totalRevenue: 0,
  };

  const formattedBalance = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(sellerProfile?.balance || 0);

  const formattedRevenue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue || 0);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Khusus Menu Verifikasi Toko
  if (activeMenu === "verifikasi") {
    return (
      <PenjualVerificationView
        sellerProfile={sellerProfile}
        token={token}
        onVerificationSubmitted={onVerificationSubmitted}
      />
    );
  }

  // 1. Dashboard View (Realtime Real Data)
  if (activeMenu === "dashboard") {
    return (
      <div className="space-y-6">
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Dashboard Toko
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Realtime
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ringkasan metrik penjualan aktual toko {sellerProfile?.name || "Anda"}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToMenu && onNavigateToMenu("tambah_produk")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <PlusIcon size={15} />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>

        {/* Banner Ajakan Verifikasi Toko ke Admin di Dashboard */}
        {sellerProfile?.verificationStatus !== "verified" && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-emerald-900/20 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <ShieldIcon size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {sellerProfile?.verificationStatus === "pending"
                      ? "Pengajuan Verifikasi Toko Sedang Ditinjau Admin"
                      : sellerProfile?.verificationStatus === "rejected"
                      ? "Pengajuan Verifikasi Toko Perlu Perbaikan"
                      : "Toko Belum Terverifikasi Resmi"}
                  </h4>
                  {sellerProfile?.verificationStatus === "pending" && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Audit 1x24 Jam
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {sellerProfile?.verificationStatus === "pending"
                    ? "Berkas identitas Anda sedang diaudit oleh Tim Administrator. Tunggu notifikasi persetujuan resmi."
                    : sellerProfile?.verificationStatus === "rejected"
                    ? "Periksa alasan penolakan dan perbarui data identitas Anda untuk diajukan ulang."
                    : "Dapatkan lencana Official Verified Merchant, prioritas algoritma etalase, dan pencairan saldo kilat."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToMenu && onNavigateToMenu("verifikasi")}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <span>
                {sellerProfile?.verificationStatus === "pending"
                  ? "Lihat Status Tinjauan →"
                  : "Ajukan Verifikasi Sekarang →"}
              </span>
            </button>
          </div>
        )}

        {/* 4 KPI Cards Aktual (Realtime) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card: Total Pendapatan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Pendapatan
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <WalletIcon size={16} />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formattedRevenue}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {stats.totalRevenue > 0 ? "Akumulasi omset toko" : "Belum ada transaksi"}
            </p>
          </div>

          {/* Card: Pesanan Selesai */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Pesanan Masuk
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <PackageIcon size={16} />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalOrders}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {stats.newOrdersCount > 0 ? `${stats.newOrdersCount} pesanan baru` : "0 pesanan baru"}
            </p>
          </div>

          {/* Card: Produk di Etalase */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Katalog Produk
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShoppingBagIcon size={16} />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalProducts}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {stats.totalProducts > 0 ? `${stats.totalProducts} produk aktif` : "Belum ada produk"}
            </p>
          </div>

          {/* Card: Rating Toko */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Rating Toko
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <StarIcon size={16} />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalReviews > 0 ? stats.averageRating : "-"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {stats.totalReviews > 0 ? `${stats.totalReviews} ulasan pembeli` : "Belum ada ulasan"}
            </p>
          </div>
        </div>

        {/* Kanvas Kosongan Putih Realtime (Bila Data Kosong) */}
        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4 shadow-xs">
              <StoreIcon size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-3">
              <CheckCircleIcon size={13} className="text-emerald-500" />
              <span>Status Toko: {sellerProfile?.isStoreOpen ? "Buka" : "Libur"}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Aktivitas Toko Masih Kosong
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
              Saat ini toko Anda belum memiliki produk terdaftar atau pesanan masuk. Mulai tambahkan produk pertama Anda agar pembeli dapat melakukan transaksi.
            </p>

            <button
              type="button"
              onClick={() => onNavigateToMenu && onNavigateToMenu("tambah_produk")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <PlusIcon size={14} />
              <span>+ Daftarkan Produk Pertama</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Katalog Produk View
  if (activeMenu === "produk") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Katalog Produk Toko
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {stats.totalProducts} Produk
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Kelola stok barang dagangan, penyesuaian harga, varian, dan etalase toko Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToMenu && onNavigateToMenu("tambah_produk")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <PlusIcon size={15} />
              <span>Tambah Produk Baru</span>
            </button>
          </div>
        </div>

        {/* Toolbar Mockup Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon size={15} />
            </div>
            <input
              type="text"
              readOnly
              placeholder="Cari produk toko berdasarkan nama atau SKU..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FilterIcon size={14} className="shrink-0 text-slate-400" />
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              Semua ({stats.totalProducts})
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
              Aktif (0)
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
              Habis (0)
            </span>
          </div>
        </div>

        {/* Kanvas Putih Kosongan Produk */}
        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-4 shadow-xs">
              <ShoppingBagIcon size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-3">
              <span>Etalase Toko: 0 Barang</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Belum Ada Produk Terdaftar
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
              Toko Anda belum memiliki produk aktif untuk dijual. Daftarkan produk pertama Anda lengkap dengan foto, harga, dan stok barang.
            </p>

            <button
              type="button"
              onClick={() => onNavigateToMenu && onNavigateToMenu("tambah_produk")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <PlusIcon size={14} />
              <span>+ Tambah Produk Baru</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Pesanan Masuk View
  if (activeMenu === "pesanan") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Pesanan Masuk
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {stats.totalOrders} Pesanan
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pantau dan kelola pesanan belanja dari pelanggan platform NextShopID.
            </p>
          </div>
        </div>

        {/* Toolbar Mockup Filter Pesanan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon size={15} />
            </div>
            <input
              type="text"
              readOnly
              placeholder="Cari berdasarkan nomor invoice atau nama pembeli..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto pb-1 sm:pb-0">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 whitespace-nowrap">
              Semua ({stats.totalOrders})
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Perlu Diproses (0)
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Dikirim (0)
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Selesai (0)
            </span>
          </div>
        </div>

        {/* Kanvas Putih Kosongan Pesanan */}
        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-4 shadow-xs">
              <PackageIcon size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-3">
              <span>Status Transaksi: Kosong</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Belum Ada Pesanan Masuk
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-4">
              Saat ini belum ada pesanan belanja dari pembeli. Setiap pesanan baru yang masuk akan langsung muncul secara realtime di halaman ini.
            </p>

            <span className="text-[11px] text-slate-400">
              Notifikasi pesanan baru akan aktif secara otomatis.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pengiriman & Logistik View
  if (activeMenu === "pengiriman") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Pengiriman & Kurir
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {stats.shippingOrdersCount} Dalam Pengiriman
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pelacakan nomor resi dan jadwal penjemputan paket kurir ekspedisi.
            </p>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 shadow-xs">
              <TruckIcon size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-3">
              <span>Kurir Mitra: JNE, SiCepat, J&T, GoSend</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Tidak Ada Pengiriman Aktif
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Belum ada paket yang sedang dalam proses penjemputan kurir atau pengantaran ke alamat pembeli.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Tambah Produk View
  if (activeMenu === "tambah_produk") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Tambah Produk Baru
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Pendaftaran Barang
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Formulir unggah produk ke etalase toko {sellerProfile?.name || "Anda"}.
            </p>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4 shadow-xs">
              <PlusIcon size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-3">
              <span>Modul: Form Pendaftaran Produk</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Halaman Tambah Produk Baru
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
              Area formulir pendaftaran barang baru: unggah foto multi-sudut, penentuan kategori, variasi ukuran/warna, deskripsi lengkap, serta berat paket pengiriman.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                ✓ Upload Multi-Foto
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                ✓ Varian Harga & Stok
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                ✓ Berat & Dimensi Ekspedisi
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Promosi & Voucher View
  if (activeMenu === "promosi") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Promosi & Voucher Toko
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                0 Promosi Aktif
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Buat kupon diskon toko, flash sale etalase, dan bundle belanja hemat.
            </p>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 shadow-xs">
              <PercentIcon size={28} />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Belum Ada Promosi Aktif
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Toko Anda belum memiliki promosi diskon atau voucher belanja aktif. Fitur ini akan membantu Anda meningkatkan daya tarik produk di mata calon pembeli.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 7. Ulasan Pembeli View
  if (activeMenu === "ulasan") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Ulasan Pembeli
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {stats.totalReviews} Ulasan
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ulasan dan penilaian kepuasan pembeli terhadap barang dagangan toko Anda.
            </p>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 shadow-xs">
              <StarIcon size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 mb-3">
              <span>Rating Rata-rata: {stats.totalReviews > 0 ? stats.averageRating : "Belum Ada"}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Belum Ada Ulasan Pembeli
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Toko Anda belum menerima ulasan atau rating bintang dari pembeli. Ulasan akan masuk setelah produk selesai dikirim dan diterima konsumen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 8. Keuangan & Saldo View
  if (activeMenu === "keuangan") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Saldo & Keuangan Toko
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Settlement
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Rekapitulasi pendapatan bersih dan mutasi penarikan dana ke rekening bank.
            </p>
          </div>
        </div>

        {/* Ringkasan Saldo Aktual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo Siap Ditarik
            </span>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formattedBalance}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {sellerProfile && sellerProfile.balance > 0 ? "Bisa dicairkan ke bank" : "Belum ada saldo penghasilan"}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo Tertahan (Dalam Pengiriman)
            </span>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rp 0
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Akan masuk saldo setelah pesanan selesai
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Rekening Bank Terdaftar
            </span>
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Belum Ditautkan
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Tambahkan nomor rekening untuk penarikan
            </p>
          </div>
        </div>

        {/* Kanvas Kosongan Mutasi */}
        <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-8 sm:p-14 shadow-sm text-center">
          <div className="w-full max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4 shadow-xs">
              <WalletIcon size={28} />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Belum Ada Riwayat Mutasi Keuangan
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Catatan mutasi saldo masuk dari pesanan dan saldo keluar dari penarikan dana akan tercatat secara realtime di sini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 9. Pengaturan Profil Toko View (Realtime Real Seller Data)
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Pengaturan Toko
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
              Konfigurasi Akun
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Identitas resmi toko dan alamat operasional gudang pengiriman.
          </p>
        </div>
      </div>

      <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-6 sm:p-10 shadow-sm">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
            <div className="relative shrink-0">
              <div
                className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md transition-all ${
                  sellerProfile?.verificationStatus === "verified"
                    ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0c1220]"
                    : ""
                }`}
              >
                {sellerProfile?.name ? sellerProfile.name[0]?.toUpperCase() : "P"}
              </div>
              {sellerProfile?.verificationStatus === "verified" && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-sm bg-red-600 text-white text-[9px] font-black uppercase tracking-tight shadow-xs border border-white dark:border-[#0c1220] leading-none pointer-events-none select-none z-10">
                  Mall
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {sellerProfile?.name || "Toko Mitra"}
              </h3>
              <p className="text-xs text-slate-400">
                @{sellerProfile?.username || "penjual"} • Terdaftar sejak {formatDate(sellerProfile?.createdAt)}
              </p>
              
              <div className="mt-2 flex items-center gap-2">
                {sellerProfile?.verificationStatus === "verified" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircleIcon size={11} className="shrink-0" />
                    <span>Official Verified Merchant</span>
                  </span>
                ) : sellerProfile?.verificationStatus === "pending" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <ClockIcon size={11} className="shrink-0" />
                    <span>Menunggu Tinjauan Verifikasi</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigateToMenu && onNavigateToMenu("verifikasi")}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer"
                  >
                    <ShieldIcon size={11} className="shrink-0" />
                    <span>Ajukan Verifikasi Toko</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <span className="text-slate-400">Email Akun:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-1">
                {sellerProfile?.email || "-"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <span className="text-slate-400">Status Operasional Toko:</span>
              <p className="font-semibold text-slate-900 dark:text-white mt-1">
                {sellerProfile?.isStoreOpen ? "Buka (Menerima Pesanan)" : "Libur / Tutup"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
            Pengaturan logo banner etalase toko, alamat pickup kurir, dan rekening penarikan dana akan dikonfigurasikan di sini.
          </div>
        </div>
      </div>
    </div>
  );
};

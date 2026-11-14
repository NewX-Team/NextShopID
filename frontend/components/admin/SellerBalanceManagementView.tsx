"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  WalletIcon,
  PlusIcon,
  RefreshIcon,
  DollarSignIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  SearchIcon,
  FilterIcon,
  ClockIcon,
  CloseIcon,
  AlertCircleIcon,
  CheckIcon,
  StoreIcon,
  UsersIcon,
  BadgeCheckIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import {
  adminService,
  AdminSellerBalanceItem,
  AdminSellerBalanceStats,
  AdminBalanceMutationItem,
} from "@/services/admin.service";

interface FeedbackState {
  type: "success" | "error";
  text: string;
}

const QUICK_AMOUNTS = [
  50000,
  100000,
  250000,
  500000,
  1000000,
  2500000,
];

export const SellerBalanceManagementView: React.FC = () => {
  const { token } = useAuth();

  // State data utama
  const [sellers, setSellers] = useState<AdminSellerBalanceItem[]>([]);
  const [stats, setStats] = useState<AdminSellerBalanceStats>({
    totalSellers: 0,
    totalStoreBalance: 0,
    averageStoreBalance: 0,
    activeBalanceCount: 0,
    zeroBalanceCount: 0,
    openStoreCount: 0,
  });

  // State filter & pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [storeStatusFilter, setStoreStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("highest_balance");

  // State loading & feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  // State Modal Tambah Saldo (Top-Up Manual)
  const [topupTargetSeller, setTopupTargetSeller] = useState<AdminSellerBalanceItem | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>("100000");
  const [topupNote, setTopupNote] = useState<string>("");
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);

  // State Modal Riwayat Mutasi
  const [historyTargetSeller, setHistoryTargetSeller] = useState<AdminSellerBalanceItem | null>(null);
  const [mutationsHistory, setMutationsHistory] = useState<AdminBalanceMutationItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Format mata uang Rupiah
  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format tanggal Indonesia
  const formatDateTime = (dateString: string): string => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateString;
    }
  };

  // Mengambil daftar saldo dari API
  const fetchBalances = useCallback(
    async (isBackground = false) => {
      if (!token) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await adminService.getSellerBalances(token, {
          search: searchQuery,
          balanceStatus: balanceFilter,
          storeStatus: storeStatusFilter,
          sort: sortBy,
        });

        if (res.success) {
          setSellers(res.data);
          setStats(res.stats);
        } else {
          setFeedback({
            type: "error",
            text: res.message || "Gagal memuat daftar saldo penjual.",
          });
        }
      } catch (err) {
        console.error("[SellerBalanceManagementView] Fetch error:", err);
        setFeedback({
          type: "error",
          text: "Terjadi kesalahan saat menghubungi server.",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, searchQuery, balanceFilter, storeStatusFilter, sortBy]
  );

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Handler Buka Modal Topup
  const handleOpenTopup = (seller: AdminSellerBalanceItem) => {
    setTopupTargetSeller(seller);
    setTopupAmount("100000");
    setTopupNote("");
    setFeedback(null);
  };

  // Handler Submit Topup Manual
  const handleSubmitTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !topupTargetSeller) return;

    const parsed = Number(topupAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setFeedback({
        type: "error",
        text: "Nominal saldo harus bernilai positif lebih dari 0.",
      });
      return;
    }

    setIsSubmittingTopup(true);
    setFeedback(null);

    try {
      const res = await adminService.topupSellerBalance(token, topupTargetSeller.id, {
        amount: parsed,
        description: topupNote.trim() || undefined,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || `Berhasil menambahkan ${formatRupiah(parsed)} ke toko ${topupTargetSeller.name}.`,
        });
        setTopupTargetSeller(null);
        fetchBalances(true);
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal menambahkan saldo akun penjual.",
        });
      }
    } catch (err) {
      console.error("[handleSubmitTopup] Error:", err);
      setFeedback({
        type: "error",
        text: "Gagal terhubung ke server saat memproses penambahan saldo.",
      });
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  // Handler Buka Modal Riwayat Mutasi
  const handleOpenHistory = async (seller: AdminSellerBalanceItem) => {
    if (!token) return;
    setHistoryTargetSeller(seller);
    setIsLoadingHistory(true);
    setMutationsHistory([]);

    try {
      const res = await adminService.getSellerBalanceHistory(token, seller.id);
      if (res.success) {
        setMutationsHistory(res.data);
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal memuat riwayat mutasi saldo.",
        });
      }
    } catch (err) {
      console.error("[handleOpenHistory] Error:", err);
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan saat memuat riwayat mutasi.",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const calculatedNewBalance =
    topupTargetSeller && !isNaN(Number(topupAmount)) && Number(topupAmount) > 0
      ? topupTargetSeller.storeBalance + Number(topupAmount)
      : topupTargetSeller?.storeBalance || 0;

  return (
    <div className="space-y-6">
      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm transition-all duration-300 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircleIcon size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircleIcon size={20} className="shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <WalletIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Saldo Akun Penjual
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau saldo live seluruh toko merchant dan lakukan penambahan saldo manual realtime.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Segarkan Realtime */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchBalances(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshIcon size={16} className={isRefreshing ? "animate-spin text-emerald-500" : ""} />
            <span>{isRefreshing ? "Menyinkronkan..." : "Segarkan Data"}</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkasan Saldo Penjual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Total Saldo Seluruh Penjual */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Saldo Seluruh Penjual
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <WalletIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats.totalStoreBalance)}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Akumulasi saldo pada {stats.totalSellers} merchant
            </p>
          </div>
        </div>

        {/* Metrik 2: Rata-Rata Saldo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Rata-Rata Saldo Toko
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <TrendingUpIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
              {formatRupiah(stats.averageStoreBalance)}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Rata-rata kepemilikan dana per toko
            </p>
          </div>
        </div>

        {/* Metrik 3: Toko Bersaldo Aktif */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Toko Memiliki Saldo Aktif
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
              <CheckCircleIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
              {stats.activeBalanceCount} <span className="text-sm font-normal text-slate-400">Toko</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Toko dengan saldo lebih dari Rp 0
            </p>
          </div>
        </div>

        {/* Metrik 4: Toko Saldo Nol */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Toko Saldo Kosong (Rp 0)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
              <DollarSignIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {stats.zeroBalanceCount} <span className="text-sm font-normal text-slate-400">Toko</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Belum memiliki saldo penjualan
            </p>
          </div>
        </div>
      </div>

      {/* Kontrol Pencarian, Filter & Sort */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Input Pencarian */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama toko, username, atau email penjual..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Filter Status Saldo */}
          <div className="md:col-span-2">
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Saldo</option>
              <option value="has_balance">Memiliki Saldo (&gt; Rp 0)</option>
              <option value="zero_balance">Saldo Kosong (Rp 0)</option>
            </select>
          </div>

          {/* Filter Status Toko */}
          <div className="md:col-span-2">
            <select
              value={storeStatusFilter}
              onChange={(e) => setStoreStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Status Toko</option>
              <option value="open">Toko Buka</option>
              <option value="closed">Toko Tutup</option>
            </select>
          </div>

          {/* Urutkan Berdasarkan */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="highest_balance">Urutkan: Saldo Tertinggi</option>
              <option value="lowest_balance">Urutkan: Saldo Terendah</option>
              <option value="name_asc">Urutkan: Nama Toko (A - Z)</option>
              <option value="newest">Urutkan: Pendaftaran Terbaru</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Saldo Penjual */}
      <div className="rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-emerald-500 border-t-transparent mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Memuat daftar saldo akun penjual...
            </p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-4">
              <WalletIcon size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Tidak Ada Akun Penjual Ditemukan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Tidak ada akun penjual yang sesuai dengan parameter filter atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-4">Toko & Pemilik</th>
                  <th scope="col" className="px-4 py-4">Status Toko</th>
                  <th scope="col" className="px-4 py-4">Status Verifikasi</th>
                  <th scope="col" className="px-5 py-4 text-right">Saldo Toko Saat Ini</th>
                  <th scope="col" className="px-5 py-4 text-center">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {sellers.map((seller) => {
                  const isVerified = seller.verificationStatus === "verified";
                  const initialChar = seller.name.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={seller.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Toko & Pemilik */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar Toko dengan Lencana Merah Mall jika Terverifikasi */}
                          <div className="relative inline-flex items-center justify-center shrink-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                isVerified
                                  ? "ring-2 ring-red-500 shadow-xs"
                                  : "ring-1 ring-slate-200 dark:ring-white/10"
                              } bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}
                            >
                              {initialChar}
                            </div>
                            {isVerified && (
                              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-tight bg-red-600 text-white shadow-xs border border-white dark:border-[#0f172a] leading-tight select-none">
                                Mall
                              </span>
                            )}
                          </div>

                          {/* Data Toko */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                                {seller.name}
                              </span>
                              {isVerified && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                                  Mall Official
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                              @{seller.username} • {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Operasional Toko */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {seller.isStoreOpen ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Toko Buka
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Toko Tutup
                          </span>
                        )}
                      </td>

                      {/* Status Verifikasi Akun */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {seller.verificationStatus === "verified" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <BadgeCheckIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
                            Terverifikasi
                          </span>
                        ) : seller.verificationStatus === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <ClockIcon size={13} className="text-amber-600 dark:text-amber-400" />
                            Menunggu Review
                          </span>
                        ) : seller.verificationStatus === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                            Belum Mengajukan
                          </span>
                        )}
                      </td>

                      {/* Saldo Toko Saat Ini */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {formatRupiah(seller.storeBalance)}
                        </div>
                        {seller.storeBalance > 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Dana Tersedia
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Saldo Rp 0
                          </span>
                        )}
                      </td>

                      {/* Aksi: Tambah Saldo & Riwayat Mutasi */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenTopup(seller)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                            title={`Tambah saldo manual ke toko ${seller.name}`}
                          >
                            <PlusIcon size={14} />
                            <span>Tambah Saldo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenHistory(seller)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                            title={`Lihat riwayat mutasi saldo toko ${seller.name}`}
                          >
                            <ClockIcon size={14} />
                            <span>Riwayat</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Saldo Manual */}
      {topupTargetSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  <PlusIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tambah Saldo Akun Penjual
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kredit saldo manual oleh Administrator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTopupTargetSeller(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Form Top Up */}
            <form onSubmit={handleSubmitTopup} className="p-6 space-y-5">
              {/* Info Merchant Penerima */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative inline-flex items-center justify-center shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base ${
                        topupTargetSeller.verificationStatus === "verified"
                          ? "ring-2 ring-red-500 shadow-xs"
                          : "ring-1 ring-slate-200 dark:ring-white/10"
                      } bg-gradient-to-br from-indigo-500 to-purple-600 text-white`}
                    >
                      {topupTargetSeller.name.charAt(0).toUpperCase()}
                    </div>
                    {topupTargetSeller.verificationStatus === "verified" && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-tight bg-red-600 text-white shadow-xs border border-white dark:border-[#0f172a] leading-tight select-none">
                        Mall
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {topupTargetSeller.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      @{topupTargetSeller.username} • {topupTargetSeller.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-medium">Saldo Saat Ini</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {formatRupiah(topupTargetSeller.storeBalance)}
                  </div>
                </div>
              </div>

              {/* Pilihan Nominal Cepat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Nominal Cepat
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amt) => {
                    const isSelected = Number(topupAmount) === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopupAmount(String(amt))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10"
                        }`}
                      >
                        +{formatRupiah(amt)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Nominal Kustom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nominal Tambah Saldo (Rp)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    Rp
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Masukkan jumlah saldo..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Kalkulasi Perubahan Saldo */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Saldo Sebelum Ditambah:</span>
                  <span className="font-semibold">{formatRupiah(topupTargetSeller.storeBalance)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Jumlah Ditambahkan:</span>
                  <span className="font-bold">+{formatRupiah(Number(topupAmount) || 0)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Estimasi Saldo Baru:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatRupiah(calculatedNewBalance)}
                  </span>
                </div>
              </div>

              {/* Catatan / Keterangan Penambahan Saldo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan / Keterangan Tambah Saldo (Opsional)
                </label>
                <input
                  type="text"
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                  placeholder="Contoh: Bonus merchant bulanan / Penyesuaian saldo manual"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTopupTargetSeller(null)}
                  disabled={isSubmittingTopup}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopup || !Number(topupAmount) || Number(topupAmount) <= 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingTopup ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon size={16} />
                      <span>Konfirmasi Tambah Saldo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Riwayat Mutasi Saldo */}
      {historyTargetSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  <ClockIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Riwayat Mutasi Saldo Toko
                  </h3>
                  <p className="text-xs text-slate-400">
                    Log audit transaksi dana toko {historyTargetSeller.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTargetSeller(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Banner Saldo Toko */}
            <div className="p-4 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <StoreIcon size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {historyTargetSeller.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  (@{historyTargetSeller.username})
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Saldo Saat Ini:{" "}
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(historyTargetSeller.storeBalance)}
                </span>
              </div>
            </div>

            {/* List Mutasi */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {isLoadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="inline-flex h-8 w-8 animate-spin items-center justify-center rounded-full border-2 border-emerald-500 border-t-transparent mb-2" />
                  <p className="text-xs text-slate-400">Memuat log riwayat mutasi...</p>
                </div>
              ) : mutationsHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-2">
                    <ClockIcon size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Belum Ada Riwayat Mutasi Saldo
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Akun toko ini belum pernah menerima top up manual atau mutasi transaksi dana.
                  </p>
                </div>
              ) : (
                mutationsHistory.map((mut) => (
                  <div
                    key={mut.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {mut.type === "manual_credit" ? "Kredit Manual Admin" : mut.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(mut.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {mut.description || "Penambahan saldo manual oleh admin"}
                      </p>
                      <div className="text-[11px] text-slate-400">
                        Saldo: {formatRupiah(mut.balanceBefore)} &rarr;{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatRupiah(mut.balanceAfter)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        +{formatRupiah(mut.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryTargetSeller(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

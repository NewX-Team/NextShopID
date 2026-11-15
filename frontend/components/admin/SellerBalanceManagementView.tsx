"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  WalletIcon,
  CreditCardIcon,
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
  ArrowRightIcon,
  ShieldIcon,
  LockIcon,
} from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import {
  adminService,
  AdminSellerBalanceItem,
  AdminSellerBalanceStats,
  AdminBalanceMutationItem,
  AdminSellerWithdrawalItem,
  AdminWithdrawalStats,
} from "@/services/admin.service";

interface FeedbackState {
  type: "success" | "error";
  text: string;
}

interface SellerBalanceManagementViewProps {
  onPendingWdUpdate?: (count: number) => void;
}

const QUICK_AMOUNTS = [
  50000,
  100000,
  250000,
  500000,
  1000000,
  2500000,
];

// Template alasan penolakan cepat untuk admin
const REJECTION_TEMPLATES = [
  "Nama pemilik rekening dan nomor rekening tidak sesuai.",
  "Nomor rekening / akun e-wallet tidak ditemukan atau tidak aktif.",
  "Akun rekening tujuan diblokir oleh pihak bank penyedia.",
  "Data rekening/wallet tidak valid atau terindikasi aktivitas mencurigakan.",
  "Permintaan pencairan dibatalkan atas permintaan mitra penjual.",
];

export const SellerBalanceManagementView: React.FC<SellerBalanceManagementViewProps> = ({
  onPendingWdUpdate,
}) => {
  const { token } = useAuth();

  // Tab Utama: Persetujuan Penarikan (WD) atau Saldo Toko & Top-Up
  const [activeSection, setActiveSection] = useState<"withdrawals" | "balances">("withdrawals");

  // ==========================================
  // STATE PENARIKAN SALDO PENJUAL (WITHDRAWALS)
  // ==========================================
  const [withdrawals, setWithdrawals] = useState<AdminSellerWithdrawalItem[]>([]);
  const [wdStats, setWdStats] = useState<AdminWithdrawalStats>({
    totalCount: 0,
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    totalCompletedAmount: 0,
    totalPendingAmount: 0,
  });
  const [wdSearch, setWdSearch] = useState<string>("");
  const [wdStatusFilter, setWdStatusFilter] = useState<string>("all");
  const [wdSort, setWdSort] = useState<string>("newest");
  const [isLoadingWd, setIsLoadingWd] = useState<boolean>(true);
  const [isRefreshingWd, setIsRefreshingWd] = useState<boolean>(false);

  // State Modal ACC / Setujui Penarikan
  const [accTargetWd, setAccTargetWd] = useState<AdminSellerWithdrawalItem | null>(null);
  const [accAdminNotes, setAccAdminNotes] = useState<string>(
    "Transaksi telah berhasil diproses dan ditransfer. Silakan periksa mutasi rekening/dompet digital Anda."
  );
  const [isSubmittingAcc, setIsSubmittingAcc] = useState<boolean>(false);

  // State Modal Tolak Penarikan
  const [rejectTargetWd, setRejectTargetWd] = useState<AdminSellerWithdrawalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);

  // State Modal Detail Penarikan
  const [detailTargetWd, setDetailTargetWd] = useState<AdminSellerWithdrawalItem | null>(null);

  // ==========================================
  // STATE SALDO TOKO & TOP-UP PENJUAL
  // ==========================================
  const [sellers, setSellers] = useState<AdminSellerBalanceItem[]>([]);
  const [stats, setStats] = useState<AdminSellerBalanceStats>({
    totalSellers: 0,
    totalStoreBalance: 0,
    averageStoreBalance: 0,
    activeBalanceCount: 0,
    zeroBalanceCount: 0,
    openStoreCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [storeStatusFilter, setStoreStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("highest_balance");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Feedback State
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

  // State Modal Freeze / Unfreeze Saldo Penjual
  const [freezeTargetSeller, setFreezeTargetSeller] = useState<AdminSellerBalanceItem | null>(null);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState<boolean>(false);
  const [freezeAction, setFreezeAction] = useState<"freeze" | "unfreeze">("freeze");
  const [freezeReason, setFreezeReason] = useState<string>("");
  const [isSubmittingFreeze, setIsSubmittingFreeze] = useState<boolean>(false);

  // Preset alasan pembekuan saldo toko
  const PRESET_FREEZE_REASONS = [
    "Terjadi kecurangan transaksi / manipulasi saldo",
    "Tindakan ilegal dan sengketa kepemilikan akun",
    "Laporan penipuan pesanan pembeli dalam proses investigasi",
    "Permintaan investigasi resmi dari aparat berwenang",
  ];

  // Format mata uang Rupiah
  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format tanggal Indonesia
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "-";
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

  // Format nomor rekening
  const formatCardNumber = (num?: string): string => {
    if (!num) return "-";
    return num.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // 1. Fetch Data Pengajuan Penarikan Saldo (WD)
  const fetchWithdrawals = useCallback(
    async (isBackground = false) => {
      if (!token) return;
      if (!isBackground) setIsLoadingWd(true);
      else setIsRefreshingWd(true);

      try {
        const res = await adminService.getSellerWithdrawals(token, {
          search: wdSearch,
          status: wdStatusFilter,
          sort: wdSort,
        });

        if (res.success) {
          setWithdrawals(res.data);
          setWdStats(res.stats);
          if (onPendingWdUpdate) {
            onPendingWdUpdate(res.stats.pendingCount);
          }
        } else {
          setFeedback({
            type: "error",
            text: res.message || "Gagal memuat data penarikan saldo.",
          });
        }
      } catch (err) {
        console.error("[SellerBalanceManagementView] Fetch WD error:", err);
        setFeedback({
          type: "error",
          text: "Terjadi gangguan saat menghubungi server untuk data penarikan.",
        });
      } finally {
        setIsLoadingWd(false);
        setIsRefreshingWd(false);
      }
    },
    [token, wdSearch, wdStatusFilter, wdSort, onPendingWdUpdate]
  );

  // 2. Fetch Data Saldo Seluruh Penjual
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
        console.error("[SellerBalanceManagementView] Fetch Balances error:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, searchQuery, balanceFilter, storeStatusFilter, sortBy]
  );

  // Muat data saat token / filter berubah
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Polling realtime setiap 15 detik agar data selalu sinkron
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchWithdrawals(true);
      fetchBalances(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [token, fetchWithdrawals, fetchBalances]);

  // ==========================================
  // HANDLER ACC & TOLAK PENARIKAN SALDO (WD)
  // ==========================================

  // Buka Modal ACC
  const handleOpenAcc = (wd: AdminSellerWithdrawalItem) => {
    setAccTargetWd(wd);
    setAccAdminNotes(
      "Transaksi telah berhasil diproses dan ditransfer. Silakan periksa mutasi rekening/dompet digital Anda."
    );
    setFeedback(null);
  };

  // Submit ACC Penarikan
  const handleSubmitAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !accTargetWd) return;

    setIsSubmittingAcc(true);
    setFeedback(null);

    try {
      const res = await adminService.updateWithdrawalDecision(token, accTargetWd.id, {
        decision: "approve",
        adminNotes: accAdminNotes.trim() || undefined,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Transaksi penarikan saldo berhasil disetujui (ACC).",
        });
        setAccTargetWd(null);
        fetchWithdrawals(true);
        fetchBalances(true);
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal menyetujui transaksi penarikan.",
        });
      }
    } catch (err) {
      console.error("[handleSubmitAcc] Error:", err);
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan saat memproses persetujuan penarikan.",
      });
    } finally {
      setIsSubmittingAcc(false);
    }
  };

  // Buka Modal Tolak Penarikan
  const handleOpenReject = (wd: AdminSellerWithdrawalItem) => {
    setRejectTargetWd(wd);
    setRejectionReason("");
    setFeedback(null);
  };

  // Submit Tolak Penarikan
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectTargetWd) return;

    const cleanReason = rejectionReason.trim();
    if (!cleanReason || cleanReason.length < 3) {
      setFeedback({
        type: "error",
        text: "Alasan penolakan penarikan wajib diisi minimal 3 karakter.",
      });
      return;
    }

    setIsSubmittingReject(true);
    setFeedback(null);

    try {
      const res = await adminService.updateWithdrawalDecision(token, rejectTargetWd.id, {
        decision: "reject",
        rejectionReason: cleanReason,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text:
            res.message ||
            `Transaksi penarikan berhasil ditolak. Saldo sebesar ${formatRupiah(
              rejectTargetWd.amount
            )} telah dikembalikan ke toko penjual.`,
        });
        setRejectTargetWd(null);
        fetchWithdrawals(true);
        fetchBalances(true);
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal menolak transaksi penarikan.",
        });
      }
    } catch (err) {
      console.error("[handleSubmitReject] Error:", err);
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan saat memproses penolakan penarikan.",
      });
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // ==========================================
  // HANDLER TOP-UP SALDO MANUAL
  // ==========================================
  const handleOpenTopup = (seller: AdminSellerBalanceItem) => {
    setTopupTargetSeller(seller);
    setTopupAmount("100000");
    setTopupNote("");
    setFeedback(null);
  };

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
          text:
            res.message ||
            `Berhasil menambahkan ${formatRupiah(parsed)} ke toko ${topupTargetSeller.name}.`,
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

  // ==========================================
  // HANDLER FREEZE / UNFREEZE SALDO PENJUAL
  // ==========================================
  const handleOpenFreezeModal = (
    seller: AdminSellerBalanceItem,
    action: "freeze" | "unfreeze"
  ) => {
    setFreezeTargetSeller(seller);
    setFreezeAction(action);
    setFreezeReason(
      action === "freeze"
        ? seller.balanceFreezeReason || "Terjadi kecurangan transaksi / manipulasi saldo"
        : ""
    );
    setFeedback(null);
    setIsFreezeModalOpen(true);
  };

  const handleSubmitFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !freezeTargetSeller) return;

    if (freezeAction === "freeze" && !freezeReason.trim()) {
      setFeedback({
        type: "error",
        text: "Alasan pembekuan saldo wajib diisi (misal: terjadi kecurangan transaksi, tindakan ilegal, sengketa, dll).",
      });
      return;
    }

    setIsSubmittingFreeze(true);
    setFeedback(null);

    try {
      const res = await adminService.toggleSellerBalanceFreeze(
        token,
        freezeTargetSeller.id,
        {
          action: freezeAction,
          reason: freezeReason.trim(),
        }
      );

      if (res.success && res.seller) {
        setFeedback({
          type: "success",
          text:
            res.message ||
            (freezeAction === "freeze"
              ? `Saldo toko ${freezeTargetSeller.name} berhasil dibekukan.`
              : `Pembekuan saldo toko ${freezeTargetSeller.name} berhasil dibuka kembali.`),
        });

        // Update state lokal
        setSellers((prev) =>
          prev.map((s) =>
            s.id === res.seller!.id
              ? {
                  ...s,
                  isBalanceFrozen: res.seller!.isBalanceFrozen,
                  balanceFreezeReason: res.seller!.balanceFreezeReason,
                  balanceFrozenAt: res.seller!.balanceFrozenAt,
                }
              : s
          )
        );

        fetchBalances(true);

        setIsFreezeModalOpen(false);
        setFreezeTargetSeller(null);
        setFreezeReason("");
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal memperbarui status pembekuan saldo.",
        });
      }
    } catch (err) {
      console.error("[handleSubmitFreeze] Error:", err);
      setFeedback({
        type: "error",
        text: "Terjadi gangguan saat memproses status pembekuan saldo.",
      });
    } finally {
      setIsSubmittingFreeze(false);
    }
  };

  const calculatedNewBalance =
    topupTargetSeller && !isNaN(Number(topupAmount)) && Number(topupAmount) > 0
      ? topupTargetSeller.storeBalance + Number(topupAmount)
      : topupTargetSeller?.storeBalance || 0;

  return (
    <div className="space-y-6">
      {/* Toast Feedback Banner */}
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
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* Top Header Halaman Finansial Saldo & WD Penjual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <WalletIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Finansial & Saldo Penjual
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Otorisasi persetujuan penarikan dana (WD), pemantauan saldo merchant, dan top-up manual saldo toko.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchWithdrawals(true);
              fetchBalances(true);
            }}
            disabled={isRefreshing || isRefreshingWd}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshIcon size={15} className={isRefreshing || isRefreshingWd ? "animate-spin text-emerald-500" : ""} />
            <span>Segarkan Realtime</span>
          </button>
        </div>
      </div>

      {/* SEGMENTED TAB SWITCHER: PERSETUJUAN PENARIKAN (WD) vs DAFTAR SALDO & TOP-UP */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-[#0c1220] p-1.5 border border-slate-200/80 dark:border-white/10 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSection("withdrawals")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === "withdrawals"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <CreditCardIcon size={16} />
          <span>Persetujuan Penarikan Saldo (WD)</span>
          {wdStats.pendingCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSection === "withdrawals"
                  ? "bg-amber-400 text-slate-950 animate-pulse"
                  : "bg-amber-500 text-white"
              }`}
            >
              {wdStats.pendingCount} Menunggu ACC
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("balances")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === "balances"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <WalletIcon size={16} />
          <span>Saldo Toko & Top-Up Penjual</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSection === "balances"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
            }`}
          >
            {stats.totalSellers} Toko
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PERSETUJUAN PENARIKAN SALDO PENJUAL (ACC / TOLAK DENGAN ALASAN) */}
      {/* ========================================================================= */}
      {activeSection === "withdrawals" && (
        <div className="space-y-6">
          {/* 4 Kartu Metrik Transaksi Penarikan Realtime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Menunggu Persetujuan */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-amber-300/80 dark:border-amber-800/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Menunggu Persetujuan
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <ClockIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {wdStats.pendingCount} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nominal: <strong>{formatRupiah(wdStats.totalPendingAmount)}</strong>
                </p>
              </div>
            </div>

            {/* 2. Berhasil Dicairkan */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Berhasil Dicairkan (ACC)
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircleIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {wdStats.completedCount} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total Disalurkan: <strong>{formatRupiah(wdStats.totalCompletedAmount)}</strong>
                </p>
              </div>
            </div>

            {/* 3. Ditolak Admin */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Ditolak Admin
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <AlertCircleIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {wdStats.rejectedCount} <span className="text-xs font-semibold text-slate-400">Transaksi</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saldo otomatis dikembalikan ke toko
                </p>
              </div>
            </div>

            {/* 4. Total Keseluruhan Pengajuan */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Transaksi
                </span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <TrendingUpIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {wdStats.totalCount} <span className="text-xs font-semibold text-slate-400">Pengajuan</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Semua transaksi penarikan dana
                </p>
              </div>
            </div>
          </div>

          {/* Filter & Pencarian Toolbar Penarikan */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Input Pencarian */}
            <div className="relative w-full md:w-96">
              <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={wdSearch}
                onChange={(e) => setWdSearch(e.target.value)}
                placeholder="Cari toko, rekening, pemilik, atau bank..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Opsi Filter Status & Sort */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <FilterIcon size={14} className="text-slate-400" />
                <select
                  value={wdStatusFilter}
                  onChange={(e) => setWdStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">⏳ Menunggu ACC ({wdStats.pendingCount})</option>
                  <option value="completed">✓ Berhasil ({wdStats.completedCount})</option>
                  <option value="rejected">✕ Ditolak ({wdStats.rejectedCount})</option>
                </select>
              </div>

              <select
                value={wdSort}
                onChange={(e) => setWdSort(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">Waktu: Paling Baru</option>
                <option value="oldest">Waktu: Paling Lama</option>
                <option value="highest_amount">Nominal: Terbesar</option>
                <option value="lowest_amount">Nominal: Terkecil</option>
              </select>
            </div>
          </div>

          {/* TABEL PERSETUJUAN TRANSAKSI PENARIKAN (ACC / TOLAK) */}
          <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
            {isLoadingWd ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Memuat data pengajuan penarikan dana...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-3">
                  <CreditCardIcon size={26} />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Pengajuan Penarikan Ditemukan
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Belum ada transaksi penarikan saldo toko yang sesuai dengan kriteria filter saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-3.5">Waktu Pengajuan</th>
                      <th scope="col" className="px-4 py-3.5">Mitra Penjual</th>
                      <th scope="col" className="px-4 py-3.5">Rekening / E-Wallet Tujuan</th>
                      <th scope="col" className="px-4 py-3.5 text-right">Nominal Saldo</th>
                      <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                      <th scope="col" className="px-4 py-3.5">Keterangan / Alasan</th>
                      <th scope="col" className="px-4 py-3.5 text-center">Aksi Keputusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                    {withdrawals.map((w) => {
                      const isPending = w.status === "pending";
                      const isCompleted = w.status === "completed";
                      const isRejected = w.status === "rejected";

                      return (
                        <tr
                          key={w.id}
                          className={`hover:bg-slate-50/60 dark:hover:bg-white/[0.01] transition-colors ${
                            isPending ? "bg-amber-500/[0.03]" : ""
                          }`}
                        >
                          {/* Waktu Pengajuan */}
                          <td className="px-4 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {formatDateTime(w.createdAt)}
                          </td>

                          {/* Toko Penjual */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative shrink-0">
                                <div
                                  className={`h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-xs ${
                                    w.sellerVerificationStatus === "verified"
                                      ? "ring-2 ring-red-500 ring-offset-1 dark:ring-offset-[#0c1220]"
                                      : ""
                                  }`}
                                >
                                  {w.sellerName ? w.sellerName[0]?.toUpperCase() : "P"}
                                </div>
                                {w.sellerVerificationStatus === "verified" && (
                                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded-xs bg-red-600 text-white text-[7px] font-black uppercase tracking-tight leading-none pointer-events-none select-none z-10">
                                    Mall
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{w.sellerName}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  @{w.sellerUsername} • Sisa Saldo:{" "}
                                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatRupiah(w.sellerStoreBalance)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Rekening Tujuan */}
                          <td className="px-4 py-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 uppercase">
                                  {w.accountType === "bank" ? "Bank" : "Wallet"}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {w.providerName}
                                </span>
                              </div>
                              <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                {formatCardNumber(w.accountNumber)}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                a.n {w.accountHolderName}
                              </div>
                            </div>
                          </td>

                          {/* Nominal Penarikan */}
                          <td className="px-4 py-4 text-right">
                            <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                              {formatRupiah(w.amount)}
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Biaya: Gratis
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                <ClockIcon size={11} /> Menunggu ACC
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckIcon size={11} /> Berhasil (ACC)
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertCircleIcon size={11} /> Ditolak
                              </span>
                            )}
                          </td>

                          {/* Keterangan / Alasan Penolakan */}
                          <td className="px-4 py-4 max-w-[240px]">
                            {isCompleted && (
                              <div className="space-y-0.5">
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium truncate" title={w.adminNotes || ""}>
                                  {w.adminNotes || "Transaksi telah berhasil ditransfer."}
                                </p>
                                {w.reviewerName && (
                                  <span className="text-[10px] text-slate-400">
                                    Disetujui oleh: {w.reviewerName}
                                  </span>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <div className="space-y-0.5">
                                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold truncate" title={w.rejectionReason || ""}>
                                  {w.rejectionReason || "Penolakan oleh admin"}
                                </p>
                                <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ✓ Saldo dikembalikan ke toko
                                </span>
                              </div>
                            )}
                            {isPending && (
                              <span className="text-[11px] text-slate-400 italic truncate block">
                                {w.notes ? `Catatan toko: ${w.notes}` : "Belum ada catatan"}
                              </span>
                            )}
                          </td>

                          {/* Tombol Aksi Keputusan */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAcc(w)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                  title="Setujui transaksi penarikan (ACC)"
                                >
                                  <CheckIcon size={13} />
                                  <span>ACC</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(w)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                  title="Tolak transaksi penarikan dan kembalikan saldo"
                                >
                                  <CloseIcon size={13} />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDetailTargetWd(w)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                <span>Detail</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DAFTAR SALDO TOKO & TOP-UP MANUAL (FITUR SEBELUMNYA TETAP UTUH) */}
      {/* ========================================================================= */}
      {activeSection === "balances" && (
        <div className="space-y-6">
          {/* Kartu Metrik Saldo Toko */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Saldo Seluruh Toko
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <DollarSignIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(stats.totalStoreBalance)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Akumulasi saldo live seluruh mitra penjual
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Rata-rata Saldo Toko
                </span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <TrendingUpIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {formatRupiah(stats.averageStoreBalance)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Estimasi rata-rata saldo per merchant
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Toko Memiliki Saldo Aktif
                </span>
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                  <CheckCircleIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats.activeBalanceCount} <span className="text-xs font-semibold text-slate-400">Toko</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {stats.zeroBalanceCount} toko dengan saldo Rp 0
                </p>
              </div>
            </div>

            {/* Metrik Saldo Dibekukan */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">
                  Saldo Dibekukan
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <LockIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                  {stats.frozenSellersCount || 0} <span className="text-xs font-semibold text-slate-400">Toko</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Total: {formatRupiah(stats.totalFrozenBalance || 0)}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Mitra Penjual
                </span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  <UsersIcon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {stats.totalSellers} <span className="text-xs font-semibold text-slate-400">Mitra</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Terdaftar di sistem NextShopID
                </p>
              </div>
            </div>
          </div>

          {/* Filter & Toolbar Saldo Toko */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama toko, @username, atau email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Kondisi Saldo</option>
                <option value="has_balance">Hanya Saldo &gt; 0</option>
                <option value="zero_balance">Saldo Rp 0</option>
                <option value="frozen">Saldo Dibekukan ({stats.frozenSellersCount || 0})</option>
              </select>

              <select
                value={storeStatusFilter}
                onChange={(e) => setStoreStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Status Toko</option>
                <option value="open">Toko Buka</option>
                <option value="closed">Toko Libur</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="highest_balance">Saldo Tertinggi</option>
                <option value="lowest_balance">Saldo Terendah</option>
                <option value="name_asc">Nama Toko (A-Z)</option>
                <option value="newest">Mitra Terdaftar Baru</option>
              </select>
            </div>
          </div>

          {/* Tabel Daftar Saldo Toko Penjual */}
          <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Memuat data saldo toko...</p>
              </div>
            ) : sellers.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-3">
                  <WalletIcon size={26} />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Mitra Penjual Ditemukan
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Belum ada data toko penjual yang cocok dengan kriteria pencarian Anda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-3.5">Identitas Toko</th>
                      <th scope="col" className="px-4 py-3.5">Status Toko</th>
                      <th scope="col" className="px-4 py-3.5">Status Saldo</th>
                      <th scope="col" className="px-4 py-3.5 text-right">Saldo Toko</th>
                      <th scope="col" className="px-4 py-3.5 text-center">Aksi Administrator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                    {sellers.map((seller) => (
                      <tr key={seller.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <div
                                className={`h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                                  seller.verificationStatus === "verified"
                                    ? "ring-2 ring-red-500 ring-offset-1 dark:ring-offset-[#0c1220]"
                                    : ""
                                }`}
                              >
                                {seller.name ? seller.name[0]?.toUpperCase() : "P"}
                              </div>
                              {seller.verificationStatus === "verified" && (
                                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded-xs bg-red-600 text-white text-[7px] font-black uppercase tracking-tight leading-none pointer-events-none select-none z-10">
                                  Mall
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{seller.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                @{seller.username} • {seller.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              seller.isStoreOpen
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                seller.isStoreOpen ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {seller.isStoreOpen ? "Toko Buka" : "Toko Libur"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {seller.isBalanceFrozen ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                <LockIcon size={10} />
                                <span>Dibekukan</span>
                              </span>
                              {seller.balanceFreezeReason && (
                                <p
                                  className="text-[10px] text-rose-500 dark:text-rose-400 font-medium truncate max-w-[150px]"
                                  title={seller.balanceFreezeReason}
                                >
                                  {seller.balanceFreezeReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircleIcon size={10} />
                              <span>Normal</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div
                            className={`font-mono font-black text-sm ${
                              seller.isBalanceFrozen
                                ? "text-rose-600 dark:text-rose-400 line-through"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatRupiah(seller.storeBalance)}
                          </div>
                          {seller.isBalanceFrozen && (
                            <span className="text-[10px] text-rose-500 font-semibold">Terkunci</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Tombol Bekukan / Buka Pembekuan Saldo */}
                            {seller.isBalanceFrozen ? (
                              <button
                                type="button"
                                onClick={() => handleOpenFreezeModal(seller, "unfreeze")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer"
                                title="Buka pembekuan saldo toko"
                              >
                                <LockIcon size={12} className="text-rose-500" />
                                <span>Buka Pembekuan</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenFreezeModal(seller, "freeze")}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer"
                                title="Bekukan saldo toko jika terjadi kecurangan atau sengketa"
                              >
                                <LockIcon size={12} />
                                <span>Bekukan Saldo</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenTopup(seller)}
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 active:scale-[0.98] text-white font-semibold text-xs shadow-xs hover:shadow-sm hover:shadow-emerald-500/20 border border-emerald-400/25 transition-all cursor-pointer"
                            >
                              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-white/20 text-white group-hover:scale-110 transition-transform">
                                <PlusIcon size={10} className="stroke-[2.5]" />
                              </span>
                              <span>Tambah Saldo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenHistory(seller)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              <ClockIcon size={13} />
                              <span>Riwayat</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ACC / SETUJUI PENARIKAN SALDO PENJUAL */}
      {/* ========================================================================= */}
      {accTargetWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Setujui Penarikan Saldo (ACC)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfirmasi transfer dana ke rekening tujuan penjual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccTargetWd(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Ringkasan Transaksi yang Akan di-ACC */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mitra Penjual:</span>
                <strong className="text-slate-900 dark:text-white">
                  {accTargetWd.sellerName} (@{accTargetWd.sellerUsername})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bank / Provider:</span>
                <strong className="text-slate-900 dark:text-white">
                  {accTargetWd.providerName}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nomor Rekening / Wallet:</span>
                <strong className="font-mono text-slate-900 dark:text-white">
                  {accTargetWd.accountNumber}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Atas Nama Pemilik:</span>
                <strong className="text-slate-900 dark:text-white">
                  {accTargetWd.accountHolderName}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Nominal Transfer:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                  {formatRupiah(accTargetWd.amount)}
                </span>
              </div>
            </div>

            {/* Form Input Catatan / Info Berhasil untuk Penjual */}
            <form onSubmit={handleSubmitAcc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pesan Notifikasi untuk Penjual (Akan tampil di akun toko)
                </label>
                <textarea
                  rows={3}
                  value={accAdminNotes}
                  onChange={(e) => setAccAdminNotes(e.target.value)}
                  placeholder="Masukkan kalimat konfirmasi keberhasilan transaksi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Info ini akan langsung dibaca penjual bahwa transaksi telah berhasil dan mereka dipersilakan memeriksa mutasi rekeningnya.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAccTargetWd(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAcc}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAcc ? "Memproses ACC..." : "✓ Konfirmasi & Setujui (ACC)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TOLAK PENARIKAN SALDO DENGAN ALASAN & REFUND SALDO REALTIME */}
      {/* ========================================================================= */}
      {rejectTargetWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <CloseIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tolak Pengajuan Penarikan Saldo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sertakan alasan penolakan jelas dan kembalikan saldo ke toko
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectTargetWd(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Banner Informasi Pengembalian Dana (Refund Saldo) */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircleIcon size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="leading-relaxed">
                <strong>Pengembalian Dana Otomatis:</strong> Dana sebesar{" "}
                <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                  {formatRupiah(rejectTargetWd.amount)}
                </span>{" "}
                akan secara otomatis dikembalikan ke saldo toko <strong>{rejectTargetWd.sellerName}</strong> secara realtime.
              </div>
            </div>

            {/* Form Penolakan */}
            <form onSubmit={handleSubmitReject} className="space-y-4">
              {/* Template Pilihan Alasan Cepat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Alasan Cepat (Template):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REJECTION_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectionReason(tpl)}
                      className={`text-left px-2.5 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                        rejectionReason === tpl
                          ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold"
                          : "border-slate-200 dark:border-white/10 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Alasan Penolakan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alasan Penolakan Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Misal: Nama pemilik rekening dan nomor rekening tidak sesuai, rekening tujuan tidak ditemukan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alasan ini akan dikirimkan dan dibaca langsung oleh penjual pada riwayat penarikan mereka.
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTargetWd(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReject || !rejectionReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReject ? "Memproses Penolakan..." : "✕ Tolak & Kembalikan Saldo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DETAIL TRANSAKSI PENARIKAN (VIEW DETAIL) */}
      {/* ========================================================================= */}
      {detailTargetWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rincian Transaksi Penarikan #{detailTargetWd.id}
              </h3>
              <button
                type="button"
                onClick={() => setDetailTargetWd(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mitra Penjual:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {detailTargetWd.sellerName} (@{detailTargetWd.sellerUsername})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rekening Tujuan:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {detailTargetWd.providerName} - {detailTargetWd.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pemilik:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {detailTargetWd.accountHolderName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nominal Ditarik:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupiah(detailTargetWd.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Transaksi:</span>
                  <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {detailTargetWd.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Pengajuan:</span>
                  <span>{formatDateTime(detailTargetWd.createdAt)}</span>
                </div>
                {detailTargetWd.reviewedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Waktu Keputusan Admin:</span>
                    <span>{formatDateTime(detailTargetWd.reviewedAt)}</span>
                  </div>
                )}
              </div>

              {detailTargetWd.adminNotes && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                    Pesan Konfirmasi Admin:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {detailTargetWd.adminNotes}
                  </p>
                </div>
              )}

              {detailTargetWd.rejectionReason && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <span className="font-bold text-rose-700 dark:text-rose-300 block mb-1">
                    Alasan Penolakan:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {detailTargetWd.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailTargetWd(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TOP-UP MANUAL SALDO TOKO */}
      {/* ========================================================================= */}
      {topupTargetSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PlusIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tambah Saldo Toko Mitra
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kredit saldo manual langsung masuk ke dompet merchant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTopupTargetSeller(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Toko Target:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {topupTargetSeller.name}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  @{topupTargetSeller.username}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Saldo Saat Ini:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatRupiah(topupTargetSeller.storeBalance)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitTopup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nominal Saldo Ditambahkan
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={topupAmount ? Number(topupAmount).toLocaleString("id-ID") : ""}
                    onChange={(e) => setTopupAmount(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(String(amt))}
                      className="py-1 px-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50/50 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                    >
                      +{amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000} Rb`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan / Alasan Top-Up (Opsional)
                </label>
                <input
                  type="text"
                  value={topupNote}
                  onChange={(e) => setTopupNote(e.target.value)}
                  placeholder="Contoh: Reward performa toko, bonus merchant, atau penyesuaian saldo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">Estimasi Saldo Setelah Ditambah:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatRupiah(calculatedNewBalance)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopupTargetSeller(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTopup || !topupAmount || Number(topupAmount) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTopup ? "Menambahkan..." : "Konfirmasi & Tambah Saldo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RIWAYAT MUTASI SALDO TOKO */}
      {/* ========================================================================= */}
      {historyTargetSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Riwayat Mutasi Saldo: {historyTargetSeller.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Audit trail mutasi kredit/debit akun toko @{historyTargetSeller.username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTargetSeller(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Mengambil riwayat mutasi...</p>
              </div>
            ) : mutationsHistory.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Belum ada mutasi saldo tercatat untuk toko ini.
              </div>
            ) : (
              <div className="space-y-2">
                {mutationsHistory.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {m.description}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDateTime(m.createdAt)} • Sebelum: {formatRupiah(m.balanceBefore)} → Sesudah: {formatRupiah(m.balanceAfter)}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold text-sm ${
                        m.type === "topup" || m.type === "refund"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {m.type === "topup" || m.type === "refund" ? `+${formatRupiah(m.amount)}` : `-${formatRupiah(m.amount)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryTargetSeller(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: BEKUKAN / BUKA PEMBEKUAN SALDO PENJUAL */}
      {/* ========================================================================= */}
      {isFreezeModalOpen && freezeTargetSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    freezeAction === "freeze"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  <LockIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {freezeAction === "freeze"
                      ? "Bekukan Saldo Toko Penjual"
                      : "Buka Pembekuan Saldo Toko"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {freezeTargetSeller.name} (@{freezeTargetSeller.username}) • Saldo:{" "}
                    <strong className="text-slate-700 dark:text-slate-200 font-mono">
                      {formatRupiah(freezeTargetSeller.storeBalance)}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFreezeModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Form Pembekuan Saldo */}
            <form onSubmit={handleSubmitFreeze} className="space-y-4">
              {freezeAction === "freeze" ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircleIcon size={15} className="shrink-0 text-rose-500" />
                      <span>Peringatan Keamanan Platform</span>
                    </p>
                    <p className="leading-relaxed">
                      Saldo toko akan <strong>dibekukan seketika</strong>. Penjual <strong>TIDAK DAPAT</strong> melakukan penarikan saldo (WD) hingga status saldo dipulihkan kembali oleh administrator.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alasan Pembekuan Saldo <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Pilih template alasan cepat atau ketik secara terperinci alasan pembekuan saldo toko:
                    </p>

                    {/* Preset Template Alasan */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {PRESET_FREEZE_REASONS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFreezeReason(preset)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer text-left"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      required
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      placeholder="Ketik alasan pembekuan saldo secara spesifik di sini..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircleIcon size={15} className="shrink-0 text-emerald-500" />
                      <span>Pemulihan Hak Penarikan Saldo</span>
                    </p>
                    <p className="leading-relaxed">
                      Dengan membuka pembekuan, status saldo akan kembali normal dan penjual dapat kembali mengajukan penarikan dana ke rekening atau dompet digital mereka.
                    </p>
                  </div>

                  {freezeTargetSeller.balanceFreezeReason && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs">
                      <span className="text-slate-400 font-bold block mb-0.5">
                        Alasan Pembekuan Sebelumnya:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                        &quot;{freezeTargetSeller.balanceFreezeReason}&quot;
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Catatan Audit Pemulihan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      placeholder="Contoh: Investigasi sengketa selesai, saldo dinyatakan aman untuk dicairkan."
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsFreezeModalOpen(false)}
                  disabled={isSubmittingFreeze}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingFreeze || (freezeAction === "freeze" && !freezeReason.trim())}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    freezeAction === "freeze"
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-950/20"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20"
                  }`}
                >
                  {isSubmittingFreeze ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <LockIcon size={13} />
                      <span>
                        {freezeAction === "freeze"
                          ? "Konfirmasi & Bekukan Saldo"
                          : "Konfirmasi Buka Pembekuan"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

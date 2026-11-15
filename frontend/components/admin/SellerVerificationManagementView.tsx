"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminService,
  AdminSellerVerificationItem,
  AdminVerificationStats,
  VerificationDecision,
} from "@/services/admin.service";
import {
  SearchIcon,
  RefreshIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ShieldIcon,
  BadgeCheckIcon,
  UserCheckIcon,
  FileTextIcon,
  EyeIcon,
  StoreIcon,
  CloseIcon,
  CheckIcon,
  AlertCircleIcon,
  LockIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from "@/components/ui/icons";

interface SellerVerificationManagementViewProps {
  onStatsUpdate?: (stats: AdminVerificationStats) => void;
}

export const SellerVerificationManagementView: React.FC<
  SellerVerificationManagementViewProps
> = ({ onStatsUpdate }) => {
  const { token } = useAuth();

  // State data dan status loading
  const [sellers, setSellers] = useState<AdminSellerVerificationItem[]>([]);
  const [stats, setStats] = useState<AdminVerificationStats>({
    totalPenjual: 0,
    pendingCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
    suspendedCount: 0,
    unverifiedCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // State Modal Detail & Keputusan
  const [selectedSeller, setSelectedSeller] =
    useState<AdminSellerVerificationItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [decisionType, setDecisionType] = useState<VerificationDecision>("approve");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(24);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // State Modal Preview Foto Dokumen
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // State reveal NIK
  const [revealedNiks, setRevealedNiks] = useState<Record<number, boolean>>({});

  // Preset alasan penolakan berkas
  const PRESET_REJECTION_REASONS = [
    "Foto KTP buram / tidak terbaca dengan jelas",
    "Data NIK tidak cocok dengan nama lengkap pada kartu identitas",
    "Foto selfie memegang KTP tidak sesuai panduan (wajah / kartu terpotong)",
    "Dokumen identitas telah kedaluwarsa atau rusak",
    "Profil usaha dan deskripsi toko belum memenuhi standar kepatuhan platform",
  ];

  // Preset alasan pencabutan / penghentian fungsi Mall
  const PRESET_REVOKE_REASONS = [
    "kontrak telah berakhir silahkan perpanjang kontrak",
    "toko melanggar pedoman komunitas dan standar kemitraan Mall",
    "Sengketa kepemilikan merek / hak cipta barang belum terselesaikan",
    "Penurunan kualitas layanan dan laporan komplain pembeli melebihi ambang batas",
  ];

  // Preset alasan penangguhan / suspend sementara
  const PRESET_SUSPEND_REASONS = [
    "kena laporan dan di suspend sementara",
    "Terjadi sengketa transaksi pesanan pembeli dalam proses investigasi admin",
    "Pelanggaran pedoman produk atau penipuan informasi etalase toko",
    "Indikasi manipulasi ulasan atau pesanan fiktif toko",
  ];

  // Pilihan cepat durasi suspend dalam satuan jam
  const QUICK_SUSPENSION_DURATIONS = [
    { hours: 1, label: "1 Jam (Min)" },
    { hours: 6, label: "6 Jam" },
    { hours: 12, label: "12 Jam" },
    { hours: 24, label: "24 Jam (1 Hari)" },
    { hours: 48, label: "48 Jam (2 Hari)" },
    { hours: 72, label: "72 Jam (3 Hari)" },
    { hours: 168, label: "168 Jam (7 Hari)" },
  ];

  // Ambil data verifikasi dari API admin
  const fetchVerifications = useCallback(
    async (isBackground = false) => {
      if (!token) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await adminService.getVerifications(token, {
          search: searchQuery,
          status: statusFilter,
          sort: sortBy,
        });

        if (res.success) {
          setSellers(res.data);
          setStats(res.stats);
          if (onStatsUpdate) {
            onStatsUpdate(res.stats);
          }
        } else {
          setFeedbackMessage({
            type: "error",
            text: res.message || "Gagal memuat data verifikasi.",
          });
        }
      } catch (err) {
        console.error("[SellerVerificationManagementView] Error:", err);
        setFeedbackMessage({
          type: "error",
          text: "Terjadi kesalahan saat menghubungi server.",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, searchQuery, statusFilter, sortBy, onStatsUpdate]
  );

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Handler Submit Keputusan
  const handleSubmitDecision = async () => {
    if (!token || !selectedSeller) return;

    if (decisionType === "reject" && !rejectionReason.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Wajib menyertakan alasan penolakan agar penjual dapat memperbaiki pengajuannya.",
      });
      return;
    }

    if (decisionType === "revoke" && !rejectionReason.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Wajib menyertakan alasan penghentian/pencabutan status Mall (misal: kontrak telah berakhir, pelanggaran pedoman, dll).",
      });
      return;
    }

    if (decisionType === "suspend") {
      if (!rejectionReason.trim()) {
        setFeedbackMessage({
          type: "error",
          text: "Wajib menyertakan alasan suspend sementara toko Mall.",
        });
        return;
      }
      if (!durationHours || durationHours < 1) {
        setFeedbackMessage({
          type: "error",
          text: "Durasi penalti suspend wajib diisi minimal 1 jam (angka bulat).",
        });
        return;
      }
    }

    setIsSubmittingDecision(true);
    setFeedbackMessage(null);

    try {
      const res = await adminService.updateVerificationDecision(
        token,
        selectedSeller.id,
        {
          decision: decisionType,
          reason: rejectionReason.trim(),
          durationHours:
            decisionType === "suspend"
              ? Math.max(1, Math.round(durationHours))
              : undefined,
        }
      );

      if (res.success && res.seller) {
        setFeedbackMessage({
          type: "success",
          text: res.message || "Keputusan verifikasi berhasil disimpan.",
        });

        // Perbarui list di memori secara lokal
        setSellers((prev) =>
          prev.map((s) => (s.id === res.seller!.id ? res.seller! : s))
        );

        if (res.stats) {
          setStats(res.stats);
          if (onStatsUpdate) {
            onStatsUpdate(res.stats);
          }
        }

        // Tutup modal
        setIsDecisionModalOpen(false);
        setIsDetailModalOpen(false);
        setSelectedSeller(null);
        setRejectionReason("");
      } else {
        setFeedbackMessage({
          type: "error",
          text: res.message || "Gagal memperbarui status verifikasi penjual.",
        });
      }
    } catch (err) {
      console.error("[handleSubmitDecision] Error:", err);
      setFeedbackMessage({
        type: "error",
        text: "Terjadi gangguan teknis saat menyimpan keputusan.",
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Helper buka modal keputusan dengan nilai awal
  const handleOpenDecisionModal = (
    seller: AdminSellerVerificationItem,
    type: VerificationDecision
  ) => {
    setSelectedSeller(seller);
    setDecisionType(type);
    if (type === "reject") {
      setRejectionReason(seller.verificationRejectionReason || "");
    } else if (type === "revoke") {
      setRejectionReason(
        seller.verificationRejectionReason ||
          "kontrak telah berakhir silahkan perpanjang kontrak"
      );
    } else if (type === "suspend") {
      setRejectionReason(
        seller.mallSuspensionReason || "kena laporan dan di suspend sementara"
      );
      setDurationHours(
        seller.mallSuspensionHours && seller.mallSuspensionHours >= 1
          ? seller.mallSuspensionHours
          : 24
      );
    } else {
      setRejectionReason("");
    }
    setIsDecisionModalOpen(true);
  };

  // Helper buka modal rincian berkas
  const handleOpenDetailModal = (seller: AdminSellerVerificationItem) => {
    setSelectedSeller(seller);
    setIsDetailModalOpen(true);
  };

  // Helper toggle penampakan NIK
  const toggleRevealNik = (id: number) => {
    setRevealedNiks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Format tanggal ke Bahasa Indonesia
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Label jenis usaha
  const getBusinessTypeLabel = (type?: string) => {
    switch (type) {
      case "umkm":
        return "UMKM Fisik";
      case "company":
        return "Badan Usaha (CV/PT)";
      case "brand_distributor":
        return "Distributor Brand";
      case "individual":
      default:
        return "Perorangan";
    }
  };

  // Format link WhatsApp internasional
  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER EXECUTIVE VIEWPORT & REALTIME SYNC */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#0a192f] border border-blue-500/20 p-6 sm:p-7 shadow-xl text-white">
        {/* Ambient Glowing Highlights */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
                <ShieldIcon size={14} className="text-blue-400" />
                <span>Otoritas Verifikasi Merchant</span>
              </span>
              {stats.pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 animate-pulse shadow-sm shadow-amber-500/50">
                  {stats.pendingCount} Butuh Audit
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Verifikasi Toko & Kelayakan Mall
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/80 max-w-2xl leading-relaxed">
              Pusat audit identitas KYC, penerbitan lisensi resmi Official Mall, pengaturan durasi suspend sanksi toko, dan perlindungan ekosistem transaksi NextShopID.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => fetchVerifications(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-xs font-semibold text-white backdrop-blur-md transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Perbarui data realtime dari database"
            >
              <RefreshIcon
                size={14}
                className={isRefreshing ? "animate-spin text-blue-400" : "text-slate-300"}
              />
              <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan Data"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-md animate-in fade-in duration-200 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircleIcon size={18} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircleIcon size={18} className="shrink-0 text-rose-500" />
            )}
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. KARTU STATISTIK METRIK STATUS INTERAKTIF (MODERN KPI TILES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Menunggu Review */}
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            statusFilter === "pending"
              ? "bg-amber-500/15 border-amber-500/50 shadow-md ring-2 ring-amber-500/20"
              : "bg-white dark:bg-[#0c1220] border-slate-200/90 dark:border-white/10 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Menunggu Review
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <ClockIcon size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.pendingCount}
            </span>
            {stats.pendingCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Antrean verifikasi berkas</p>
        </button>

        {/* 2. Official Mall (ACC) */}
        <button
          type="button"
          onClick={() => setStatusFilter("verified")}
          className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            statusFilter === "verified"
              ? "bg-emerald-500/15 border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-[#0c1220] border-slate-200/90 dark:border-white/10 hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Mall Terverifikasi
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <BadgeCheckIcon size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.verifiedCount}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/15 text-red-600 dark:text-red-400 font-bold uppercase tracking-tight">
              Mall
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lencana & lisensi aktif</p>
        </button>

        {/* 3. Ditangguhkan (Suspend) */}
        <button
          type="button"
          onClick={() => setStatusFilter("suspended")}
          className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            statusFilter === "suspended"
              ? "bg-orange-500/15 border-orange-500/50 shadow-md ring-2 ring-orange-500/20"
              : "bg-white dark:bg-[#0c1220] border-slate-200/90 dark:border-white/10 hover:border-orange-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Ditangguhkan
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 group-hover:scale-110 transition-transform">
              <LockIcon size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.suspendedCount || 0}
            </span>
            {(stats.suspendedCount || 0) > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-300 font-bold">
                Penalti Jam
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Suspend penalti sementara</p>
        </button>

        {/* 4. Ditolak / Revisi */}
        <button
          type="button"
          onClick={() => setStatusFilter("rejected")}
          className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
            statusFilter === "rejected"
              ? "bg-rose-500/15 border-rose-500/50 shadow-md ring-2 ring-rose-500/20"
              : "bg-white dark:bg-[#0c1220] border-slate-200/90 dark:border-white/10 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Ditolak / Revisi
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <XCircleIcon size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.rejectedCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Berkas perlu diperbaiki</p>
        </button>

        {/* 5. Total Keseluruhan Toko */}
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group col-span-2 sm:col-span-1 ${
            statusFilter === "all"
              ? "bg-blue-500/15 border-blue-500/50 shadow-md ring-2 ring-blue-500/20"
              : "bg-white dark:bg-[#0c1220] border-slate-200/90 dark:border-white/10 hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Total Mitra
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <StoreIcon size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {stats.totalPenjual}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Seluruh akun terdaftar</p>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR PENCARIAN, FILTER PILLS & SORTING */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Search Bar Input */}
        <div className="relative flex-1 min-w-[260px]">
          <SearchIcon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari toko, @username, email, pemilik KTP, atau NIK..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md"
              title="Hapus pencarian"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {/* Tab Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { key: "all", label: "Semua", count: stats.totalPenjual },
            { key: "pending", label: "Menunggu", count: stats.pendingCount },
            { key: "verified", label: "Mall Resmi", count: stats.verifiedCount },
            { key: "suspended", label: "Ditangguhkan", count: stats.suspendedCount || 0 },
            { key: "rejected", label: "Ditolak", count: stats.rejectedCount },
            { key: "unverified", label: "Belum Ajukan", count: stats.unverifiedCount },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sortir Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="newest">Prioritas Review & Terbaru</option>
            <option value="submitted_newest">Tgl Pengajuan Terbaru</option>
            <option value="name_asc">Nama Toko (A-Z)</option>
            <option value="oldest">Terlama Terdaftar</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABEL DATA MODERN VERIFIKASI MERCHANT DENGAN PRATINJAU DOKUMEN */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="h-9 w-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3.5" />
            <p className="text-xs text-slate-400 font-medium">
              Memuat data pengajuan verifikasi merchant...
            </p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="inline-flex h-14 w-14 rounded-3xl bg-slate-100 dark:bg-white/5 text-slate-400 items-center justify-center mb-3">
              <UserCheckIcon size={26} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Tidak Ada Mitra Ditemukan
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Tidak ada toko yang cocok dengan parameter filter atau pencarian Anda."
                : "Belum ada mitra toko yang mengajukan verifikasi."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-4">Toko & Akun Merchant</th>
                  <th scope="col" className="px-5 py-4">Identitas Pemilik (KYC)</th>
                  <th scope="col" className="px-5 py-4 text-center">Dokumen Berkas</th>
                  <th scope="col" className="px-5 py-4">Status Kelayakan</th>
                  <th scope="col" className="px-5 py-4">Tanggal Pengajuan</th>
                  <th scope="col" className="px-5 py-4 text-center">Aksi Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {sellers.map((seller) => {
                  const isPending = seller.verificationStatus === "pending";
                  const isVerified = seller.verificationStatus === "verified";
                  const isRejected = seller.verificationStatus === "rejected";
                  const isSuspended = seller.verificationStatus === "suspended";
                  const isRevealed = !!revealedNiks[seller.id];

                  const rawNik = seller.verificationData?.idCardNumber || "";
                  const maskedNik = rawNik
                    ? isRevealed
                      ? rawNik
                      : rawNik.length > 8
                      ? `${rawNik.slice(0, 4)}********${rawNik.slice(-4)}`
                      : rawNik
                    : "-";

                  return (
                    <tr
                      key={seller.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-white/[0.015] transition-colors ${
                        isPending
                          ? "bg-amber-500/[0.02] dark:bg-amber-500/[0.03]"
                          : isSuspended
                          ? "bg-orange-500/[0.02] dark:bg-orange-500/[0.03]"
                          : ""
                      }`}
                    >
                      {/* Kolom 1: Profil Toko & Badge Mall */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs transition-all ${
                                isVerified
                                  ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0c1220]"
                                  : isSuspended
                                  ? "ring-2 ring-orange-500/80 ring-offset-2 dark:ring-offset-[#0c1220]"
                                  : ""
                              }`}
                            >
                              {seller.name[0]?.toUpperCase() || "T"}
                            </div>
                            {isVerified && (
                              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-xs bg-red-600 text-white text-[7.5px] font-black uppercase tracking-tight shadow-xs border border-white dark:border-[#0c1220] leading-none pointer-events-none select-none z-10">
                                Mall
                              </span>
                            )}
                            <span
                              className={`absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0c1220] ${
                                seller.isStoreOpen ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                              title={seller.isStoreOpen ? "Toko Buka" : "Toko Libur"}
                            />
                          </div>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(seller)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate text-left cursor-pointer text-sm block"
                            >
                              {seller.name}
                            </button>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{seller.username}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Identitas Pemilik (KYC) */}
                      <td className="px-5 py-4">
                        {seller.verificationData ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{seller.verificationData.ownerName || seller.name}</span>
                              <span className="px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-[10px] font-medium border border-blue-200/50 dark:border-blue-800/40">
                                {getBusinessTypeLabel(seller.verificationData.businessType)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-400 font-mono">NIK: {maskedNik}</span>
                              {seller.verificationData.idCardNumber && (
                                <button
                                  type="button"
                                  onClick={() => toggleRevealNik(seller.id)}
                                  className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
                                >
                                  {isRevealed ? "Tutup" : "Lihat"}
                                </button>
                              )}
                            </div>

                            {seller.verificationData.phoneNumber && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span>WA: {seller.verificationData.phoneNumber}</span>
                                {getWhatsAppLink(seller.verificationData.phoneNumber) && (
                                  <a
                                    href={getWhatsAppLink(seller.verificationData.phoneNumber)!}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-500 hover:text-emerald-600"
                                    title="Hubungi via WhatsApp"
                                  >
                                    <ExternalLinkIcon size={11} />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum mengisi berkas</span>
                        )}
                      </td>

                      {/* Kolom 3: Dokumen Berkas Foto (Thumbnails Interaktif) */}
                      <td className="px-5 py-4 text-center">
                        {seller.verificationData?.idCardPhoto ||
                        seller.verificationData?.selfiePhoto ? (
                          <div className="flex items-center justify-center gap-2">
                            {/* Thumbnail Foto KTP */}
                            {seller.verificationData.idCardPhoto ? (
                              <div
                                onClick={() =>
                                  setPreviewPhoto({
                                    url: seller.verificationData!.idCardPhoto!,
                                    title: `Foto KTP Asli - ${seller.name}`,
                                  })
                                }
                                className="relative group w-11 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                                title="Lihat Foto KTP Asli"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={seller.verificationData.idCardPhoto}
                                  alt="KTP"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <EyeIcon size={12} />
                                </div>
                              </div>
                            ) : null}

                            {/* Thumbnail Foto Selfie */}
                            {seller.verificationData.selfiePhoto ? (
                              <div
                                onClick={() =>
                                  setPreviewPhoto({
                                    url: seller.verificationData!.selfiePhoto!,
                                    title: `Foto Selfie Memegang KTP - ${seller.name}`,
                                  })
                                }
                                className="relative group w-11 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                                title="Lihat Foto Selfie KTP"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={seller.verificationData.selfiePhoto}
                                  alt="Selfie"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <EyeIcon size={12} />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            Tidak Ada
                          </span>
                        )}
                      </td>

                      {/* Kolom 4: Status Kelayakan */}
                      <td className="px-5 py-4">
                        {isVerified && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              <BadgeCheckIcon size={13} className="text-emerald-500" />
                              <span>Official Mall (ACC)</span>
                            </span>
                            <p className="text-[10px] text-slate-400">Lisensi Mall aktif</p>
                          </div>
                        )}

                        {isPending && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
                              <ClockIcon size={13} className="text-amber-500" />
                              <span>Menunggu Review</span>
                            </span>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              Perlu audit berkas
                            </p>
                          </div>
                        )}

                        {isSuspended && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                              <LockIcon size={12} className="text-orange-500" />
                              <span>Ditangguhkan ({seller.mallSuspensionHours || "-"} Jam)</span>
                            </span>
                            {seller.mallSuspensionReason && (
                              <p
                                className="text-[10px] text-orange-600 dark:text-orange-400 font-medium truncate max-w-[160px]"
                                title={seller.mallSuspensionReason}
                              >
                                Alasan: {seller.mallSuspensionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {isRejected && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                              <XCircleIcon size={13} className="text-rose-500" />
                              <span>Ditolak / Revisi</span>
                            </span>
                            {seller.verificationRejectionReason && (
                              <p
                                className="text-[10px] text-rose-500 truncate max-w-[160px]"
                                title={seller.verificationRejectionReason}
                              >
                                {seller.verificationRejectionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {seller.verificationStatus === "unverified" && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                              Belum Mengajukan
                            </span>
                            {seller.verificationRejectionReason && (
                              <p
                                className="text-[10px] text-rose-500 truncate max-w-[160px]"
                                title={seller.verificationRejectionReason}
                              >
                                Mall Dicabut: {seller.verificationRejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Kolom 5: Tanggal Pengajuan */}
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {seller.verificationSubmittedAt
                            ? formatDate(seller.verificationSubmittedAt)
                            : formatDate(seller.createdAt)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {seller.verificationSubmittedAt ? "Tgl Berkas Masuk" : "Tgl Akun Terdaftar"}
                        </span>
                      </td>

                      {/* Kolom 6: Aksi Administrator */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Rincian Berkas */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(seller)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                            title="Buka berkas lengkap dan foto dokumen"
                          >
                            <FileTextIcon size={13} className="text-slate-400" />
                            <span>Rincian</span>
                          </button>

                          {/* Tombol ACC Cepat jika Pending atau Unverified */}
                          {!isVerified && !isSuspended && (
                            <button
                              type="button"
                              onClick={() => handleOpenDecisionModal(seller, "approve")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                              title="Setujui verifikasi toko (ACC)"
                            >
                              <CheckIcon size={13} />
                              <span>ACC</span>
                            </button>
                          )}

                          {/* Tombol Suspend jika Verified */}
                          {isVerified && (
                            <button
                              type="button"
                              onClick={() => handleOpenDecisionModal(seller, "suspend")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-semibold text-xs transition-colors cursor-pointer"
                              title="Suspend sementara Mall toko"
                            >
                              <LockIcon size={12} />
                              <span>Suspend</span>
                            </button>
                          )}

                          {/* Tombol Hentikan jika Verified */}
                          {isVerified && (
                            <button
                              type="button"
                              onClick={() => handleOpenDecisionModal(seller, "revoke")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                              title="Hentikan / Cabut status Mall"
                            >
                              <CloseIcon size={12} />
                              <span>Hentikan</span>
                            </button>
                          )}

                          {/* Tombol Aktifkan jika Suspended */}
                          {isSuspended && (
                            <button
                              type="button"
                              onClick={() => handleOpenDecisionModal(seller, "approve")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                              title="Pulihkan status Mall toko"
                            >
                              <CheckIcon size={13} />
                              <span>Aktifkan</span>
                            </button>
                          )}

                          {/* Tombol Tolak jika Pending */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleOpenDecisionModal(seller, "reject")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer"
                              title="Tolak berkas dengan alasan perbaikan"
                            >
                              <XCircleIcon size={13} />
                              <span>Tolak</span>
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* 5. MODAL DETAIL BERKAS & DOKUMEN FOTO PENJUAL (INSPEKSI AUDIT LENGKAP) */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                      selectedSeller.verificationStatus === "verified"
                        ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0c1220]"
                        : ""
                    }`}
                  >
                    {selectedSeller.name[0]?.toUpperCase() || "T"}
                  </div>
                  {selectedSeller.verificationStatus === "verified" && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-xs bg-red-600 text-white text-[7.5px] font-black uppercase tracking-tight shadow-xs border border-white dark:border-[#0c1220] leading-none pointer-events-none select-none z-10">
                      Mall
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Audit Berkas: {selectedSeller.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    @{selectedSeller.username} • {selectedSeller.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Grid Informasi Identitas Pemilik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Nama Pemilik Sesuai KTP
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedSeller.verificationData?.ownerName || selectedSeller.name}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Nomor NIK KTP
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {selectedSeller.verificationData?.idCardNumber || "-"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Kontak WhatsApp
                </span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedSeller.verificationData?.phoneNumber || "-"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Kategori Usaha
                </span>
                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold text-[11px]">
                  {getBusinessTypeLabel(selectedSeller.verificationData?.businessType)}
                </span>
              </div>

              <div className="sm:col-span-2 md:col-span-4 pt-2 border-t border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Deskripsi Profil Toko
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {selectedSeller.verificationData?.storeDescription || "Tidak ada deskripsi toko."}
                </p>
              </div>

              {selectedSeller.verificationData?.notes && (
                <div className="sm:col-span-2 md:col-span-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                  <span className="font-bold">Catatan Mitra ke Admin: </span>
                  <span>{selectedSeller.verificationData.notes}</span>
                </div>
              )}
            </div>

            {/* Dokumen Foto KTP & Selfie Berdampingan */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Dokumen Bukti Identitas yang Diunggah
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Foto KTP */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Foto KTP Asli
                    </span>
                    {selectedSeller.verificationData?.idCardPhoto && (
                      <span className="text-[10px] text-blue-500 font-semibold">
                        Klik untuk perbesar
                      </span>
                    )}
                  </div>

                  {selectedSeller.verificationData?.idCardPhoto ? (
                    <div
                      onClick={() =>
                        setPreviewPhoto({
                          url: selectedSeller.verificationData!.idCardPhoto!,
                          title: `Foto KTP - ${selectedSeller.name}`,
                        })
                      }
                      className="relative group rounded-xl overflow-hidden aspect-4/3 bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedSeller.verificationData.idCardPhoto}
                        alt="Foto KTP"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-opacity">
                        <EyeIcon size={16} />
                        <span>Perbesar Dokumen</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-4/3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <FileTextIcon size={24} className="mb-1 opacity-50" />
                      <span>Tidak ada foto KTP</span>
                    </div>
                  )}
                </div>

                {/* Foto Selfie dengan KTP */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Foto Selfie Memegang KTP
                    </span>
                    {selectedSeller.verificationData?.selfiePhoto && (
                      <span className="text-[10px] text-blue-500 font-semibold">
                        Klik untuk perbesar
                      </span>
                    )}
                  </div>

                  {selectedSeller.verificationData?.selfiePhoto ? (
                    <div
                      onClick={() =>
                        setPreviewPhoto({
                          url: selectedSeller.verificationData!.selfiePhoto!,
                          title: `Foto Selfie KTP - ${selectedSeller.name}`,
                        })
                      }
                      className="relative group rounded-xl overflow-hidden aspect-4/3 bg-black/5 dark:bg-black/30 border border-slate-200 dark:border-white/10 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedSeller.verificationData.selfiePhoto}
                        alt="Foto Selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1.5 transition-opacity">
                        <EyeIcon size={16} />
                        <span>Perbesar Dokumen</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-4/3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <UserCheckIcon size={24} className="mb-1 opacity-50" />
                      <span>Tidak ada foto selfie</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Aksi Langsung dari Modal Detail */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {selectedSeller.verificationStatus === "verified" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenDecisionModal(selectedSeller, "suspend");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30 cursor-pointer"
                    >
                      Suspend Toko
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenDecisionModal(selectedSeller, "revoke");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-xs"
                    >
                      Hentikan Mall
                    </button>
                  </>
                ) : selectedSeller.verificationStatus === "suspended" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenDecisionModal(selectedSeller, "revoke");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Cabut Mall
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenDecisionModal(selectedSeller, "approve");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
                    >
                      Aktifkan Kembali Mall
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenDecisionModal(selectedSeller, "reject");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-xs"
                    >
                      Tolak Pengajuan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenDecisionModal(selectedSeller, "approve");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
                    >
                      ACC (Setujui Mall)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL KEPUTUSAN & SANKSI (ACC, SUSPEND JAM, HENTIKAN, TOLAK) */}
      {/* ========================================================================= */}
      {isDecisionModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    decisionType === "approve"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : decisionType === "revoke" || decisionType === "reject"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : decisionType === "suspend"
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {decisionType === "approve" ? (
                    <BadgeCheckIcon size={20} />
                  ) : decisionType === "revoke" ? (
                    <CloseIcon size={20} />
                  ) : decisionType === "suspend" ? (
                    <LockIcon size={20} />
                  ) : decisionType === "reject" ? (
                    <XCircleIcon size={20} />
                  ) : (
                    <ClockIcon size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {decisionType === "approve"
                      ? selectedSeller.verificationStatus === "suspended"
                        ? "Aktifkan Kembali Status Mall"
                        : "Persetujuan Resmi Mall (ACC)"
                      : decisionType === "revoke"
                      ? "Hentikan / Cabut Mall Penjual"
                      : decisionType === "suspend"
                      ? "Suspend Sementara Toko Mall"
                      : decisionType === "reject"
                      ? "Tolak Pengajuan Verifikasi"
                      : "Kembalikan ke Status Ditinjau (Pending)"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Toko: <strong>{selectedSeller.name}</strong> (@{selectedSeller.username})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Pilihan Keputusan Switcher Tab */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Pilih Keputusan Tindakan:
              </label>

              {selectedSeller.verificationStatus === "verified" ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType("suspend")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "suspend"
                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <LockIcon size={16} />
                    <span>Suspend Mall</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionType("revoke");
                      if (!rejectionReason) {
                        setRejectionReason("kontrak telah berakhir silahkan perpanjang kontrak");
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "revoke"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <CloseIcon size={16} />
                    <span>Hentikan Mall</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("pending")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "pending"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <ClockIcon size={16} />
                    <span>Set Pending</span>
                  </button>
                </div>
              ) : selectedSeller.verificationStatus === "suspended" ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType("approve")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "approve"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <CheckIcon size={16} />
                    <span>Aktifkan Mall</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("suspend")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "suspend"
                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <LockIcon size={16} />
                    <span>Ubah Suspend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionType("revoke");
                      if (!rejectionReason) {
                        setRejectionReason("toko melanggar pedoman komunitas dan standar kemitraan Mall");
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "revoke"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <CloseIcon size={16} />
                    <span>Cabut Mall</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType("approve")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "approve"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <CheckIcon size={16} />
                    <span>ACC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("reject")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "reject"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <XCircleIcon size={16} />
                    <span>Tolak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("suspend")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "suspend"
                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <LockIcon size={16} />
                    <span>Suspend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType("pending")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      decisionType === "pending"
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <ClockIcon size={16} />
                    <span>Pending</span>
                  </button>
                </div>
              )}
            </div>

            {/* Konten Form Dinamis Berdasarkan Keputusan */}
            {decisionType === "approve" && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <BadgeCheckIcon size={16} className="text-emerald-600" />
                  <span>
                    {selectedSeller.verificationStatus === "suspended"
                      ? "Pemulihan Hak Mall Toko"
                      : "Persetujuan Resmi (Official Merchant)"}
                  </span>
                </p>
                <p className="leading-relaxed">
                  {selectedSeller.verificationStatus === "suspended"
                    ? "Status suspend akan segera dicabut. Lencana resmi dan border merah Mall toko akan kembali aktif seketika."
                    : "Dengan menyetujui, toko akan langsung mendapatkan lencana Verified Merchant, border merah Mall, prioritas etalase, dan fitur penarikan saldo instan."}
                </p>
              </div>
            )}

            {decisionType === "suspend" && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300">
                  <span className="font-bold">Penalti Suspend Toko: </span>
                  Status Mall dan hak verifikasi toko akan dibekukan sementara. Penjual dapat melihat durasi penalti dan sisa waktu suspend di portalnya.
                </div>

                {/* Durasi Jam */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Durasi Penalti Suspend (Min. 1 Jam) <span className="text-orange-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400">
                      {durationHours} Jam
                    </span>
                  </div>

                  {/* Preset Cepat Durasi */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {QUICK_SUSPENSION_DURATIONS.map((preset) => (
                      <button
                        key={preset.hours}
                        type="button"
                        onClick={() => setDurationHours(preset.hours)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          durationHours === preset.hours
                            ? "bg-orange-500 text-white border-orange-500 font-bold shadow-2xs"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={durationHours}
                      onChange={(e) =>
                        setDurationHours(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-28 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">Jam penalti dihitung sejak disimpan</span>
                  </div>

                  {/* Live Preview Timestamp Selesai Penalti */}
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Ditangguhkan sampai:</span>
                    <strong className="text-orange-600 dark:text-orange-400 font-bold font-mono">
                      {new Date(Date.now() + (durationHours || 1) * 3600000).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>
                </div>

                {/* Alasan Suspend */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Suspend Toko <span className="text-orange-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_SUSPEND_REASONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer text-left"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ketik alasan suspend secara spesifik di sini..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {decisionType === "revoke" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                  <span className="font-bold">Penghentian Fungsi Mall: </span>
                  Status Mall resmi dan lencana verifikasi centang akan dicabut dari akun toko ini. Toko akan kembali menjadi toko perorangan biasa.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Penghentian / Pencabutan Mall <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_REVOKE_REASONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer text-left"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ketik alasan pencabutan status Mall di sini..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {decisionType === "reject" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Alasan ini akan langsung tampil di notifikasi & portal penjual agar mereka tahu apa yang perlu diperbaiki.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESET_REJECTION_REASONS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(preset)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 transition-colors cursor-pointer text-left"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ketik alasan penolakan spesifik di sini..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {decisionType === "pending" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  Status verifikasi akan dikembalikan ke <strong>Menunggu Tinjauan</strong>. Anda dapat menyertakan catatan tambahan opsional.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Internal (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Catatan peninjauan ulang..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                disabled={isSubmittingDecision}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmitDecision}
                disabled={isSubmittingDecision}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  decisionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20"
                    : decisionType === "revoke" || decisionType === "reject"
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-950/20"
                    : decisionType === "suspend"
                    ? "bg-orange-600 hover:bg-orange-500 shadow-orange-950/20"
                    : "bg-amber-600 hover:bg-amber-500 shadow-amber-950/20"
                }`}
              >
                {isSubmittingDecision ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon size={14} />
                    <span>
                      {decisionType === "approve"
                        ? selectedSeller.verificationStatus === "suspended"
                          ? "Aktifkan Kembali Mall"
                          : "Konfirmasi ACC"
                        : decisionType === "revoke"
                        ? "Hentikan Status Mall"
                        : decisionType === "suspend"
                        ? "Terapkan Penalti Suspend"
                        : decisionType === "reject"
                        ? "Tolak Verifikasi"
                        : "Simpan Pending"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL PRATINJAU PEMBESAR FOTO DOKUMEN (FULLSCREEN VIEWER) */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#0c1220] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {previewPhoto.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="overflow-auto max-h-[75vh] flex items-center justify-center rounded-2xl bg-black/40 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminService,
  AdminSellerVerificationItem,
  AdminVerificationStats,
  VerificationDecision,
} from "@/services/admin.service";
import {
  SearchIcon,
  FilterIcon,
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
  ExternalLinkIcon,
  CloseIcon,
  CheckIcon,
  AlertCircleIcon,
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
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // State Modal Preview Foto Dokumen
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // State reveal NIK
  const [revealedNiks, setRevealedNiks] = useState<Record<number, boolean>>({});

  // Preset alasan penolakan umum untuk kemudahan admin
  const PRESET_REJECTION_REASONS = [
    "Foto KTP buram / tidak terbaca dengan jelas",
    "Data NIK tidak cocok dengan nama lengkap pada kartu identitas",
    "Foto selfie memegang KTP tidak sesuai panduan (wajah / kartu terpotong)",
    "Dokumen identitas telah kedaluwarsa atau rusak",
    "Profil usaha dan deskripsi toko belum memenuhi standar kepatuhan platform",
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

  // Handler Submit Keputusan (ACC / Tolak / Pending)
  const handleSubmitDecision = async () => {
    if (!token || !selectedSeller) return;

    if (decisionType === "reject" && !rejectionReason.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Wajib menyertakan alasan penolakan agar penjual dapat memperbaiki pengajuannya.",
      });
      return;
    }

    setIsSubmittingDecision(true);
    setFeedbackMessage(null);

    try {
      const res = await adminService.updateVerificationDecision(
        token,
        selectedSeller.id,
        {
          decision: decisionType,
          reason:
            decisionType === "reject" || decisionType === "pending"
              ? rejectionReason.trim()
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
    setRejectionReason(
      type === "reject" ? seller.verificationRejectionReason || "" : ""
    );
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
        return "UMKM / Toko Fisik";
      case "company":
        return "Badan Usaha (CV / PT)";
      case "brand_distributor":
        return "Distributor Resmi Brand";
      case "individual":
      default:
        return "Perorangan / Individu";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Judul & Ringkasan Deskripsi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <UserCheckIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Verifikasi & Kelayakan Penjual
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Persetujuan pengajuan merchant resmi, audit identitas KYC, berikan lencana centang (ACC), atau tolak dengan alasan terperinci.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Refresh Realtime */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => fetchVerifications(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            title="Muat ulang data verifikasi realtime"
          >
            <RefreshIcon
              size={14}
              className={isRefreshing ? "animate-spin text-blue-500" : "text-slate-400"}
            />
            <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronkan"}</span>
          </button>
        </div>
      </div>

      {/* Notifikasi / Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 transition-all duration-200 ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircleIcon size={18} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircleIcon size={18} className="shrink-0 text-rose-500" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* 2. Kartu Statistik Agregat Realtime (Dapat Diklik untuk Filter Cepat) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Menunggu Review (Pending) */}
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            statusFilter === "pending"
              ? "bg-amber-500/15 border-amber-500/40 shadow-xs ring-2 ring-amber-500/20"
              : "bg-white dark:bg-[#111827] border-slate-200/90 dark:border-white/10 hover:border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Menunggu Review
            </span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ClockIcon size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.pendingCount}
            </span>
            {stats.pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
                Butuh Tindakan
              </span>
            )}
          </div>
        </button>

        {/* Terverifikasi / ACC */}
        <button
          type="button"
          onClick={() => setStatusFilter("verified")}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            statusFilter === "verified"
              ? "bg-emerald-500/15 border-emerald-500/40 shadow-xs ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-[#111827] border-slate-200/90 dark:border-white/10 hover:border-emerald-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Disetujui (ACC)
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BadgeCheckIcon size={15} />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.verifiedCount}
          </span>
        </button>

        {/* Ditolak / Perlu Perbaikan */}
        <button
          type="button"
          onClick={() => setStatusFilter("rejected")}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            statusFilter === "rejected"
              ? "bg-rose-500/15 border-rose-500/40 shadow-xs ring-2 ring-rose-500/20"
              : "bg-white dark:bg-[#111827] border-slate-200/90 dark:border-white/10 hover:border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Ditolak / Revisi
            </span>
            <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircleIcon size={15} />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.rejectedCount}
          </span>
        </button>

        {/* Belum Mengajukan */}
        <button
          type="button"
          onClick={() => setStatusFilter("unverified")}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            statusFilter === "unverified"
              ? "bg-slate-500/15 border-slate-500/40 shadow-xs ring-2 ring-slate-500/20"
              : "bg-white dark:bg-[#111827] border-slate-200/90 dark:border-white/10 hover:border-slate-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Belum Ajukan
            </span>
            <div className="h-7 w-7 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <FileTextIcon size={15} />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.unverifiedCount}
          </span>
        </button>

        {/* Total Keseluruhan Penjual */}
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === "all"
              ? "bg-blue-500/15 border-blue-500/40 shadow-xs ring-2 ring-blue-500/20"
              : "bg-white dark:bg-[#111827] border-slate-200/90 dark:border-white/10 hover:border-blue-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Penjual
            </span>
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <StoreIcon size={15} />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalPenjual}
          </span>
        </button>
      </div>

      {/* 3. Bar Kontrol Pencarian, Filter Tab & Sortir */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-white/10">
        {/* Input Pencarian */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama toko, username, email, nama pemilik, atau NIK..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {/* Tab Pilihan Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { key: "all", label: "Semua", count: stats.totalPenjual },
            { key: "pending", label: "Menunggu", count: stats.pendingCount },
            { key: "verified", label: "Disetujui", count: stats.verifiedCount },
            { key: "rejected", label: "Ditolak", count: stats.rejectedCount },
            { key: "unverified", label: "Belum Ajukan", count: stats.unverifiedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sortir Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="newest">Prioritas Review & Terbaru</option>
            <option value="submitted_newest">Tgl Pengajuan Terbaru</option>
            <option value="name_asc">Nama Toko (A-Z)</option>
            <option value="oldest">Terlama Terdaftar</option>
          </select>
        </div>
      </div>

      {/* 4. Daftar Penjual (Tabel & Tampilan Responsif) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Memuat data verifikasi penjual realtime...
            </p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 items-center justify-center mb-3">
              <UserCheckIcon size={26} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
              Tidak Ada Data Penjual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Tidak ada akun penjual yang cocok dengan kriteria filter atau pencarian Anda."
                : "Belum ada akun penjual yang terdaftar di platform."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-white/10">
            {sellers.map((seller) => {
              const isPending = seller.verificationStatus === "pending";
              const isVerified = seller.verificationStatus === "verified";
              const isRejected = seller.verificationStatus === "rejected";
              const isRevealed = !!revealedNiks[seller.id];

              const maskedNik = seller.verificationData?.idCardNumber
                ? isRevealed
                  ? seller.verificationData.idCardNumber
                  : `${seller.verificationData.idCardNumber.slice(0, 4)}********${seller.verificationData.idCardNumber.slice(-4)}`
                : "-";

              return (
                <div
                  key={seller.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    isPending
                      ? "bg-amber-500/[0.03] dark:bg-amber-500/[0.05] hover:bg-amber-500/[0.07]"
                      : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Kolom 1: Profil Toko & Status */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="relative">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
                          {seller.name[0]?.toUpperCase() || "T"}
                        </div>
                        {/* Dot indicator buka/tutup toko */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#111827] ${
                            seller.isStoreOpen ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                          title={seller.isStoreOpen ? "Toko Buka" : "Toko Libur"}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {seller.name}
                          </h3>
                          <span className="text-xs text-slate-400 font-mono">
                            @{seller.username}
                          </span>

                          {/* Badge Status Verifikasi Realtime */}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              <BadgeCheckIcon size={13} className="text-emerald-500" />
                              <span>Official Verified (ACC)</span>
                            </span>
                          )}

                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 animate-pulse">
                              <ClockIcon size={13} className="text-amber-500" />
                              <span>Menunggu Persetujuan Admin</span>
                            </span>
                          )}

                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                              <XCircleIcon size={13} className="text-rose-500" />
                              <span>Ditolak / Perlu Perbaikan</span>
                            </span>
                          )}

                          {seller.verificationStatus === "unverified" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                              Belum Mengajukan
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{seller.email}</span>
                          <span>•</span>
                          <span>
                            Terdaftar: {formatDate(seller.createdAt)}
                          </span>
                          {seller.verificationSubmittedAt && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                Diajukan: {formatDate(seller.verificationSubmittedAt)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Rincian Berkas Identitas Pemilik yang Diajukan */}
                        {seller.verificationData && (
                          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200/70 dark:border-white/5 text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                Nama Pemilik KTP
                              </p>
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {seller.verificationData.ownerName || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-between">
                                <span>Nomor NIK</span>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealNik(seller.id)}
                                  className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                                >
                                  {isRevealed ? "Tutup" : "Lihat"}
                                </button>
                              </p>
                              <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                {maskedNik}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                No. WhatsApp
                              </p>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {seller.verificationData.phoneNumber || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                Tipe Bisnis
                              </p>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-medium text-[11px]">
                                {getBusinessTypeLabel(seller.verificationData.businessType)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Banner Alasan Penolakan Jika Sedang Ditolak */}
                        {isRejected && seller.verificationRejectionReason && (
                          <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                            <span className="font-bold">Alasan Penolakan: </span>
                            <span>{seller.verificationRejectionReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kolom 2: Tombol Aksi ACC, Tolak, dan Detail */}
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-start shrink-0 pt-2 lg:pt-0">
                      {/* Tombol Rincian Berkas Dokumen */}
                      <button
                        type="button"
                        onClick={() => handleOpenDetailModal(seller)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        title="Lihat foto KTP, selfie, dan rincian lengkap"
                      >
                        <FileTextIcon size={14} className="text-slate-500" />
                        <span>Rincian & Foto</span>
                      </button>

                      {/* Tombol Cepat: ACC (Setujui) */}
                      {!isVerified && (
                        <button
                          type="button"
                          onClick={() => handleOpenDecisionModal(seller, "approve")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer active:scale-95"
                          title="Setujui verifikasi toko (ACC)"
                        >
                          <CheckIcon size={14} />
                          <span>ACC (Setujui)</span>
                        </button>
                      )}

                      {/* Tombol Cepat: Tolak dengan Alasan */}
                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => handleOpenDecisionModal(seller, "reject")}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer active:scale-95"
                          title="Tolak pengajuan dengan alasan perbaikan"
                        >
                          <XCircleIcon size={14} />
                          <span>Tolak</span>
                        </button>
                      )}

                      {/* Tombol Kembalikan ke Pending / Tinjau Ulang */}
                      {!isPending && (
                        <button
                          type="button"
                          onClick={() => handleOpenDecisionModal(seller, "pending")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
                          title="Kembalikan status ke Menunggu Tinjauan"
                        >
                          <ClockIcon size={14} />
                          <span>Set Pending</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modal Rincian Berkas & Foto Dokumen Penjual */}
      {isDetailModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
                  {selectedSeller.name[0]?.toUpperCase() || "T"}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Rincian Pengajuan Verifikasi: {selectedSeller.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Akun: @{selectedSeller.username} • {selectedSeller.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Informasi Identitas Lengkap */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200/70 dark:border-white/5 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Nama Lengkap Pemilik KTP
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {selectedSeller.verificationData?.ownerName || selectedSeller.name}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Nomor NIK / Paspor
                  </span>
                  <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {selectedSeller.verificationData?.idCardNumber || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Nomor WhatsApp / Telepon
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5">
                    {selectedSeller.verificationData?.phoneNumber || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Model / Jenis Usaha
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5">
                    {getBusinessTypeLabel(selectedSeller.verificationData?.businessType)}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    Deskripsi Profil Toko
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {selectedSeller.verificationData?.storeDescription ||
                      "Tidak menyertakan deskripsi tambahan."}
                  </p>
                </div>

                {selectedSeller.verificationData?.notes && (
                  <div className="sm:col-span-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                    <span className="font-bold">Catatan Penjual ke Admin: </span>
                    <span>{selectedSeller.verificationData.notes}</span>
                  </div>
                )}
              </div>

              {/* Foto Dokumen Identitas (KTP & Selfie) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                  Dokumen Foto yang Diunggah
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Foto KTP */}
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Foto KTP Asli
                    </p>
                    {selectedSeller.verificationData?.idCardPhoto ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/30 aspect-4/3 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedSeller.verificationData.idCardPhoto}
                          alt="Foto KTP"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPhoto({
                              url: selectedSeller.verificationData!.idCardPhoto!,
                              title: `Foto KTP - ${selectedSeller.name}`,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5"
                        >
                          <EyeIcon size={16} />
                          <span>Perbesar Foto</span>
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-4/3 rounded-xl border border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <FileTextIcon size={24} className="mb-1 opacity-50" />
                        <span>Tidak ada foto KTP</span>
                      </div>
                    )}
                  </div>

                  {/* Foto Selfie dengan KTP */}
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Foto Selfie Memegang KTP
                    </p>
                    {selectedSeller.verificationData?.selfiePhoto ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/30 aspect-4/3 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedSeller.verificationData.selfiePhoto}
                          alt="Foto Selfie dengan KTP"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPhoto({
                              url: selectedSeller.verificationData!.selfiePhoto!,
                              title: `Foto Selfie KTP - ${selectedSeller.name}`,
                            })
                          }
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5"
                        >
                          <EyeIcon size={16} />
                          <span>Perbesar Foto</span>
                        </button>
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
            </div>

            {/* Footer Aksi Modal Detail */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenDecisionModal(selectedSeller, "reject");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  Tolak Berkas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenDecisionModal(selectedSeller, "approve");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  ACC (Setujui)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Pengambilan Keputusan (ACC, Tolak dengan Alasan, atau Pending) */}
      {isDecisionModalOpen && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                    decisionType === "approve"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : decisionType === "reject"
                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}
                >
                  {decisionType === "approve" ? (
                    <BadgeCheckIcon size={20} />
                  ) : decisionType === "reject" ? (
                    <XCircleIcon size={20} />
                  ) : (
                    <ClockIcon size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {decisionType === "approve"
                      ? "Setujui Verifikasi (ACC)"
                      : decisionType === "reject"
                      ? "Tolak Pengajuan Verifikasi"
                      : "Kembalikan ke Status Ditinjau (Pending)"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Toko: {selectedSeller.name} (@{selectedSeller.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Pilihan Tipe Keputusan Tab */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Keputusan Admin:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionType("approve")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    decisionType === "approve"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <CheckIcon size={16} />
                  <span>ACC (Setujui)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionType("reject")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
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
                  onClick={() => setDecisionType("pending")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    decisionType === "pending"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <ClockIcon size={16} />
                  <span>Pending</span>
                </button>
              </div>
            </div>

            {/* Penjelasan atau Input Alasan */}
            {decisionType === "approve" && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 mb-5 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <BadgeCheckIcon size={16} className="text-emerald-600" />
                  <span>Persetujuan Resmi (Official Merchant)</span>
                </p>
                <p className="leading-relaxed">
                  Dengan menyetujui, toko akan langsung mendapatkan lencana <strong>Verified Merchant</strong>, prioritas pencarian, dan akses fitur pencairan saldo instan.
                </p>
              </div>
            )}

            {decisionType === "reject" && (
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Alasan ini akan langsung tampil di notifikasi & portal penjual agar mereka tahu apa yang perlu diperbaiki.
                  </p>

                  {/* Preset Alasan Cepat */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
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
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {decisionType === "pending" && (
              <div className="space-y-3 mb-5">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  Status verifikasi akan dikembalikan ke <strong>Menunggu Tinjauan</strong>. Anda dapat menyertakan catatan tambahan opsional di bawah ini.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Internal / Pesan ke Penjual (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Catatan peninjauan ulang..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0b132b]/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Tombol Simpan & Batal */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                disabled={isSubmittingDecision}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmitDecision}
                disabled={isSubmittingDecision}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50 ${
                  decisionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : decisionType === "reject"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-600 hover:bg-amber-700"
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
                        ? "Konfirmasi ACC"
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

      {/* 7. Modal Pembesar Foto Dokumen */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-[#111827] rounded-3xl p-4 shadow-2xl border border-white/10 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {previewPhoto.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="overflow-auto max-h-[75vh] flex items-center justify-center rounded-2xl bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

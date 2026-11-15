"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  WalletIcon,
  CreditCardIcon,
  PlusIcon,
  CheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CloseIcon,
  RefreshIcon,
  TrashIcon,
  CopyIcon,
  ClockIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ShieldIcon,
  DollarSignIcon,
  LockIcon,
} from "@/components/ui/icons";
import {
  sellerService,
  SellerPayoutAccount,
  SellerProfile,
  PayoutAccountType,
  PayoutMethod,
  SellerWithdrawalItem,
} from "@/services/seller.service";

interface PenjualPayoutAccountsViewProps {
  sellerProfile?: SellerProfile;
  token?: string;
  onBalanceUpdated?: (newBalance: number) => void;
}

interface FeedbackState {
  type: "success" | "error";
  text: string;
}

type TabKey = "withdraw" | "accounts" | "history";

const PRESET_BANKS = [
  { id: "bca", name: "Bank Central Asia (BCA)" },
  { id: "mandiri", name: "Bank Mandiri" },
  { id: "bri", name: "Bank Rakyat Indonesia (BRI)" },
  { id: "bni", name: "Bank Negara Indonesia (BNI)" },
  { id: "bsi", name: "Bank Syariah Indonesia (BSI)" },
  { id: "cimb", name: "CIMB Niaga" },
  { id: "permata", name: "Bank Permata" },
  { id: "danamon", name: "Bank Danamon" },
  { id: "btn", name: "Bank Tabungan Negara (BTN)" },
  { id: "btpn", name: "Bank BTPN / Jenius" },
  { id: "panin", name: "Bank Panin" },
  { id: "ocbc", name: "OCBC NISP" },
];

const PRESET_WALLETS = [
  { id: "gopay", name: "GoPay" },
  { id: "ovo", name: "OVO" },
  { id: "dana", name: "DANA" },
  { id: "shopeepay", name: "ShopeePay" },
  { id: "linkaja", name: "LinkAja" },
  { id: "astrapay", name: "AstraPay" },
  { id: "isaku", name: "i.saku" },
];

// Helper penentuan gaya visual & warna gradient kartu bank/wallet
const getProviderStyle = (name: string, type: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("bca")) {
    return {
      gradient: "from-[#002f6c] via-[#004b93] to-[#001f44]",
      badge: "bg-blue-400/20 text-blue-200 border-blue-400/30",
      accent: "text-blue-400",
      chip: "gold" as const,
    };
  }
  if (lower.includes("mandiri")) {
    return {
      gradient: "from-[#002855] via-[#004080] to-[#f59e0b]/40",
      badge: "bg-amber-400/20 text-amber-200 border-amber-400/30",
      accent: "text-amber-400",
      chip: "silver" as const,
    };
  }
  if (lower.includes("bri")) {
    return {
      gradient: "from-[#003e7e] via-[#005bb5] to-[#002244]",
      badge: "bg-sky-400/20 text-sky-200 border-sky-400/30",
      accent: "text-sky-400",
      chip: "gold" as const,
    };
  }
  if (lower.includes("bni")) {
    return {
      gradient: "from-[#004d40] via-[#00695c] to-[#e65100]/50",
      badge: "bg-teal-400/20 text-teal-200 border-teal-400/30",
      accent: "text-teal-400",
      chip: "silver" as const,
    };
  }
  if (lower.includes("bsi")) {
    return {
      gradient: "from-[#00695c] via-[#00897b] to-[#004d40]",
      badge: "bg-emerald-400/20 text-emerald-200 border-emerald-400/30",
      accent: "text-emerald-400",
      chip: "gold" as const,
    };
  }
  if (lower.includes("cimb")) {
    return {
      gradient: "from-[#670000] via-[#8e0000] to-[#3a0000]",
      badge: "bg-rose-400/20 text-rose-200 border-rose-400/30",
      accent: "text-rose-400",
      chip: "silver" as const,
    };
  }
  if (lower.includes("gopay")) {
    return {
      gradient: "from-[#00661e] via-[#008828] to-[#003810]",
      badge: "bg-emerald-400/20 text-emerald-200 border-emerald-400/30",
      accent: "text-emerald-400",
      chip: "wallet" as const,
    };
  }
  if (lower.includes("ovo")) {
    return {
      gradient: "from-[#3e1f7a] via-[#542d9c] to-[#25104d]",
      badge: "bg-purple-400/20 text-purple-200 border-purple-400/30",
      accent: "text-purple-400",
      chip: "wallet" as const,
    };
  }
  if (lower.includes("dana")) {
    return {
      gradient: "from-[#0b62a4] via-[#118eea] to-[#073d66]",
      badge: "bg-sky-400/20 text-sky-200 border-sky-400/30",
      accent: "text-sky-400",
      chip: "wallet" as const,
    };
  }
  if (lower.includes("shopee")) {
    return {
      gradient: "from-[#b83814] via-[#ee4d2d] to-[#78230a]",
      badge: "bg-orange-400/20 text-orange-200 border-orange-400/30",
      accent: "text-orange-400",
      chip: "wallet" as const,
    };
  }

  // Default Fallbacks
  if (type === "bank") {
    return {
      gradient: "from-[#0f172a] via-[#1e293b] to-[#020617]",
      badge: "bg-slate-400/20 text-slate-200 border-slate-400/30",
      accent: "text-slate-300",
      chip: "gold" as const,
    };
  }
  return {
    gradient: "from-[#042f2e] via-[#0f766e] to-[#021d1c]",
    badge: "bg-teal-400/20 text-teal-200 border-teal-400/30",
    accent: "text-teal-300",
    chip: "wallet" as const,
  };
};

export const PenjualPayoutAccountsView: React.FC<PenjualPayoutAccountsViewProps> = ({
  sellerProfile,
  token,
  onBalanceUpdated,
}) => {
  // Saldo realtime toko
  const [currentBalance, setCurrentBalance] = useState<number>(sellerProfile?.balance || 0);

  // Navigasi Tab Modern
  const [activeTab, setActiveTab] = useState<TabKey>("withdraw");

  // State data akun tersimpan & riwayat penarikan (WD)
  const [accounts, setAccounts] = useState<SellerPayoutAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<SellerWithdrawalItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // State Feedback Notifikasi
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // State Form Penarikan Saldo (WD)
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawNotes, setWithdrawNotes] = useState<string>("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState<boolean>(false);

  // Filter tampilan kartu akun tersimpan
  const [filterType, setFilterType] = useState<"all" | "bank" | "wallet">("all");

  // State Modal Tambah Akun
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<PayoutMethod>("preset");
  const [isSubmittingAccount, setIsSubmittingAccount] = useState<boolean>(false);

  // Form State: Metode 1 (Pilihan Cepat / Preset)
  const [presetType, setPresetType] = useState<PayoutAccountType>("bank");
  const [presetProvider, setPresetProvider] = useState<string>(PRESET_BANKS[0].name);
  const [presetNumber, setPresetNumber] = useState<string>("");
  const [presetHolderName, setPresetHolderName] = useState<string>("");

  // Form State: Metode 2 (Tambah Manual)
  const [manualType, setManualType] = useState<PayoutAccountType>("bank");
  const [manualHolderName, setManualHolderName] = useState<string>("");
  const [manualNumber, setManualNumber] = useState<string>("");
  const [manualProviderName, setManualProviderName] = useState<string>("");
  const [manualIsAgreed, setManualIsAgreed] = useState<boolean>(false);

  // State Modal Hapus Akun
  const [accountToDelete, setAccountToDelete] = useState<SellerPayoutAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Format Rupiah
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Format Nomor Rekening dengan Spasi 4 Digit (Tampilan Kartu Debit)
  const formatCardNumber = (num: string): string => {
    if (!num) return "";
    return num.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Format Tanggal & Jam
  const formatDateTime = (isoString?: string): string => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Sinkronkan saldo jika prop sellerProfile berubah
  useEffect(() => {
    if (sellerProfile && typeof sellerProfile.balance === "number") {
      setCurrentBalance(sellerProfile.balance);
    }
  }, [sellerProfile?.balance]);

  // Fetch daftar akun dan riwayat WD dari backend
  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!token) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const [accRes, wdRes] = await Promise.all([
          sellerService.getPayoutAccounts(token),
          sellerService.getWithdrawals(token),
        ]);

        if (accRes.success && Array.isArray(accRes.data)) {
          setAccounts(accRes.data);
          // Set default selected account jika belum ada yang terpilih
          if (accRes.data.length > 0 && selectedAccountId === null) {
            setSelectedAccountId(accRes.data[0].id);
          }
        }

        if (wdRes.success && Array.isArray(wdRes.data)) {
          setWithdrawals(wdRes.data);
        }
      } catch (err) {
        console.error("[PenjualPayoutAccountsView] Error fetching data:", err);
        setFeedback({
          type: "error",
          text: "Terjadi gangguan saat memuat data penarikan saldo.",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, selectedAccountId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler Buka Modal Tambah Akun
  const handleOpenAddModal = (mode: PayoutMethod = "preset") => {
    setAddMode(mode);
    setPresetType("bank");
    setPresetProvider(PRESET_BANKS[0].name);
    setPresetNumber("");
    setPresetHolderName(sellerProfile?.name || "");

    setManualType("bank");
    setManualHolderName(sellerProfile?.name || "");
    setManualNumber("");
    setManualProviderName("");
    setManualIsAgreed(false);

    setFeedback(null);
    setIsModalOpen(true);
  };

  // Handler Submit Penambahan Akun Baru
  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    let payload: {
      accountType: PayoutAccountType;
      providerName: string;
      accountNumber: string;
      accountHolderName: string;
      method: PayoutMethod;
      isAgreed: boolean;
    };

    if (addMode === "preset") {
      const cleanNumber = presetNumber.trim();
      if (!cleanNumber) {
        setFeedback({
          type: "error",
          text: `Silakan masukkan ${presetType === "bank" ? "nomor rekening" : "nomor e-wallet"} Anda.`,
        });
        return;
      }
      if (!/^\d+$/.test(cleanNumber)) {
        setFeedback({
          type: "error",
          text: `${presetType === "bank" ? "Nomor rekening" : "Nomor e-wallet"} wajib hanya menggunakan angka (0-9).`,
        });
        return;
      }
      if (!presetHolderName.trim()) {
        setFeedback({
          type: "error",
          text: "Silakan masukkan nama lengkap pemilik akun.",
        });
        return;
      }
      payload = {
        accountType: presetType,
        providerName: presetProvider,
        accountNumber: cleanNumber,
        accountHolderName: presetHolderName.trim(),
        method: "preset",
        isAgreed: true,
      };
    } else {
      // Validasi Metode Manual
      if (!manualHolderName.trim()) {
        setFeedback({
          type: "error",
          text: "Nama lengkap pemilik akun wajib diisi (bebas kombinasi huruf dan angka).",
        });
        return;
      }
      const cleanManualNumber = manualNumber.trim();
      if (!cleanManualNumber) {
        setFeedback({
          type: "error",
          text: `Silakan masukkan ${manualType === "bank" ? "nomor rekening bank" : "nomor e-wallet"} Anda.`,
        });
        return;
      }
      if (!/^\d+$/.test(cleanManualNumber)) {
        setFeedback({
          type: "error",
          text: `${manualType === "bank" ? "Nomor rekening bank" : "Nomor akun e-wallet"} wajib hanya menggunakan angka (0-9).`,
        });
        return;
      }
      if (!manualProviderName.trim()) {
        setFeedback({
          type: "error",
          text: `Nama ${manualType === "bank" ? "bank" : "e-wallet"} wajib diketik manual.`,
        });
        return;
      }
      if (!manualIsAgreed) {
        setFeedback({
          type: "error",
          text: "Anda wajib mencentang pernyataan keabsahan kepemilikan rekening/wallet.",
        });
        return;
      }
      payload = {
        accountType: manualType,
        providerName: manualProviderName.trim(),
        accountNumber: cleanManualNumber,
        accountHolderName: manualHolderName.trim(),
        method: "manual",
        isAgreed: true,
      };
    }

    setIsSubmittingAccount(true);
    setFeedback(null);

    try {
      const res = await sellerService.addPayoutAccount(token, payload);
      if (res.success && res.data) {
        setFeedback({
          type: "success",
          text: res.message || "Akun penarikan berhasil disimpan ke sistem.",
        });
        setIsModalOpen(false);
        // Otomatis pilih akun yang baru dibuat untuk penarikan
        setSelectedAccountId(res.data.id);
        setActiveTab("withdraw");
        fetchData(true);
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal menyimpan akun penarikan.",
        });
      }
    } catch (err) {
      console.error("[handleSubmitAccount] Error:", err);
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan pada server saat menyimpan data akun.",
      });
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Handler Hapus Akun
  const handleConfirmDelete = async () => {
    if (!token || !accountToDelete) return;
    setIsDeleting(true);

    try {
      const res = await sellerService.deletePayoutAccount(token, accountToDelete.id);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Akun penarikan berhasil dihapus.",
        });
        if (selectedAccountId === accountToDelete.id) {
          const remaining = accounts.filter((a) => a.id !== accountToDelete.id);
          setSelectedAccountId(remaining.length > 0 ? remaining[0].id : null);
        }
        setAccountToDelete(null);
        fetchData(true);
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Gagal menghapus akun penarikan.",
        });
      }
    } catch (err) {
      console.error("[handleConfirmDelete] Error:", err);
      setFeedback({
        type: "error",
        text: "Terjadi kesalahan saat menghapus akun.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Pengajuan Penarikan Saldo (WD)
  const handleProcessWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (sellerProfile?.isBalanceFrozen) {
      setFeedback({
        type: "error",
        text: `Penarikan saldo tidak dapat diproses: Saldo toko Anda sedang dibekukan oleh admin (${
          sellerProfile.balanceFreezeReason || "Terjadi kecurangan / investigasi"
        }).`,
      });
      return;
    }

    if (accounts.length === 0) {
      setFeedback({
        type: "error",
        text: "Anda belum memiliki akun bank atau wallet yang disimpan. Silakan tambahkan akun terlebih dahulu untuk menarik saldo.",
      });
      handleOpenAddModal("preset");
      return;
    }

    if (!selectedAccountId) {
      setFeedback({
        type: "error",
        text: "Silakan pilih akun tujuan penarikan dana dari daftar akun tersimpan Anda.",
      });
      return;
    }

    const parsedAmount = Number(withdrawAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback({
        type: "error",
        text: "Silakan masukkan nominal penarikan yang valid.",
      });
      return;
    }

    if (parsedAmount < 10000) {
      setFeedback({
        type: "error",
        text: "Minimal penarikan saldo adalah Rp 10.000.",
      });
      return;
    }

    if (parsedAmount > currentBalance) {
      setFeedback({
        type: "error",
        text: `Saldo toko Anda (${formatRupiah(currentBalance)}) tidak mencukupi untuk penarikan ${formatRupiah(parsedAmount)}.`,
      });
      return;
    }

    setIsSubmittingWithdrawal(true);
    setFeedback(null);

    try {
      const res = await sellerService.requestWithdrawal(token, {
        payoutAccountId: selectedAccountId,
        amount: parsedAmount,
        notes: withdrawNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setFeedback({
          type: "success",
          text: res.message || `Penarikan saldo sebesar ${formatRupiah(parsedAmount)} berhasil diproses!`,
        });
        // Update saldo lokal dan panggil callback parent
        if (typeof res.newBalance === "number") {
          setCurrentBalance(res.newBalance);
          if (onBalanceUpdated) {
            onBalanceUpdated(res.newBalance);
          }
        }
        // Reset input form
        setWithdrawAmount("");
        setWithdrawNotes("");
        fetchData(true);
      } else {
        if (res.needAccount) {
          handleOpenAddModal("preset");
        }
        setFeedback({
          type: "error",
          text: res.message || "Gagal memproses penarikan saldo.",
        });
      }
    } catch (err) {
      console.error("[handleProcessWithdrawal] Error:", err);
      setFeedback({
        type: "error",
        text: "Gagal terhubung ke server saat memproses penarikan dana.",
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  // Salin Nomor Rekening / Wallet
  const handleCopyNumber = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Filter daftar akun
  const filteredAccounts = accounts.filter((acc) => {
    if (filterType === "bank") return acc.accountType === "bank";
    if (filterType === "wallet") return acc.accountType === "wallet";
    return true;
  });

  const bankAccountsCount = accounts.filter((a) => a.accountType === "bank").length;
  const walletAccountsCount = accounts.filter((a) => a.accountType === "wallet").length;

  // Akun terpilih saat ini untuk penarikan
  const currentTargetAccount = accounts.find((a) => a.id === selectedAccountId);

  // Perhitungan estimasi sisa saldo setelah penarikan
  const parsedWithdraw = Number(withdrawAmount) || 0;
  const estimatedRemainingBalance = Math.max(0, currentBalance - parsedWithdraw);
  const totalCompletedWithdrawn = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-sm transition-all duration-300 animate-in fade-in shadow-sm ${
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

      {/* Banner Peringatan Pembekuan Saldo Penjual */}
      {sellerProfile?.isBalanceFrozen && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-500/10 border border-rose-500/25 text-rose-900 dark:text-rose-200 shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <LockIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-200">
                  Saldo Akun Toko Sedang Dibekukan oleh Administrator
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300">
                  Status: Terkunci
                </span>
              </div>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-1 leading-relaxed">
                Alasan Pembekuan:{" "}
                <span className="font-semibold underline">
                  {sellerProfile.balanceFreezeReason || "Terjadi kecurangan transaksi / investigasi kepatuhan platform."}
                </span>
              </p>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-2">
                Seluruh fungsi penarikan dana (WD) dinonaktifkan sementara demi keamanan akun. Silakan hubungi admin NextShopID jika membutuhkan klarifikasi lebih lanjut.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SHOWCASE: KARTU DOMPET SALDO EKSEKUTIF (FINTECH WALLET CARD) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#09101d] via-[#0f172a] to-[#062c26] border border-emerald-500/25 p-6 sm:p-8 text-white shadow-xl">
        {/* Dekorasi Ambient Glow di Latar Belakang */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-36 -bottom-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Sisi Kiri: Saldo Utama Toko */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              {sellerProfile?.isBalanceFrozen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                  <LockIcon size={12} className="text-rose-400" />
                  Saldo Dibekukan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Saldo Siap Ditarik
                </span>
              )}
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Toko {sellerProfile?.name || "Mitra"} • Realtime
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                {formatRupiah(currentBalance)}
              </span>
            </div>

            <p className="text-xs text-slate-300/80 max-w-md">
              {currentBalance > 0
                ? "Dana hasil penjualan bersih siap dicairkan langsung ke rekening bank atau dompet digital Anda."
                : "Saldo toko Anda saat ini kosong. Saldo akan bertambah otomatis saat pesanan selesai."}
            </p>
          </div>

          {/* Sisi Kanan: Action Buttons & Quick Stats Strip */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-xs font-semibold text-white backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
                title="Perbarui data saldo"
              >
                <RefreshIcon size={14} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
                <span>{isRefreshing ? "Menyegarkan..." : "Segarkan"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal("preset")}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-emerald-950/40 hover:shadow-emerald-500/25 border border-emerald-400/30 transition-all duration-200 cursor-pointer"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform">
                  <PlusIcon size={12} className="stroke-[2.5]" />
                </span>
                <span className="tracking-wide">Tambah Akun</span>
              </button>
            </div>

            {/* Quick Micro Stats */}
            <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-300/90 font-medium">
              <div className="flex items-center gap-1.5">
                <CreditCardIcon size={14} className="text-blue-400" />
                <span>{accounts.length} Akun Tersimpan</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <TrendingUpIcon size={14} className="text-emerald-400" />
                <span>{formatRupiah(totalCompletedWithdrawn)} Ditarik</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEGMENTED NAVIGATION PILLS (SWITCHER VIEW MODERN) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("withdraw")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "withdraw"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <WalletIcon size={15} />
            <span>Tarik Saldo Toko</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("accounts")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "accounts"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CreditCardIcon size={15} />
            <span>Rekening & Wallet</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "accounts"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
              }`}
            >
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ClockIcon size={15} />
            <span>Riwayat WD</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "history"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
              }`}
            >
              {withdrawals.length}
            </span>
          </button>
        </div>

        {/* Info Label Aktif */}
        <div className="text-xs text-slate-400">
          {activeTab === "withdraw" && "Formulir pencairan dana cepat ke rekening terdaftar."}
          {activeTab === "accounts" && `Menampilkan ${accounts.length} rekening bank & akun dompet digital.`}
          {activeTab === "history" && `Audit log dari ${withdrawals.length} transaksi penarikan saldo.`}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: FORMULIR PENARIKAN SALDO (WITHDRAWAL CONSOLE & LIVE RECEIPT) */}
      {/* ========================================================================= */}
      {activeTab === "withdraw" && (
        <div className="space-y-6">
          {accounts.length === 0 ? (
            /* KONDISI JIKA BELUM ADA AKUN: TAMPILAN EMPTY STATE PREMIUM */
            <div className="rounded-3xl border border-dashed border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.04] to-transparent p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                <CreditCardIcon size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Belum Ada Akun Rekening atau E-Wallet Terhubung
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Sebelum melakukan penarikan saldo toko, silakan simpan minimal satu nomor rekening bank (BCA, Mandiri, BRI, BNI) atau akun dompet digital (GoPay, OVO, DANA) Anda.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal("preset")}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:shadow-emerald-500/25 border border-emerald-400/30 transition-all duration-200 cursor-pointer"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform">
                    <PlusIcon size={14} className="stroke-[2.5]" />
                  </span>
                  <span className="tracking-wide">Hubungkan Akun Penarikan Sekarang</span>
                </button>
              </div>

              {/* 3 Keuntungan Finansial */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200/80 dark:border-white/10 text-left text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    ✓ Bebas Biaya Admin
                  </div>
                  <p className="text-[11px] text-slate-400">Pencairan dana gratis tanpa potongan biaya transaksi.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    ✓ Proses Cepat
                  </div>
                  <p className="text-[11px] text-slate-400">Dana diproses langsung secara realtime ke akun tujuan.</p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    ✓ Keamanan Terjamin
                  </div>
                  <p className="text-[11px] text-slate-400">Enkripsi data nomor rekening dan audit trail lengkap.</p>
                </div>
              </div>
            </div>
          ) : (
            /* KONDISI SUDAH ADA AKUN: 2-KOLOM (FORM PENARIKAN + STRUK DIGITAL) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* KOLOM KIRI (7 KANVAS): FORMULIR INTERAKTIF PENARIKAN SALDO */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. SELEKTOR VISUAL KARTU REKENING TUJUAN (BUKAN DROPDOWN KAKU) */}
                <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                          1
                        </span>
                        Pilih Rekening / E-Wallet Tujuan
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tentukan akun tujuan pencairan dari daftar yang telah Anda simpan
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddModal("preset")}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-all cursor-pointer"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                        <PlusIcon size={11} className="stroke-[2.5]" />
                      </span>
                      <span>Tambah Akun Baru</span>
                    </button>
                  </div>

                  {/* Grid Tile Kartu Akun yang Bisa Dipilih */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accounts.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      const style = getProviderStyle(acc.providerName, acc.accountType);

                      return (
                        <div
                          key={acc.id}
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`relative p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                              : "bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${style.badge} border`}
                              >
                                {acc.accountType === "bank" ? "Bank" : "Wallet"}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                {acc.providerName}
                              </h4>
                            </div>

                            {/* Radio Circle Indicator */}
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-slate-300 dark:border-slate-600 bg-transparent"
                              }`}
                            >
                              {isSelected && <CheckIcon size={10} />}
                            </div>
                          </div>

                          <div className="font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-white mb-1">
                            {formatCardNumber(acc.accountNumber)}
                          </div>

                          <div className="text-[11px] text-slate-400 truncate">
                            a.n <span className="font-semibold text-slate-700 dark:text-slate-300">{acc.accountHolderName}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Tile Shortcut Tambah Akun Baru */}
                    <div
                      onClick={() => handleOpenAddModal("preset")}
                      className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-slate-50/40 dark:bg-white/[0.01] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[92px] group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 transition-all group-hover:scale-110 shadow-2xs">
                        <PlusIcon size={16} className="stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Tambah Rekening / Wallet
                      </span>
                      <span className="text-[10px] text-slate-400">Hubungkan akun baru</span>
                    </div>
                  </div>
                </div>

                {/* 2. INPUT NOMINAL PENARIKAN (MODERN CURRENCY FIELD DENGAN QUICK CHIPS) */}
                <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                          2
                        </span>
                        Berapa yang Mau Ditarik?
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Minimal penarikan Rp 10.000 • Bebas biaya admin
                      </p>
                    </div>

                    <span className="text-xs text-slate-400">
                      Saldo: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(currentBalance)}</strong>
                    </span>
                  </div>

                  {/* Input Besar Gaya Modern Fintech */}
                  <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 p-4 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Nominal Saldo Penarikan</span>
                      {parsedWithdraw > currentBalance && (
                        <span className="text-red-500 font-bold">Saldo Tidak Mencukupi</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-slate-400 select-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={withdrawAmount ? Number(withdrawAmount).toLocaleString("id-ID") : ""}
                        onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
                        placeholder="0"
                        className="w-full bg-transparent text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none"
                      />
                      {withdrawAmount && (
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount("")}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
                        >
                          <CloseIcon size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Chips Presets */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[50000, 100000, 250000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(String(amt))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                      >
                        +{amt >= 1000 ? `${amt / 1000}rb` : amt}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(Math.floor(currentBalance * 0.5)))}
                      disabled={currentBalance < 10000}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      50% Saldo
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(currentBalance))}
                      disabled={currentBalance < 10000}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                    >
                      Tarik Semua (100%)
                    </button>
                  </div>
                </div>

                {/* 3. CATATAN PENARIKAN (OPSIONAL) */}
                <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-black">
                      3
                    </span>
                    Catatan Penarikan (Opsional)
                  </h3>
                  <input
                    type="text"
                    value={withdrawNotes}
                    onChange={(e) => setWithdrawNotes(e.target.value)}
                    placeholder="Contoh: Pencairan hasil penjualan akhir pekan"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* KOLOM KANAN (5 KANVAS): STRUK DIGITAL LIVE RECEIPT SUMMARY */}
              <div className="lg:col-span-5 sticky top-20">
                <form
                  onSubmit={handleProcessWithdrawal}
                  className="rounded-3xl bg-gradient-to-b from-[#0f172a] via-[#111c30] to-[#091120] text-white p-6 sm:p-7 shadow-xl border border-slate-800 dark:border-white/10 space-y-6 relative overflow-hidden"
                >
                  {/* Subtle Top Ambient Glow */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Struk */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <WalletIcon size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Ringkasan Pencairan</h4>
                        <p className="text-[11px] text-slate-400">Verifikasi rincian transaksi Anda</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                      Draft Realtime
                    </span>
                  </div>

                  {/* Rincian Akun Tujuan */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Akun Tujuan Penerima:
                    </span>
                    {currentTargetAccount ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">
                            {currentTargetAccount.providerName}
                          </div>
                          <div className="font-mono text-xs text-slate-300">
                            {currentTargetAccount.accountNumber}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            a.n {currentTargetAccount.accountHolderName}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {currentTargetAccount.accountType === "bank" ? "Bank" : "Wallet"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-300/90 italic">
                        Belum memilih akun tujuan
                      </p>
                    )}
                  </div>

                  {/* Garis Potong Receipt Struk */}
                  <div className="border-t-2 border-dashed border-white/10 relative my-2">
                    <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-[#f8fafc] dark:bg-[#070b14]" />
                    <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-[#f8fafc] dark:bg-[#070b14]" />
                  </div>

                  {/* Breakdown Biaya & Saldo */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Nominal Penarikan:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {formatRupiah(parsedWithdraw)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Biaya Transfer Platform:</span>
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Gratis (Rp 0)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span>Estimasi Sisa Saldo:</span>
                      <span
                        className={`font-mono font-bold ${
                          parsedWithdraw > currentBalance ? "text-red-400 font-extrabold" : "text-slate-300"
                        }`}
                      >
                        {parsedWithdraw > currentBalance
                          ? "Tidak Mencukupi"
                          : formatRupiah(estimatedRemainingBalance)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Total Dana Diterima:</span>
                      <span className="text-xl font-black font-mono text-emerald-400">
                        {formatRupiah(parsedWithdraw)}
                      </span>
                    </div>
                  </div>

                  {/* Badge Jaminan Keamanan */}
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-300">
                    <ShieldIcon size={16} className="text-emerald-400 shrink-0" />
                    <span>Transaksi dilindungi audit trail sistem dan enkripsi berlapis.</span>
                  </div>

                  {/* Tombol Eksekusi Penarikan Saldo */}
                  <button
                    type="submit"
                    disabled={
                      isSubmittingWithdrawal ||
                      Boolean(sellerProfile?.isBalanceFrozen) ||
                      parsedWithdraw <= 0 ||
                      parsedWithdraw < 10000 ||
                      parsedWithdraw > currentBalance ||
                      !selectedAccountId
                    }
                    className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                      sellerProfile?.isBalanceFrozen
                        ? "bg-rose-600 text-white shadow-rose-950/20"
                        : "bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 shadow-emerald-500/20"
                    }`}
                  >
                    {sellerProfile?.isBalanceFrozen ? (
                      <>
                        <LockIcon size={16} />
                        <span>Saldo Toko Sedang Dibekukan Admin</span>
                      </>
                    ) : isSubmittingWithdrawal ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Memproses Pencairan Dana...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon size={18} />
                        <span>Konfirmasi & Cairkan Saldo</span>
                        <ArrowRightIcon size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3 TRANSAKSI TERAKHIR STRIP (DI BAWAH FORM AGAR SELLER LANGSUNG LIHAT HISTORI CEPAT) */}
          {withdrawals.length > 0 && (
            <div className="mt-8 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <ClockIcon size={16} className="text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3 Penarikan Saldo Terakhir
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Lihat Semua Riwayat ({withdrawals.length}) →
                </button>
              </div>

              <div className="space-y-2.5">
                {withdrawals.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {w.accountType === "bank" ? <CreditCardIcon size={16} /> : <WalletIcon size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {w.providerName} - {w.accountNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDateTime(w.createdAt)} • a.n {w.accountHolderName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        -{formatRupiah(w.amount)}
                      </div>
                      {w.status === "completed" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckIcon size={11} /> Berhasil Ditransfer
                        </span>
                      )}
                      {w.status === "pending" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <ClockIcon size={11} /> Sedang Ditinjau Admin
                        </span>
                      )}
                      {w.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <AlertCircleIcon size={11} /> Ditolak (Saldo Kembali)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: REKENING & DOMPET DIGITAL TERSIMPAN (VIRTUAL CARDS SHOWCASE) */}
      {/* ========================================================================= */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Daftar Akun Penarikan Tersimpan ({accounts.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola kartu rekening bank dan akun e-wallet Anda untuk pencairan dana
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterType === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Semua ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("bank")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterType === "bank"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Bank ({bankAccountsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("wallet")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filterType === "wallet"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  E-Wallet ({walletAccountsCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddModal("preset")}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-emerald-950/20 hover:shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/30 transition-all duration-200 cursor-pointer"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform">
                  <PlusIcon size={12} className="stroke-[2.5]" />
                </span>
                <span className="tracking-wide">Tambah Akun</span>
              </button>
            </div>
          </div>

          {/* GRID KARTU FINANSIAL REALISTIK */}
          {filteredAccounts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-3">
                <CreditCardIcon size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak Ada Akun Ditemukan
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Belum ada rekening atau akun wallet yang cocok dengan filter. Tambahkan akun baru sekarang.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map((account) => {
                const isBank = account.accountType === "bank";
                const isSelected = selectedAccountId === account.id;
                const isCopied = copiedId === account.id;
                const style = getProviderStyle(account.providerName, account.accountType);

                return (
                  <div
                    key={account.id}
                    className="flex flex-col justify-between rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    }}
                  >
                    {/* Background Gradient Sesuai Brand Bank */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-95 group-hover:opacity-100 transition-opacity`}
                    />
                    
                    {/* Subtle Sheen Decor */}
                    <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                      {/* Baris Atas Kartu: Chip & Brand */}
                      <div className="flex items-center justify-between">
                        {/* Chip Debit Card Visual */}
                        <div className="flex items-center gap-2">
                          {isBank ? (
                            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-300/60 p-0.5 flex items-center justify-center shadow-xs">
                              <div className="w-full h-full border border-black/20 rounded-[2px]" />
                            </div>
                          ) : (
                            <div className="w-9 h-7 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                              <WalletIcon size={15} />
                            </div>
                          )}

                          {/* Contactless Waves SVG */}
                          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 010-7.778m3.536 10.606a10.5 10.5 0 000-14.85" />
                          </svg>
                        </div>

                        {/* Brand Name & Type Pill */}
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${style.badge} border backdrop-blur-md`}>
                            {isBank ? "Bank Transfer" : "E-Wallet"}
                          </span>
                          <h4 className="text-sm font-extrabold text-white mt-1 drop-shadow-xs">
                            {account.providerName}
                          </h4>
                        </div>
                      </div>

                      {/* Baris Tengah: Nomor Rekening / Nomor Wallet */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                          {isBank ? "Nomor Rekening" : "Nomor Dompet"}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white drop-shadow-sm">
                            {formatCardNumber(account.accountNumber)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyNumber(account.id, account.accountNumber)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            title="Salin nomor"
                          >
                            {isCopied ? <CheckIcon size={14} className="text-emerald-400" /> : <CopyIcon size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Baris Bawah: Pemilik Akun & Aksi Cepat */}
                      <div className="pt-3 border-t border-white/15 flex items-end justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-white/60">
                            Nama Pemilik
                          </span>
                          <p className="text-xs font-bold uppercase tracking-wide text-white truncate max-w-[170px]">
                            {account.accountHolderName}
                          </p>
                        </div>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => setAccountToDelete(account)}
                          className="p-1.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                          title="Hapus akun"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>

                      {/* Tombol Gunakan untuk Penarikan */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setActiveTab("withdraw");
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                            : "bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm"
                        }`}
                      >
                        <WalletIcon size={14} />
                        <span>{isSelected ? "✓ Terpilih di Penarikan" : "Tarik Dana ke Sini"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Slot Tambah Akun Baru (Dashed Card) */}
              <div
                onClick={() => handleOpenAddModal("preset")}
                className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-emerald-500 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group min-h-[260px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 transition-all group-hover:scale-110 shadow-xs">
                  <PlusIcon size={26} className="stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Hubungkan Akun Baru
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Simpan rekening bank atau dompet digital untuk opsi penarikan berikutnya
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: RIWAYAT TRANSAKSI PENARIKAN (AUDIT TRAIL LOG REALTIME) */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <ClockIcon size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Audit Trail & Riwayat Penarikan Dana
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan transaksi pencairan saldo toko ke rekening bank dan dompet digital
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Total Transaksi: <strong className="text-slate-800 dark:text-slate-200">{withdrawals.length}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400">
                Akumulasi: <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(totalCompletedWithdrawn)}</strong>
              </span>
            </div>
          </div>

          {withdrawals.length === 0 ? (
            <div className="py-14 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-3">
                <ClockIcon size={26} />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Belum Ada Riwayat Penarikan Saldo
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Saat Anda mencairkan saldo melalui tab &ldquo;Tarik Saldo Toko&rdquo;, mutasi transaksi akan tercatat secara realtime di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">Waktu Transaksi</th>
                    <th scope="col" className="px-4 py-3.5">Tujuan Penarikan</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Nominal Saldo</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Biaya Transfer</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                    <th scope="col" className="px-4 py-3.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {withdrawals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {item.accountType === "bank" ? <CreditCardIcon size={14} /> : <WalletIcon size={14} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.providerName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {item.accountNumber} • a.n {item.accountHolderName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        -{formatRupiah(item.amount)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          Gratis (Rp 0)
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {item.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckIcon size={11} /> Berhasil Ditransfer
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <ClockIcon size={11} /> Menunggu Persetujuan
                          </span>
                        )}
                        {item.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertCircleIcon size={11} /> Ditolak Admin
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs max-w-[280px]">
                        {item.status === "completed" && (
                          <div className="space-y-0.5">
                            <p className="text-emerald-700 dark:text-emerald-300 font-medium text-[11px] leading-relaxed">
                              {item.adminNotes || "Transaksi telah berhasil, silakan periksa mutasi rekening/dompet digital Anda."}
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-slate-400 truncate">
                                Catatan toko: {item.notes}
                              </p>
                            )}
                          </div>
                        )}
                        {item.status === "rejected" && (
                          <div className="space-y-0.5">
                            <p className="text-rose-600 dark:text-rose-400 font-medium text-[11px] leading-relaxed">
                              Alasan: {item.rejectionReason || "Penarikan ditolak admin."}
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ Dana {formatRupiah(item.amount)} telah dikembalikan ke saldo toko
                            </span>
                          </div>
                        )}
                        {item.status === "pending" && (
                          <span className="text-[11px] text-slate-400 italic">
                            {item.notes ? `Catatan: ${item.notes} • Menunggu verifikasi admin` : "Menunggu verifikasi admin"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL TAMBAH AKUN BARU (PRESET / PILIHAN POPULER & INPUT MANUAL) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <PlusIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hubungkan Akun Penarikan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rekening bank atau dompet digital tujuan transfer dana
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Tab Pilihan Metode Penambahan */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setAddMode("preset")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  addMode === "preset"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Pilihan Populer (Preset)
              </button>

              <button
                type="button"
                onClick={() => setAddMode("manual")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  addMode === "manual"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Tambah Manual
              </button>
            </div>

            {/* FORM METODE 1: PRESET POPULER */}
            {addMode === "preset" ? (
              <form onSubmit={handleSubmitAccount} className="space-y-4">
                {/* Jenis Akun: Bank / Wallet */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Akun
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPresetType("bank");
                        setPresetProvider(PRESET_BANKS[0].name);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        presetType === "bank"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <CreditCardIcon size={14} />
                      <span>Rekening Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPresetType("wallet");
                        setPresetProvider(PRESET_WALLETS[0].name);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        presetType === "wallet"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <WalletIcon size={14} />
                      <span>Dompet Digital (E-Wallet)</span>
                    </button>
                  </div>
                </div>

                {/* Dropdown Provider */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama {presetType === "bank" ? "Bank" : "Dompet Digital"}
                  </label>
                  <select
                    value={presetProvider}
                    onChange={(e) => setPresetProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {presetType === "bank"
                      ? PRESET_BANKS.map((b) => (
                          <option key={b.id} value={b.name} className="dark:bg-slate-900">
                            {b.name}
                          </option>
                        ))
                      : PRESET_WALLETS.map((w) => (
                          <option key={w.id} value={w.name} className="dark:bg-slate-900">
                            {w.name}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Nomor Rekening / Wallet (HANYA ANGKA) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {presetType === "bank" ? "Nomor Rekening Bank" : "Nomor E-Wallet / Handphone"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={presetNumber}
                    onChange={(e) => setPresetNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder={presetType === "bank" ? "Contoh: 8821990112" : "Contoh: 081234567890"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Wajib hanya berisi angka (0-9) tanpa spasi atau tanda hubung.
                  </p>
                </div>

                {/* Nama Pemilik Akun */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap Pemilik Rekening / Akun
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={presetHolderName}
                    onChange={(e) => setPresetHolderName(e.target.value)}
                    placeholder="Contoh: Toko Mitra Official"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingAccount || !presetNumber || !presetHolderName}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAccount ? "Menyimpan..." : "Simpan Akun"}
                  </button>
                </div>
              </form>
            ) : (
              /* FORM METODE 2: TAMBAH MANUAL */
              <form onSubmit={handleSubmitAccount} className="space-y-4">
                {/* 1. Ditanya Jenis: Bank atau Wallet */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    1. Jenis Akun Tujuan Penarikan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualType("bank")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        manualType === "bank"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <CreditCardIcon size={14} />
                      <span>Rekening Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualType("wallet")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        manualType === "wallet"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <WalletIcon size={14} />
                      <span>Dompet Digital (Wallet)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Ditanya Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. Nama Lengkap Pemilik
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualHolderName}
                    onChange={(e) => setManualHolderName(e.target.value)}
                    placeholder="Masukkan nama lengkap pemilik..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. Nomor Rekening atau Nomor Wallet (HANYA ANGKA) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    3. {manualType === "bank" ? "Nomor Rekening Bank" : "Nomor Akun E-Wallet"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder={manualType === "bank" ? "Masukkan nomor rekening..." : "Masukkan nomor handphone/wallet..."}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Wajib hanya berisi angka (0-9) tanpa huruf atau simbol.
                  </p>
                </div>

                {/* 4. Nama Bank atau Wallet Diketik Manual */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    4. Nama {manualType === "bank" ? "Bank" : "Dompet Digital"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualProviderName}
                    onChange={(e) => setManualProviderName(e.target.value)}
                    placeholder={manualType === "bank" ? "Contoh: Bank Jago / SeaBank / BSI" : "Contoh: OVO / DANA / Flip"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 5. Tanda Persetujuan Keabsahan Data */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualIsAgreed}
                      onChange={(e) => setManualIsAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed select-none">
                      Saya menyatakan dan mengakui bahwa data akun {manualType === "bank" ? "rekening" : "e-wallet"} di atas adalah sah, aktif, dan benar milik saya untuk keperluan pencairan saldo penjualan toko.
                    </span>
                  </label>
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingAccount || !manualIsAgreed || !manualNumber || !manualProviderName || !manualHolderName}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAccount ? "Menyimpan..." : "Simpan & Konfirmasi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL KONFIRMASI HAPUS AKUN */}
      {/* ========================================================================= */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <TrashIcon size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Akun Penarikan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus akun <strong>{accountToDelete.providerName}</strong> ({accountToDelete.accountNumber}) a.n <strong>{accountToDelete.accountHolderName}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

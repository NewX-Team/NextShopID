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
  ShieldIcon,
  ClockIcon,
} from "@/components/ui/icons";
import {
  sellerService,
  SellerPayoutAccount,
  SellerProfile,
  PayoutAccountType,
  PayoutMethod,
} from "@/services/seller.service";

interface PenjualPayoutAccountsViewProps {
  sellerProfile?: SellerProfile;
  token?: string;
}

interface FeedbackState {
  type: "success" | "error";
  text: string;
}

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

export const PenjualPayoutAccountsView: React.FC<PenjualPayoutAccountsViewProps> = ({
  sellerProfile,
  token,
}) => {
  // State data akun tersimpan
  const [accounts, setAccounts] = useState<SellerPayoutAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Filter tampilan kartu akun
  const [filterType, setFilterType] = useState<"all" | "bank" | "wallet">("all");

  // State Modal Tambah Akun
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<PayoutMethod>("preset");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State: Metode 1 (Pilihan Cepat / Preset)
  const [presetType, setPresetType] = useState<PayoutAccountType>("bank");
  const [presetProvider, setPresetProvider] = useState<string>(PRESET_BANKS[0].name);
  const [presetNumber, setPresetNumber] = useState<string>("");
  const [presetHolderName, setPresetHolderName] = useState<string>("");

  // Form State: Metode 2 (Tambah Manual)
  // Ditanya paling atas jenisnya apa (bank/wallet)
  const [manualType, setManualType] = useState<PayoutAccountType>("bank");
  // Terus ditanya nama lengkapnya
  const [manualHolderName, setManualHolderName] = useState<string>("");
  // Kalau bank -> no rek, kalau wallet -> no wallet
  const [manualNumber, setManualNumber] = useState<string>("");
  // Di akhir nama bank atau wallet diketik manual
  const [manualProviderName, setManualProviderName] = useState<string>("");
  // Tanda persetujuan keabsahan data
  const [manualIsAgreed, setManualIsAgreed] = useState<boolean>(false);

  // State Modal Hapus Akun
  const [accountToDelete, setAccountToDelete] = useState<SellerPayoutAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // State Modal Info Tarik Saldo
  const [selectedAccountForWd, setSelectedAccountForWd] = useState<SellerPayoutAccount | null>(null);

  // Format Rupiah
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Format Tanggal
  const formatDate = (isoString?: string): string => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Fetch daftar akun dari backend realtime
  const fetchAccounts = useCallback(
    async (isBackground = false) => {
      if (!token) return;
      if (!isBackground) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await sellerService.getPayoutAccounts(token);
        if (res.success && Array.isArray(res.data)) {
          setAccounts(res.data);
        } else {
          setFeedback({
            type: "error",
            text: res.message || "Gagal memuat daftar rekening/wallet.",
          });
        }
      } catch (err) {
        console.error("[PenjualPayoutAccountsView] Error fetching accounts:", err);
        setFeedback({
          type: "error",
          text: "Terjadi gangguan saat memuat data dari server.",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handler Buka Modal Tambah
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

  // Handler Submit Tambah Akun
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
          text: `${presetType === "bank" ? "Nomor rekening" : "Nomor e-wallet"} wajib hanya menggunakan angka (0-9) dan tidak bisa huruf atau karakter lain.`,
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
          text: "Nama lengkap pemilik akun wajib diisi (bebas huruf dan angka).",
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
          text: `${manualType === "bank" ? "Nomor rekening bank" : "Nomor akun e-wallet"} wajib hanya menggunakan angka (0-9) dan tidak bisa huruf atau karakter lain.`,
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

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await sellerService.addPayoutAccount(token, payload);
      if (res.success && res.data) {
        setFeedback({
          type: "success",
          text: res.message || "Akun penarikan berhasil disimpan ke sistem.",
        });
        setIsModalOpen(false);
        fetchAccounts(true);
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
        text: "Terjadi kesalahan pada server saat menyimpan data.",
      });
    } finally {
      setIsSubmitting(false);
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
        setAccountToDelete(null);
        fetchAccounts(true);
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

  // Handler Salin Nomor Rekening / Wallet
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

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
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

      {/* Header Halaman Saldo & Penarikan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <WalletIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Saldo & Penarikan Dana (WD)
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Kelola rekening bank dan dompet digital tersimpan untuk keperluan pencairan hasil penjualan toko.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Header */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchAccounts(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            title="Segarkan data rekening"
          >
            <RefreshIcon size={15} className={isRefreshing ? "animate-spin text-emerald-500" : ""} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal("preset")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <PlusIcon size={16} />
            <span>Tambah Akun Bank / Wallet</span>
          </button>
        </div>
      </div>

      {/* 3 Kartu Ringkasan Finansial Toko */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Siap Ditarik */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Saldo Siap Ditarik
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <WalletIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatRupiah(sellerProfile?.balance || 0)}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {sellerProfile && sellerProfile.balance > 0
                ? "Dana siap dicairkan ke rekening tersimpan"
                : "Belum ada saldo pendapatan penjualan"}
            </p>
          </div>
        </div>

        {/* Total Akun Terdaftar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Akun Penarikan Terdaftar
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <CreditCardIcon size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {accounts.length} <span className="text-sm font-normal text-slate-400">Akun</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {bankAccountsCount} Bank Transfer • {walletAccountsCount} Dompet Digital
            </p>
          </div>
        </div>

        {/* Status Sistem Penarikan */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Status Sistem Penarikan
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
              <ShieldIcon size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Tahap Konfigurasi Akun WD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Data rekening/wallet disimpan aman untuk pencairan
            </p>
          </div>
        </div>
      </div>

      {/* Section Utama: Daftar Akun Bank & Wallet Penarikan */}
      <div className="rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Akun Bank & E-Wallet Penarikan Tersimpan
            </h2>
            <p className="text-xs text-slate-400">
              Data yang Anda daftarkan di sini akan dijadikan tujuan pencairan dana (WD).
            </p>
          </div>

          {/* Filter Tab Kategori */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Semua ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("bank")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "bank"
                  ? "bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Rekening Bank ({bankAccountsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("wallet")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "wallet"
                  ? "bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              E-Wallet ({walletAccountsCount})
            </button>
          </div>
        </div>

        {/* Konten Grid Kartu Akun */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-3 border-emerald-500 border-t-transparent mb-3" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Memuat data akun penarikan tersimpan...
            </p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          /* Empty State Beranda Penarikan Saldo */
          <div className="py-14 px-4 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 mb-4 shadow-xs">
              <CreditCardIcon size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {filterType === "all"
                ? "Belum Ada Akun Rekening atau E-Wallet Tersimpan"
                : filterType === "bank"
                ? "Belum Ada Rekening Bank Tersimpan"
                : "Belum Ada Akun E-Wallet Tersimpan"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Tambahkan akun rekening bank atau dompet digital Anda untuk memproses penarikan saldo (WD) pendapatan toko dengan aman.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenAddModal("preset")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <PlusIcon size={16} />
                <span>Pilih Bank / Wallet Populer</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal("manual")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>+ Tambah Manual (Kustom)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grid Kartu Akun yang Sudah Terdaftar */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => {
              const isBank = account.accountType === "bank";
              const isCopied = copiedId === account.id;

              return (
                <div
                  key={account.id}
                  className="p-5 rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-2xs group relative"
                >
                  <div className="space-y-4">
                    {/* Header Kartu: Badge Tipe & Provider */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2.5 rounded-2xl ${
                            isBank
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60"
                              : "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60"
                          }`}
                        >
                          {isBank ? <CreditCardIcon size={20} /> : <WalletIcon size={20} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {account.providerName}
                          </h4>
                          <span
                            className={`inline-block text-[10px] font-semibold mt-0.5 px-2 py-0.5 rounded-md ${
                              isBank
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                            }`}
                          >
                            {isBank ? "Rekening Bank" : "Dompet Digital (E-Wallet)"}
                          </span>
                        </div>
                      </div>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => setAccountToDelete(account)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Hapus akun ini"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    {/* Nomor Rekening / Wallet dengan Tombol Salin */}
                    <div className="p-3 rounded-2xl bg-white dark:bg-black/20 border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {isBank ? "Nomor Rekening" : "Nomor Akun / HP"}
                        </div>
                        <div className="font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-white">
                          {account.accountNumber}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber(account.id, account.accountNumber)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                        title="Salin nomor"
                      >
                        {isCopied ? (
                          <>
                            <CheckIcon size={13} className="text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Disalin</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon size={13} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Informasi Atas Nama */}
                    <div className="text-xs space-y-1">
                      <div className="text-slate-400 text-[11px]">Atas Nama (Pemilik):</div>
                      <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {account.accountHolderName}
                      </div>
                    </div>
                  </div>

                  {/* Footer Kartu Akun */}
                  <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                    <div>
                      {account.method === "manual" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckIcon size={11} />
                          Manual Sah
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Preset Populer</span>
                      )}
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        • {formatDate(account.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAccountForWd(account)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      Tarik Saldo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Tambah Akun Bank / E-Wallet (Dengan 2 Fitur Sesuai Permintaan) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  <CreditCardIcon size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Simpan Akun Penarikan Saldo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih bank/wallet yang telah tersedia atau tambahkan secara manual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Switcher Tab 2 Fitur: Pilihan Preset vs Tambah Manual */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/10">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-200/80 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setAddMode("preset")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    addMode === "preset"
                      ? "bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  1. Pilihan Populer (Preset)
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("manual")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    addMode === "manual"
                      ? "bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  2. Tambah Manual (Kustom)
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitAccount} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* === FITUR 1: PILIHAN POPULER (PRESET) === */}
              {addMode === "preset" ? (
                <>
                  {/* Pilihan Jenis Preset: Bank vs Wallet */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Pilih Jenis Akun
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPresetType("bank");
                          setPresetProvider(PRESET_BANKS[0].name);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          presetType === "bank"
                            ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <CreditCardIcon size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Rekening Bank</div>
                          <div className="text-[10px] text-slate-400">BCA, Mandiri, BRI, BNI...</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPresetType("wallet");
                          setPresetProvider(PRESET_WALLETS[0].name);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          presetType === "wallet"
                            ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <WalletIcon size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Dompet Digital</div>
                          <div className="text-[10px] text-slate-400">GoPay, OVO, DANA, ShopeePay...</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Pilihan Nama Bank atau E-Wallet */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {presetType === "bank" ? "Nama Bank" : "Nama Dompet Digital (E-Wallet)"}
                    </label>
                    <select
                      value={presetProvider}
                      onChange={(e) => setPresetProvider(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {presetType === "bank"
                        ? PRESET_BANKS.map((b) => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))
                        : PRESET_WALLETS.map((w) => (
                            <option key={w.id} value={w.name}>
                              {w.name}
                            </option>
                          ))}
                    </select>
                  </div>

                  {/* Input Nomor Rekening atau Nomor E-Wallet */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {presetType === "bank" ? "Nomor Rekening Bank" : "Nomor E-Wallet (No. Handphone)"}
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Wajib Angka (0-9)
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={presetNumber}
                      onChange={(e) => setPresetNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder={
                        presetType === "bank"
                          ? "Contoh: 1234567890 (Hanya angka)"
                          : "Contoh: 081234567890 (Hanya angka)"
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Ketikkan hanya digit angka. Huruf dan simbol otomatis tidak dapat dimasukkan.
                    </p>
                  </div>

                  {/* Input Nama Lengkap Rekening / Wallet */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {presetType === "bank"
                          ? "Nama Lengkap Pemilik Rekening"
                          : "Nama Lengkap Akun Dompet Digital"}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Bebas Huruf & Angka
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={presetHolderName}
                      onChange={(e) => setPresetHolderName(e.target.value)}
                      placeholder="Masukkan nama lengkap sesuai buku tabungan / profil wallet"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              ) : (
                /* === FITUR 2: TAMBAH MANUAL (KUSTOM) SESUAI DESKRIPSI PENGGUNA === */
                <>
                  {/* 1. Ditanya paling atas jenisnya apa: bank atau wallet */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      1. Pilih Jenis Akun
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setManualType("bank")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          manualType === "bank"
                            ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs"
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <CreditCardIcon size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Rekening Bank</div>
                          <div className="text-[10px] text-slate-400">Bank umum & daerah</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualType("wallet")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          manualType === "wallet"
                            ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                            : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <WalletIcon size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Dompet Digital</div>
                          <div className="text-[10px] text-slate-400">E-Wallet kustom</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Terus ditanya nama lengkapnya */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        2. Nama Lengkap Pemilik
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Bebas Huruf & Angka
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={manualHolderName}
                      onChange={(e) => setManualHolderName(e.target.value)}
                      placeholder="Masukkan nama lengkap pemilik sah..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 3. Kalau bank ditanya no rek, kalau wallet ditanya no wallet (Wajib Angka) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {manualType === "bank"
                          ? "3. Nomor Rekening Bank"
                          : "3. Nomor Akun E-Wallet / Handphone"}
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Wajib Angka (0-9)
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={manualNumber}
                      onChange={(e) => setManualNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder={
                        manualType === "bank"
                          ? "Masukkan nomor rekening bank (hanya angka)..."
                          : "Masukkan nomor akun / HP e-wallet (hanya angka)..."
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Wajib menggunakan angka (0-9). Huruf dan simbol otomatis tidak dapat diketik.
                    </p>
                  </div>

                  {/* 4. Di akhir nama bank atau wallet diketik manual */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {manualType === "bank"
                          ? "4. Nama Bank (Ketik Manual)"
                          : "4. Nama E-Wallet (Ketik Manual)"}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Bebas Huruf & Angka
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={manualProviderName}
                      onChange={(e) => setManualProviderName(e.target.value)}
                      placeholder={
                        manualType === "bank"
                          ? "Contoh: Bank Jago, SeaBank, Bank Neo Commerce, dll."
                          : "Contoh: PayPal, DOKU, KasPro, Flip, dll."
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 5. Tanda yang menyatakan menyetujui dan mengakui datanya sah */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualIsAgreed}
                        onChange={(e) => setManualIsAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed select-none">
                        <strong>Pernyataan Keabsahan:</strong> Saya menyatakan dan mengakui dengan sadar bahwa seluruh data rekening/wallet yang saya ketikkan adalah sah, benar atas nama saya sendiri, dan bertanggung jawab penuh untuk proses penarikan saldo penjualan toko.
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (addMode === "manual" && !manualIsAgreed)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon size={16} />
                      <span>{addMode === "manual" ? "Simpan & Sahkan Akun" : "Simpan Akun Penarikan"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Dialog Informasi Penarikan Saldo (WD) */}
      {selectedAccountForWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <WalletIcon size={26} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pencairan Dana (Withdrawal)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tujuan Penarikan:{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedAccountForWd.providerName} - {selectedAccountForWd.accountNumber}
                </span>{" "}
                (a.n {selectedAccountForWd.accountHolderName})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Saldo Toko Tersedia:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatRupiah(sellerProfile?.balance || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Status Rekening:</span>
                <span className="font-bold text-slate-900 dark:text-white">Tervalidasi & Sah</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left">
              <div className="flex items-start gap-2">
                <ClockIcon size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Informasi Sistem:</strong> Fitur eksekusi transfer dana saat ini dalam tahap persiapan. Akun bank/wallet Anda telah tersimpan dan siap digunakan untuk proses pencairan berikutnya.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedAccountForWd(null)}
                className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Hapus Akun */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              <TrashIcon size={22} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Akun Penarikan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus akun{" "}
                <strong>{accountToDelete.providerName}</strong> ({accountToDelete.accountNumber}) dari daftar penarikan Anda?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? "Menghapus..." : "Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import {
  SellerProfile,
  SellerVerificationPayload,
  sellerService,
} from "@/services/seller.service";
import {
  ShieldIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  StoreIcon,
  PercentIcon,
  TrendingUpIcon,
  DollarSignIcon,
  LockIcon,
  EditIcon,
} from "@/components/ui/icons";

interface PenjualVerificationViewProps {
  sellerProfile?: SellerProfile;
  token?: string;
  onVerificationSubmitted?: (updatedProfile: SellerProfile) => void;
}

export const PenjualVerificationView: React.FC<PenjualVerificationViewProps> = ({
  sellerProfile,
  token,
  onVerificationSubmitted,
}) => {
  const currentStatus = sellerProfile?.verificationStatus || "unverified";
  const submittedData = sellerProfile?.verificationData;

  // Form State
  const [ownerName, setOwnerName] = useState(submittedData?.ownerName || sellerProfile?.name || "");
  const [idCardNumber, setIdCardNumber] = useState(submittedData?.idCardNumber || "");
  const [phoneNumber, setPhoneNumber] = useState(submittedData?.phoneNumber || "");
  const [businessType, setBusinessType] = useState(submittedData?.businessType || "individual");
  const [storeDescription, setStoreDescription] = useState(submittedData?.storeDescription || "");
  const [notes, setNotes] = useState(submittedData?.notes || "");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Dokumen Mock Upload (Thumbnail Preview)
  const [idCardFile, setIdCardFile] = useState<string | null>(submittedData?.idCardPhoto || null);
  const [selfieFile, setSelfieFile] = useState<string | null>(submittedData?.selfiePhoto || null);

  // State mode edit verifikasi ulang
  const [isEditingVerification, setIsEditingVerification] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Sinkronisasi data form otomatis saat profile atau submittedData berubah
  useEffect(() => {
    if (submittedData) {
      if (submittedData.ownerName) setOwnerName(submittedData.ownerName);
      if (submittedData.idCardNumber) setIdCardNumber(submittedData.idCardNumber);
      if (submittedData.phoneNumber) setPhoneNumber(submittedData.phoneNumber);
      if (submittedData.businessType) setBusinessType(submittedData.businessType);
      if (submittedData.storeDescription) setStoreDescription(submittedData.storeDescription);
      if (submittedData.notes) setNotes(submittedData.notes);
      if (submittedData.idCardPhoto) setIdCardFile(submittedData.idCardPhoto);
      if (submittedData.selfiePhoto) setSelfieFile(submittedData.selfiePhoto);
    } else if (sellerProfile?.name && !ownerName) {
      setOwnerName(sellerProfile.name);
    }
  }, [submittedData, sellerProfile?.name]);

  // Format Tanggal
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Mask NIK untuk Privasi Keamanan
  const maskNik = (nik?: string) => {
    if (!nik) return "-";
    if (nik.length <= 8) return nik;
    const first = nik.slice(0, 4);
    const last = nik.slice(-4);
    return `${first}${"*".repeat(nik.length - 8)}${last}`;
  };

  // Handle File Upload dengan Kompresi Otomatis Canvas Client-Side
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Ukuran file maksimal 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultStr = event.target?.result as string;
      if (!resultStr) return;

      // Kompresi gambar menggunakan canvas jika format gambar
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            setter(compressed);
            setFormError(null);
          } else {
            setter(resultStr);
            setFormError(null);
          }
        } catch {
          setter(resultStr);
          setFormError(null);
        }
      };

      img.onerror = () => {
        setter(resultStr);
        setFormError(null);
      };

      img.src = resultStr;
    };

    reader.readAsDataURL(file);
  };

  // Submit Handler Pengajuan Verifikasi ke Admin
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!token) {
      setFormError("Sesi login berakhir. Silakan muat ulang halaman.");
      return;
    }

    if (!ownerName.trim()) {
      setFormError("Nama lengkap pemilik usaha wajib diisi.");
      return;
    }

    if (!idCardNumber.trim() || idCardNumber.trim().length < 8) {
      setFormError("Nomor NIK KTP / Identitas harus diisi minimal 8 digit.");
      return;
    }

    if (!phoneNumber.trim()) {
      setFormError("Nomor kontak telepon / WhatsApp aktif wajib diisi.");
      return;
    }

    if (!agreedToTerms) {
      setFormError("Anda harus menyetujui pernyataan keabsahan dokumen sebelum mengajukan.");
      return;
    }

    setIsSubmitting(true);

    const payload: SellerVerificationPayload = {
      ownerName: ownerName.trim(),
      idCardNumber: idCardNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      businessType,
      storeDescription: storeDescription.trim() || undefined,
      idCardPhoto: idCardFile || undefined,
      selfiePhoto: selfieFile || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await sellerService.submitVerification(token, payload);
      if (res.success) {
        setFormSuccess(res.message || "Pengajuan verifikasi berhasil dikirimkan ke Admin.");
        setIsEditingVerification(false);
        if (sellerProfile && onVerificationSubmitted) {
          onVerificationSubmitted({
            ...sellerProfile,
            verificationStatus: "pending",
            verificationSubmittedAt: res.submittedAt || new Date().toISOString(),
            verificationData: payload,
            verificationRejectionReason: null,
          });
        }
      } else {
        setFormError(res.message || "Gagal mengirim pengajuan verifikasi.");
      }
    } catch {
      setFormError("Terjadi gangguan koneksi saat mengajukan verifikasi ke admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section Verifikasi Toko */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Verifikasi Toko Resmi
            </h1>

            {/* Badge Status Aktual */}
            {currentStatus === "verified" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircleIcon size={13} className="shrink-0" />
                <span>Terverifikasi Resmi</span>
              </span>
            ) : currentStatus === "pending" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ClockIcon size={13} className="shrink-0" />
                <span>Menunggu Tinjauan Admin</span>
              </span>
            ) : currentStatus === "rejected" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <LockIcon size={13} className="shrink-0" />
                <span>Perlu Perbaikan (Ditolak)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                <ShieldIcon size={13} className="shrink-0 text-slate-400" />
                <span>Belum Terverifikasi</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Tingkatkan kredibilitas etalase Anda dengan mengajukan verifikasi merchant resmi ke Administrator NextShopID.
          </p>
        </div>
      </div>

      {/* 2. Banner Kartu Status Aktif */}
      {currentStatus === "pending" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <ClockIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-200">
                  Pengajuan Verifikasi Sedang Ditinjau Admin
                </h3>
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  Diajukan: {formatDateTime(sellerProfile?.verificationSubmittedAt)}
                </span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                Dokumen identitas dan profil usaha toko Anda sedang dalam antrean verifikasi manual oleh Tim Administrator NextShopID. Proses audit memerlukan waktu 1x24 jam kerja.
              </p>

              {/* Rincian Berkas yang Sedang Ditinjau */}
              {submittedData && (
                <div className="mt-4 p-3.5 rounded-2xl bg-white/80 dark:bg-black/30 border border-amber-200/60 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Nama Pemilik:</span>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {submittedData.ownerName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Nomor Identitas:</span>
                    <p className="font-semibold text-slate-900 dark:text-white font-mono">
                      {maskNik(submittedData.idCardNumber)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Jenis Usaha:</span>
                    <p className="font-semibold text-slate-900 dark:text-white capitalize">
                      {submittedData.businessType}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Kontak:</span>
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {submittedData.phoneNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Tombol Ajukan Ulang / Perbarui Berkas saat Pending */}
              <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-white/10 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingVerification(!isEditingVerification)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors cursor-pointer shadow-2xs"
                >
                  <EditIcon size={14} />
                  <span>
                    {isEditingVerification
                      ? "Tutup Formulir Perbaikan"
                      : "Perbarui / Ajukan Ulang Berkas"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStatus === "rejected" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <LockIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-200">
                Pengajuan Verifikasi Memerlukan Perbaikan
              </h3>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-1">
                Catatan dari Admin: <span className="font-semibold">{sellerProfile?.verificationRejectionReason || "Dokumen identitas kurang jelas atau data tidak sesuai. Silakan lengkapi kembali formulir pengajuan."}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStatus === "verified" && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#0c1220]">
                  {sellerProfile?.name ? sellerProfile.name[0]?.toUpperCase() : "P"}
                </div>
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-xs bg-red-600 text-white text-[8px] font-black uppercase tracking-tight shadow-xs border border-white dark:border-[#0c1220] leading-none pointer-events-none select-none z-10">
                  Mall
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-200">
                    Selamat! Toko Anda Telah Resmi Terverifikasi
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-2xs">
                    Status: Mall
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-1 leading-relaxed">
                  Toko Anda telah memegang lencana <span className="font-bold">Official Verified Merchant</span> dengan bingkai profil eksklusif border merah <strong>"Mall"</strong>. Seluruh produk Anda kini mendapatkan prioritas rekomendasi dan kepercayaan pembeli tertinggi.
                </p>
              </div>
            </div>

            {/* Tombol Perbarui Data Verifikasi saat Verified */}
            <div className="mt-3 sm:mt-0 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingVerification(!isEditingVerification)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer shadow-2xs"
              >
                <EditIcon size={14} />
                <span>
                  {isEditingVerification ? "Tutup Formulir" : "Perbarui Data Verifikasi"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Grid Penjelasan Benefit Verifikasi Toko (Kenapa Harus Verifikasi?) */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3">
          Keuntungan Memverifikasi Toko Anda
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Benefit 1: Badge Centang Resmi & Border Merah Mall */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 mb-3">
                <ShieldIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Border Merah "Mall" & Centang
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Foto profil toko disematkan bingkai border merah eksklusif dengan label <strong>"Mall"</strong> di border bawah serta lencana centang resmi.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-red-600 dark:text-red-400">
              +300% Tingkat Kepercayaan
            </span>
          </div>

          {/* Benefit 2: Prioritas Algoritma Etalase */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3">
                <TrendingUpIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Prioritas Rekomendasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Produk toko Anda diprioritaskan tampil di urutan atas hasil pencarian katalog dan etalase rekomendasi beranda.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              Visibilitas Teratas
            </span>
          </div>

          {/* Benefit 3: Pencairan Saldo Instan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                <DollarSignIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pencairan Saldo Kilat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Bebas batasan limit harian penarikan dana (payout) dengan proses settlement otomatis ke rekening bank Anda.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Tanpa Limit Harian
            </span>
          </div>

          {/* Benefit 4: Akses Flash Sale & Promosi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1220] border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-3">
                <PercentIcon size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fitur Promo Eksklusif
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Hak pendaftaran event Flash Sale platform, pembuatan kupon diskon toko resmi, dan dukungan prioritas.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-amber-500">
              Event Nasional NextShopID
            </span>
          </div>
        </div>
      </div>

      {/* 4. Formulir Pengajuan Verifikasi ke Admin */}
      {(currentStatus === "unverified" ||
        currentStatus === "rejected" ||
        isEditingVerification) && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c1220] p-6 sm:p-8 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {currentStatus === "rejected"
                  ? "Formulir Pengajuan Ulang Verifikasi"
                  : currentStatus === "pending"
                  ? "Formulir Pembaruan Berkas Verifikasi"
                  : currentStatus === "verified"
                  ? "Formulir Pembaruan Data Toko"
                  : "Formulir Pengajuan Verifikasi Toko"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentStatus === "rejected"
                  ? "Perbaiki data atau foto dokumen yang diminta admin untuk diverifikasi ulang."
                  : currentStatus === "pending"
                  ? "Anda dapat memperbarui data atau mengganti dokumen sebelum diproses oleh admin."
                  : "Isi data penanggung jawab dan identitas legal usaha Anda untuk ditinjau oleh Administrator."}
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <StoreIcon size={12} />
              <span>Verifikasi Mitra</span>
            </span>
          </div>

          {/* Feedback Notifikasi Form */}
          {formError && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitVerification} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nama Pemilik */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap Pemilik (Sesuai KTP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Contoh: Nico Ferdiansyah"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* NIK KTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor NIK KTP / Paspor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder="16 Digit NIK KTP"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                />
              </div>

              {/* Nomor Telepon / WA */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor WhatsApp / Kontak Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Jenis Usaha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bentuk Kepemilikan Usaha <span className="text-rose-500">*</span>
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="individual" className="dark:bg-[#0c1220]">Usaha Perorangan / Individu</option>
                  <option value="umkm" className="dark:bg-[#0c1220]">UMKM / Usaha Mikro Kecil Menengah</option>
                  <option value="company" className="dark:bg-[#0c1220]">Badan Usaha Resmi (CV / PT / Firma)</option>
                  <option value="brand_distributor" className="dark:bg-[#0c1220]">Distributor Resmi / Brand Owner</option>
                </select>
              </div>
            </div>

            {/* Deskripsi Usaha / Barang Dagangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Rencana Barang Dagangan & Profil Singkat Toko
              </label>
              <textarea
                rows={3}
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Jelaskan kategori produk yang Anda jual (misal: pakaian muslim pria, aksesoris gawai, perlengkapan dapur)..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Unggah Berkas Identitas (KTP & Foto Selfie) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Unggah Berkas Identitas Resmi
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload KTP */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-center">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Foto Kartu Identitas (KTP / Paspor)
                  </span>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Pastikan NIK dan nama terbaca jelas tanpa pantulan cahaya (maks. 5MB).
                  </p>

                  {idCardFile ? (
                    <div className="relative inline-block mb-2">
                      {/* Thumbnail Preview */}
                      <img
                        src={idCardFile}
                        alt="Preview KTP"
                        className="h-24 w-36 object-cover rounded-xl border border-slate-300 dark:border-white/20 mx-auto shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIdCardFile(null)}
                        className="mt-2 text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer block mx-auto"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-2xs">
                      <span>Pilih Foto KTP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setIdCardFile)}
                      />
                    </label>
                  )}
                </div>

                {/* Upload Selfie Memegang KTP */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-center">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Foto Wajah Selfie Memegang KTP
                  </span>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Wajah dan data KTP terlihat jelas bersamaan dalam satu foto.
                  </p>

                  {selfieFile ? (
                    <div className="relative inline-block mb-2">
                      <img
                        src={selfieFile}
                        alt="Preview Selfie"
                        className="h-24 w-36 object-cover rounded-xl border border-slate-300 dark:border-white/20 mx-auto shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSelfieFile(null)}
                        className="mt-2 text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer block mx-auto"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-2xs">
                      <span>Pilih Foto Selfie KTP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setSelfieFile)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan Pengantar untuk Administrator (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan catatan tambahan mengenai toko Anda bila diperlukan..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Checkbox Ketentuan */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Saya menyatakan dengan sebenarnya bahwa seluruh informasi identitas dan data kepemilikan usaha yang saya ajukan adalah sah, benar, dan dapat dipertanggungjawabkan sesuai syarat & ketentuan NextShopID.
                </span>
              </label>
            </div>

            {/* Tombol Aksi Submit */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim Pengajuan...</span>
                  </>
                ) : (
                  <>
                    <ShieldIcon size={14} />
                    <span>
                      {currentStatus === "rejected"
                        ? "Kirim Ulang Verifikasi ke Admin"
                        : currentStatus === "pending"
                        ? "Perbarui & Kirim Ulang ke Admin"
                        : currentStatus === "verified"
                        ? "Simpan & Ajukan Pembaruan"
                        : "Kirim Pengajuan Verifikasi ke Admin"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

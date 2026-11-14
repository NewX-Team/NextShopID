"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AdminUserItem,
  AdminUserStats,
  adminService,
} from "@/services/admin.service";
import { useAuth } from "@/context/AuthContext";
import { UserRole, UserStatus } from "@/types/auth";
import {
  UsersIcon,
  UserIcon,
  ShoppingBagIcon,
  ShieldIcon,
  SearchIcon,
  RefreshIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
} from "@/components/ui/icons";

interface SuspensionReason {
  id: string;
  label: string;
  desc: string;
  badge: string;
}

const SUSPENSION_REASONS: SuspensionReason[] = [
  {
    id: "suspicious_activity",
    label: "Aktivitas Mencurigakan",
    desc: "Terdeteksi pola login janggal, anomali checkout, atau indikasi bot otomatis.",
    badge: "Keamanan",
  },
  {
    id: "terms_violation",
    label: "Pelanggaran Ketentuan",
    desc: "Melanggar panduan komunitas, spam katalog, transaksi fiktif, atau manipulasi.",
    badge: "Kebijakan",
  },
  {
    id: "security_audit",
    label: "Audit & Verifikasi Akun",
    desc: "Pemberhentian sementara untuk verifikasi dokumen kepatuhan atau identitas toko.",
    badge: "Kepatuhan",
  },
  {
    id: "user_request",
    label: "Permintaan Pengguna / Khusus",
    desc: "Permintaan penonaktifan sementara dari pemilik akun atau kebutuhan investigasi internal.",
    badge: "Administrasi",
  },
];

/**
 * Komponen Ikon SVG Khusus untuk Setiap Alasan Pembekuan Akun (Tanpa Emoji Keyboard)
 */
const ReasonIconBadge: React.FC<{ reasonId: string; className?: string }> = ({
  reasonId,
  className = "h-9 w-9",
}) => {
  if (reasonId === "suspicious_activity") {
    return (
      <div
        className={`flex ${className} shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    );
  }

  if (reasonId === "terms_violation") {
    return (
      <div
        className={`flex ${className} shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m14.5 9.5-5 5" />
          <path d="m9.5 9.5 5 5" />
        </svg>
      </div>
    );
  }

  if (reasonId === "security_audit") {
    return (
      <div
        className={`flex ${className} shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <circle cx="11.5" cy="14.5" r="2.5" />
          <path d="m13.5 16.5 3 3" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`flex ${className} shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    </div>
  );
};

export const UserManagementView: React.FC = () => {
  const { token, user: currentUser } = useAuth();

  // State Data Pengguna & Statistik
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminUserStats>({
    total: 0,
    totalPembeli: 0,
    totalPenjual: 0,
    totalAdmin: 0,
    totalActive: 0,
    totalSuspended: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Multi-Select & Aksi Massal
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<UserStatus>("suspended");
  const [isUpdatingBulk, setIsUpdatingBulk] = useState<boolean>(false);

  // Systematic Reason & Note State
  const [selectedReasonId, setSelectedReasonId] = useState<string>("suspicious_activity");
  const [customNote, setCustomNote] = useState<string>("");

  // Modal & Aksi Role
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserItem | null>(null);
  const [newRoleValue, setNewRoleValue] = useState<UserRole>("user");
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

  // Modal & Aksi Status Akun Tunggal (Protokol Pembekuan / Reaktivasi)
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUserItem | null>(null);
  const [targetStatusValue, setTargetStatusValue] = useState<UserStatus>("suspended");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Modal Hapus Pengguna
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Tampilkan toast notifikasi sementara
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setFeedbackToast({ type, message });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  }, []);

  // Fetch data dari backend
  const fetchUsers = useCallback(
    async (isBackground = false) => {
      if (!token) return;

      if (!isBackground) {
        setIsRefreshing(true);
      }

      try {
        const res = await adminService.getUsers(token, {
          search: searchTerm,
          role: selectedRole,
          status: selectedStatus,
          sort: sortBy,
        });

        if (res.success) {
          setUsers(res.data);
          setStats(res.stats);
          setLastSyncTime(new Date());
        } else {
          if (!isBackground) {
            showToast(res.message || "Gagal memuat data pengguna", "error");
          }
        }
      } catch (err) {
        console.error("[UserManagementView] Error:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, searchTerm, selectedRole, selectedStatus, sortBy, showToast]
  );

  // Inisialisasi fetch awal dan saat filter berubah
  useEffect(() => {
    fetchUsers(false);
  }, [fetchUsers]);

  // Real-time background sync polling (setiap 8 detik jika auto sync aktif)
  useEffect(() => {
    if (!isAutoSyncEnabled || !token) return;

    const interval = setInterval(() => {
      fetchUsers(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, token, fetchUsers]);

  // Daftar pengguna yang dapat dipilih secara massal (exclude superadmin #1 & current user)
  const selectableUsers = useMemo(() => {
    return users.filter((u) => u.id !== 1 && u.id !== currentUser?.id);
  }, [users, currentUser?.id]);

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === selectableUsers.length && selectableUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Handler update role pengguna
  const handleConfirmUpdateRole = async () => {
    if (!token || !selectedUserForRole) return;

    setIsUpdatingRole(true);
    try {
      const res = await adminService.updateUserRole(token, selectedUserForRole.id, newRoleValue);
      if (res.success) {
        showToast(
          res.message ||
            `Role ${selectedUserForRole.name} berhasil diubah menjadi ${newRoleValue}`
        );
        setSelectedUserForRole(null);
        fetchUsers(true);
      } else {
        showToast(res.message || "Gagal mengubah role pengguna", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handler update status akun tunggal (sistematis dengan alasan & catatan)
  const handleConfirmUpdateStatus = async () => {
    if (!token || !selectedUserForStatus) return;

    setIsUpdatingStatus(true);
    try {
      const selectedReason = SUSPENSION_REASONS.find((r) => r.id === selectedReasonId);
      const combinedReason =
        targetStatusValue === "suspended"
          ? `${selectedReason?.label || "Pembekuan Akun"}${
              customNote ? `: ${customNote}` : ""
            }`
          : undefined;

      const res = await adminService.updateUserStatus(
        token,
        selectedUserForStatus.id,
        targetStatusValue,
        combinedReason
      );

      if (res.success) {
        showToast(
          res.message ||
            `Status akun ${selectedUserForStatus.name} berhasil diperbarui.`
        );
        setSelectedUserForStatus(null);
        setSelectedReasonId("suspicious_activity");
        setCustomNote("");
        fetchUsers(true);
      } else {
        showToast(res.message || "Gagal mengubah status akun", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handler update status massal (bulk status)
  const handleConfirmBulkStatus = async () => {
    if (!token || selectedUserIds.length === 0) return;

    setIsUpdatingBulk(true);
    try {
      const selectedReason = SUSPENSION_REASONS.find((r) => r.id === selectedReasonId);
      const combinedReason =
        bulkTargetStatus === "suspended"
          ? `${selectedReason?.label || "Pembekuan Massal"}${
              customNote ? `: ${customNote}` : ""
            }`
          : undefined;

      const res = await adminService.updateUsersBulkStatus(
        token,
        selectedUserIds,
        bulkTargetStatus,
        combinedReason
      );

      if (res.success) {
        showToast(
          res.message ||
            `${selectedUserIds.length} akun pengguna berhasil diperbarui.`
        );
        setIsBulkModalOpen(false);
        setSelectedUserIds([]);
        setSelectedReasonId("suspicious_activity");
        setCustomNote("");
        fetchUsers(true);
      } else {
        showToast(res.message || "Gagal memperbarui status akun massal", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsUpdatingBulk(false);
    }
  };

  // Handler delete pengguna
  const handleConfirmDeleteUser = async () => {
    if (!token || !selectedUserForDelete) return;

    setIsDeletingUser(true);
    try {
      const res = await adminService.deleteUser(token, selectedUserForDelete.id);
      if (res.success) {
        showToast(
          res.message || `Pengguna '${selectedUserForDelete.name}' berhasil dihapus`
        );
        setSelectedUserForDelete(null);
        fetchUsers(true);
      } else {
        showToast(res.message || "Gagal menghapus pengguna", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Format tanggal ke Bahasa Indonesia yang elegan
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Helper avatar gradient
  const getAvatarGradient = (name: string, role: string) => {
    if (role === "admin") return "from-purple-600 via-indigo-600 to-blue-600";
    if (role === "penjual") return "from-emerald-500 via-teal-600 to-cyan-700";
    return "from-blue-600 via-sky-600 to-indigo-700";
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notifikasi */}
      {feedbackToast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium border ${
              feedbackToast.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30 backdrop-blur-md"
                : "bg-rose-950/90 text-rose-200 border-rose-500/30 backdrop-blur-md"
            }`}
          >
            {feedbackToast.type === "success" ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckIcon size={14} />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <CloseIcon size={14} />
              </div>
            )}
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* Header Utama Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Manajemen Pengguna
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Realtime Sync
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola data akun pembeli, toko penjual, dan kontrol pembekuan akses pengguna secara sistematis.
          </p>
        </div>

        {/* Action Controls: Refresh & Auto Sync Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <span className="hidden xl:inline-block text-[11px] text-slate-400">
            Sinkron: {lastSyncTime.toLocaleTimeString("id-ID")}
          </span>

          <button
            type="button"
            onClick={() => setIsAutoSyncEnabled((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isAutoSyncEnabled
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
            }`}
            title={isAutoSyncEnabled ? "Klik untuk pause auto-sync" : "Klik untuk aktifkan auto-sync"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isAutoSyncEnabled ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
            <span>{isAutoSyncEnabled ? "Auto Live: ON" : "Auto Live: PAUSED"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchUsers(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshIcon
              size={14}
              className={`text-blue-500 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>{isRefreshing ? "Menyinkronkan..." : "Segarkan"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Statistik Pengguna & Kontrol Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card: Total Pengguna */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/10 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Pengguna
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UsersIcon size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.total}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{stats.totalActive ?? 0} Aktif</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>{stats.totalSuspended ?? 0} Dibekukan</span>
            </span>
          </div>
        </div>

        {/* Card: Total Pembeli */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/10 shadow-sm transition-all hover:border-sky-300 dark:hover:border-sky-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pembeli (User)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <UserIcon size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight">
            {stats.totalPembeli}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {stats.total > 0 ? `${Math.round((stats.totalPembeli / stats.total) * 100)}% dari total` : "Konsumen toko"}
          </p>
        </div>

        {/* Card: Total Penjual */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/10 shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Penjual (Merchant)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBagIcon size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {stats.totalPenjual}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Mitra toko & merchant aktif</p>
        </div>

        {/* Card: Total Administrator */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/10 shadow-sm transition-all hover:border-purple-300 dark:hover:border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Administrator
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldIcon size={18} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
            {stats.totalAdmin}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Pengelola & security sistem</p>
        </div>
      </div>

      {/* Toolbar Filter, Pencarian, & Kontrol Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Pills Berdasarkan Role */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedRole("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Semua Role ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("user")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "user"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Pembeli ({stats.totalPembeli})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("penjual")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "penjual"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Penjual ({stats.totalPenjual})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "admin"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span>Admin ({stats.totalAdmin})</span>
            </button>
          </div>

          {/* Opsi Pengurutan */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-xs text-slate-400">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest" className="dark:bg-[#0f172a]">Terbaru Bergabung</option>
              <option value="oldest" className="dark:bg-[#0f172a]">Terlama Bergabung</option>
              <option value="name_asc" className="dark:bg-[#0f172a]">Nama (A - Z)</option>
              <option value="name_desc" className="dark:bg-[#0f172a]">Nama (Z - A)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Berdasarkan Status Akun */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <span className="text-xs font-semibold text-slate-400">Status Akun:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === "all"
                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("active")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Aktif ({stats.totalActive ?? 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("suspended")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === "suspended"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              <span>Dibekukan ({stats.totalSuspended ?? 0})</span>
            </button>
          </div>
        </div>

        {/* Input Bar Pencarian Realtime */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama lengkap, username, atau alamat email..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#0f172a] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              aria-label="Bersihkan pencarian"
            >
              <CloseIcon size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Pengguna dengan Switch Interaktif */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-white/10 shadow-sm">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Memuat data pengguna...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mb-3">
              <UsersIcon size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Tidak ada pengguna ditemukan
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Tidak ada data yang cocok dengan kriteria filter saat ini. Coba reset filter Anda.
            </p>
            {(searchTerm || selectedRole !== "all" || selectedStatus !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("all");
                  setSelectedStatus("all");
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectableUsers.length > 0 &&
                        selectedUserIds.length === selectableUsers.length
                      }
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label="Pilih semua pengguna yang dapat dikelola"
                      title="Pilih semua pengguna"
                    />
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Pengguna
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Role & Identitas
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Status Akun (Kontrol Interaktif)
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Tanggal Terdaftar
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                {users.map((u) => {
                  const isRootAdmin = u.id === 1;
                  const isCurrentAuthUser = currentUser?.id === u.id;
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-50/50 dark:bg-blue-950/20"
                          : "hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Checkbox Pemilihan Baris */}
                      <td className="w-12 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          disabled={isRootAdmin || isCurrentAuthUser}
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label={`Pilih akun ${u.name}`}
                        />
                      </td>

                      {/* Kolom Pengguna (Avatar, Nama, Username, Email) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                              u.name,
                              u.role
                            )} text-white font-bold text-sm shadow-xs`}
                          >
                            {u.name ? u.name[0]?.toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </span>
                              {isCurrentAuthUser && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>@{u.username}</span>
                              <span>•</span>
                              <span className="truncate">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Role Pengguna */}
                      <td className="px-5 py-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                            <ShieldIcon size={12} />
                            <span>Administrator</span>
                          </span>
                        ) : u.role === "penjual" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            <ShoppingBagIcon size={12} />
                            <span>Penjual (Merchant)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                            <UserIcon size={12} />
                            <span>Pembeli</span>
                          </span>
                        )}
                      </td>

                      {/* Kolom Status Akun (Switch Toggle Interaktif yang Sistematis) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Tactile Switch ON / OFF */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={u.status === "active"}
                            disabled={isRootAdmin || isCurrentAuthUser}
                            onClick={() => {
                              setSelectedUserForStatus(u);
                              setTargetStatusValue(u.status === "suspended" ? "active" : "suspended");
                              setSelectedReasonId("suspicious_activity");
                              setCustomNote("");
                            }}
                            className={`group relative inline-flex h-7 w-13 shrink-0 items-center rounded-full p-0.5 transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#0f172a] ${
                              isRootAdmin || isCurrentAuthUser
                                ? "opacity-40 cursor-not-allowed bg-slate-200 dark:bg-white/10"
                                : u.status === "active"
                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/30"
                                : "bg-slate-300 dark:bg-slate-700 hover:bg-rose-600/70 shadow-sm"
                            }`}
                            title={
                              isRootAdmin
                                ? "Akun Superadmin Utama dilindungi dari pembekuan"
                                : isCurrentAuthUser
                                ? "Akun Anda sendiri sedang aktif digunakan"
                                : u.status === "active"
                                ? "Status AKTIF: Klik untuk memproses protokol pembekuan akun (OFF)"
                                : `Status DIBEKUKAN${u.suspension_reason ? `: ${u.suspension_reason}` : ""}: Klik untuk membuka kembali akses akun (ON)`
                            }
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                                u.status === "active" ? "translate-x-6" : "translate-x-0"
                              }`}
                            >
                              {isRootAdmin || isCurrentAuthUser ? (
                                <ShieldIcon size={11} className="text-slate-400" />
                              ) : u.status === "active" ? (
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              ) : (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-rose-600"
                                >
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              )}
                            </span>
                          </button>

                          {/* Status Pill Badge */}
                          {u.status === "suspended" ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                              title={u.suspension_reason ? `Alasan: ${u.suspension_reason}` : "Dibekukan oleh admin"}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>Dibekukan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              <span>Aktif</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Tanggal Terdaftar */}
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Ubah Role */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForRole(u);
                              setNewRoleValue(u.role);
                            }}
                            disabled={isRootAdmin}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isRootAdmin
                                ? "text-slate-400 opacity-40 cursor-not-allowed"
                                : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer"
                            }`}
                            title={isRootAdmin ? "Superadmin utama tidak dapat diubah" : "Ubah role pengguna"}
                          >
                            <EditIcon size={13} />
                            <span>Role</span>
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDelete(u)}
                            disabled={isRootAdmin || isCurrentAuthUser}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              isRootAdmin || isCurrentAuthUser
                                ? "text-slate-400 opacity-30 cursor-not-allowed"
                                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            }`}
                            title={
                              isRootAdmin
                                ? "Superadmin tidak dapat dihapus"
                                : isCurrentAuthUser
                                ? "Tidak dapat menghapus akun sendiri"
                                : "Hapus akun pengguna"
                            }
                          >
                            <TrashIcon size={14} />
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

        {/* Footer Info Total Baris */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-white/5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Menampilkan <strong className="text-slate-900 dark:text-white">{users.length}</strong> dari total{" "}
            <strong className="text-slate-900 dark:text-white">{stats.total}</strong> akun
          </span>
          <span className="text-[11px] text-slate-400">
            Terakhir diperbarui: {lastSyncTime.toLocaleTimeString("id-ID")}
          </span>
        </div>
      </div>

      {/* Floating Bottom Command Dock: Aksi Massal Sistematis */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-[#0b132b]/95 text-white border border-slate-700/60 dark:border-blue-500/30 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700 dark:border-white/10 text-xs font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px]">
                {selectedUserIds.length}
              </span>
              <span>Akun Dipilih</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBulkTargetStatus("active");
                  setIsBulkModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Aktifkan Semua</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkTargetStatus("suspended");
                  setSelectedReasonId("suspicious_activity");
                  setCustomNote("");
                  setIsBulkModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Bekukan Semua</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Batalkan pilihan"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Protokol Pembekuan Akun Pengguna (Sistematis, Ikon Grafis Khusus, Tanpa Emoji) */}
      {selectedUserForStatus && targetStatusValue === "suspended" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUserForStatus(null)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-rose-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Protokol Pembekuan Akun
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Konfigurasikan pembekuan akses untuk menegakkan keamanan platform
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Snapshot Profil Pengguna */}
            <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    selectedUserForStatus.name,
                    selectedUserForStatus.role
                  )} text-white font-bold text-sm shadow-xs`}
                >
                  {selectedUserForStatus.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedUserForStatus.name}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-200/60 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {selectedUserForStatus.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    @{selectedUserForStatus.username} • {selectedUserForStatus.email}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                ID #{selectedUserForStatus.id}
              </span>
            </div>

            {/* Pilihan Alasan Pembekuan Terstruktur dengan Ikon Grafis SVG */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Pilih Kategori Alasan Pembekuan:
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {SUSPENSION_REASONS.map((reason) => {
                  const isChecked = selectedReasonId === reason.id;
                  return (
                    <div
                      key={reason.id}
                      onClick={() => setSelectedReasonId(reason.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/40 ring-1 ring-rose-500/30"
                          : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                      }`}
                    >
                      <ReasonIconBadge reasonId={reason.id} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {reason.label}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                            {reason.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {reason.desc}
                        </p>
                      </div>
                      <div
                        className={`h-4 w-4 mt-1 rounded-full border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-slate-300 dark:border-white/20"
                        }`}
                      >
                        {isChecked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input Catatan Investigasi Admin */}
            <div className="mt-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Catatan Tambahan Admin (Akan Ditampilkan ke Pengguna):
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Tuliskan alasan spesifik atau catatan yang akan dibaca pengguna saat popup muncul..."
                rows={2}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
              />
            </div>

            {/* Ringkasan Dampak Sistematis */}
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Dampak Langsung ke Sisi Pengguna:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                <li>Sesi pengguna langsung diputus seketika melalui sinkronisasi background realtime.</li>
                <li>Popup notifikasi pembekuan akun akan muncul di layar pengguna lengkap dengan alasan yang Anda tentukan di atas.</li>
                <li>Pengguna hanya memiliki opsi keluar sesi (logout) dan diarahkan kembali ke beranda.</li>
              </ul>
            </div>

            {/* Aksi Konfirmasi */}
            <div className="mt-6 flex items-center gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdateStatus}
                disabled={isUpdatingStatus}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 shadow-md shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menerapkan Protokol...</span>
                  </>
                ) : (
                  <span>Terapkan Pembekuan Akun</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Protokol Reaktivasi Akun Pengguna (Sistematis & Elegan) */}
      {selectedUserForStatus && targetStatusValue === "active" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUserForStatus(null)}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-emerald-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            {/* Header Modal Reaktivasi */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Reaktivasi Akun Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pulihkan seluruh akses pengguna ke platform NextShopID
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Detail Akun yang Direaktivasi */}
            <div className="my-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                  selectedUserForStatus.name,
                  selectedUserForStatus.role
                )} text-white font-bold text-sm`}
              >
                {selectedUserForStatus.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedUserForStatus.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  @{selectedUserForStatus.username} • {selectedUserForStatus.email}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Status Saat Ini: Dibekukan
                </span>
                {selectedUserForStatus.suspension_reason && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic">
                    Alasan: &quot;{selectedUserForStatus.suspension_reason}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Poin Pemulihan Akses */}
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">
                Setelah diaktifkan kembali:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Pengguna dapat kembali login menggunakan kredensial lamanya.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Keranjang, riwayat pesanan, atau toko mitra kembali berfungsi penuh.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-emerald-500 shrink-0" />
                  <span>Notifikasi pembekuan di sisi pengguna akan dinonaktifkan.</span>
                </div>
              </div>
            </div>

            {/* Aksi Konfirmasi Reaktivasi */}
            <div className="mt-6 flex items-center gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdateStatus}
                disabled={isUpdatingStatus}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-md shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengaktifkan...</span>
                  </>
                ) : (
                  <span>Aktifkan Akun Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Protokol Aksi Massal (Bulk Status Update) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsBulkModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-blue-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    bulkTargetStatus === "suspended"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {bulkTargetStatus === "suspended" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <CheckIcon size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {bulkTargetStatus === "suspended"
                      ? "Pembekuan Akun Massal"
                      : "Reaktivasi Akun Massal"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Terapkan status ke {selectedUserIds.length} akun pengguna terpilih
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Aksi ini akan diberlakukan pada{" "}
                <strong className="text-slate-900 dark:text-white">
                  {selectedUserIds.length} pengguna
                </strong>{" "}
                sekaligus.
              </span>
            </div>

            {bulkTargetStatus === "suspended" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pilih Alasan Pembekuan Massal:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SUSPENSION_REASONS.map((reason) => {
                    const isChecked = selectedReasonId === reason.id;
                    return (
                      <div
                        key={reason.id}
                        onClick={() => setSelectedReasonId(reason.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/40"
                            : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ReasonIconBadge reasonId={reason.id} className="h-8 w-8" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                              {reason.label}
                            </p>
                            <p className="text-[10px] text-slate-400">{reason.desc}</p>
                          </div>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? "border-rose-600 bg-rose-600 text-white"
                              : "border-slate-300 dark:border-white/20"
                          }`}
                        >
                          {isChecked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Catatan Massal (Opsional):
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Alasan singkat atau nomor log..."
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkStatus}
                disabled={isUpdatingBulk}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  bulkTargetStatus === "suspended"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                }`}
              >
                {isUpdatingBulk ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>
                    Konfirmasi {bulkTargetStatus === "suspended" ? "Bekukan" : "Aktifkan"} (
                    {selectedUserIds.length})
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ubah Role Pengguna */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedUserForRole(null)}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ubah Role Pengguna
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    selectedUserForRole.name,
                    selectedUserForRole.role
                  )} text-white font-bold text-sm`}
                >
                  {selectedUserForRole.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedUserForRole.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    @{selectedUserForRole.username} • {selectedUserForRole.email}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Role Baru:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoleValue("user")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      newRoleValue === "user"
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-500 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <UserIcon size={18} />
                    <span>Pembeli</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRoleValue("penjual")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      newRoleValue === "penjual"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <ShoppingBagIcon size={18} />
                    <span>Penjual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRoleValue("admin")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      newRoleValue === "admin"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <ShieldIcon size={18} />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Pengubahan role akan langsung mengubah hak akses akun pengguna pada sesi berikutnya.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdateRole}
                disabled={isUpdatingRole || newRoleValue === selectedUserForRole.role}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
              >
                {isUpdatingRole ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Konfirmasi Hapus Pengguna */}
      {selectedUserForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setSelectedUserForDelete(null)}
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto mb-4">
              <TrashIcon size={22} />
            </div>

            <h3 className="text-base font-bold text-center text-slate-900 dark:text-white">
              Hapus Akun Pengguna?
            </h3>
            <p className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus akun{" "}
              <strong className="text-slate-900 dark:text-white">
                {selectedUserForDelete.name} (@{selectedUserForDelete.username})
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
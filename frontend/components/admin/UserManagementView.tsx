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
  LockIcon,
  SearchIcon,
  RefreshIcon,
  TrashIcon,
  CheckIcon,
  CheckCircleIcon,
  CloseIcon,
  EditIcon,
  PlusIcon,
  DownloadIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
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
 * Komponen Ikon SVG Khusus untuk Setiap Alasan Pembekuan Akun
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
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Systematic Reason & Note State (Untuk Pembekuan Akun)
  const [selectedReasonId, setSelectedReasonId] = useState<string>("suspicious_activity");
  const [customNote, setCustomNote] = useState<string>("");

  // Modal 1: Tambah Pengguna Baru
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "user" as UserRole,
    status: "active" as UserStatus,
  });
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal 2: Edit Pengguna Lengkap
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUserItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "user" as UserRole,
    status: "active" as UserStatus,
    newPassword: "",
    reason: "",
  });
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal 3: Reset Kata Sandi Langsung
  const [selectedUserForResetPassword, setSelectedUserForResetPassword] = useState<AdminUserItem | null>(null);
  const [resetCustomPassword, setResetCustomPassword] = useState<string>("");
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState<boolean>(false);

  // Modal 4: Detail Pengguna Lengkap
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AdminUserItem | null>(null);

  // Modal 5: Status Akun Tunggal (Switch Protokol Pembekuan / Reaktivasi)
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUserItem | null>(null);
  const [targetStatusValue, setTargetStatusValue] = useState<UserStatus>("suspended");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Modal 6: Hapus Pengguna Tunggal
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  // Feedback Toast
  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  useEffect(() => {
    fetchUsers(false);
  }, [fetchUsers]);

  // Background auto-refresh berkala
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchUsers(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [token, fetchUsers]);

  // Daftar pengguna yang dapat dipilih secara massal
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

  // Handler: Tambah Pengguna Baru
  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      role: "user",
      status: "active",
    });
    setCreateError(null);
    setShowCreatePassword(false);
    setIsCreateModalOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const generated = "Next@" + Math.floor(100000 + Math.random() * 900000);
    setCreateFormData((prev) => ({ ...prev, password: generated }));
    setShowCreatePassword(true);
  };

  const handleConfirmCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!createFormData.name || !createFormData.username || !createFormData.email || !createFormData.password) {
      setCreateError("Semua field wajib diisi.");
      return;
    }

    if (createFormData.password.length < 6) {
      setCreateError("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsCreatingUser(true);
    setCreateError(null);

    try {
      const res = await adminService.createUser(token, createFormData);
      if (res.success) {
        showToast(res.message || `Pengguna '${createFormData.name}' berhasil ditambahkan.`);
        setIsCreateModalOpen(false);
        fetchUsers(true);
      } else {
        setCreateError(res.message || "Gagal menambahkan pengguna.");
      }
    } catch {
      setCreateError("Terjadi kesalahan koneksi server.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handler: Buka Modal Edit Pengguna
  const handleOpenEditModal = (u: AdminUserItem) => {
    setSelectedUserForEdit(u);
    setEditFormData({
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      newPassword: "",
      reason: u.suspension_reason || "",
    });
    setEditError(null);
    setShowEditPassword(false);
  };

  const handleConfirmUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUserForEdit) return;

    setIsUpdatingUser(true);
    setEditError(null);

    try {
      const payload: {
        name: string;
        username: string;
        email: string;
        role?: UserRole;
        status?: UserStatus;
        newPassword?: string;
        reason?: string;
      } = {
        name: editFormData.name,
        username: editFormData.username,
        email: editFormData.email,
        role: editFormData.role,
        status: editFormData.status,
      };

      if (editFormData.newPassword && editFormData.newPassword.trim().length > 0) {
        payload.newPassword = editFormData.newPassword.trim();
      }

      if (editFormData.status === "suspended") {
        payload.reason = editFormData.reason || "Akun dibekukan oleh admin.";
      }

      const res = await adminService.updateUser(token, selectedUserForEdit.id, payload);
      if (res.success) {
        showToast(res.message || `Data '${editFormData.name}' berhasil diperbarui.`);
        setSelectedUserForEdit(null);
        fetchUsers(true);
      } else {
        setEditError(res.message || "Gagal memperbarui data pengguna.");
      }
    } catch {
      setEditError("Terjadi kesalahan koneksi server.");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Handler: Buka Modal Reset Password
  const handleOpenResetPasswordModal = (u: AdminUserItem) => {
    setSelectedUserForResetPassword(u);
    setResetCustomPassword("");
    setResetPasswordResult(null);
    setIsPasswordCopied(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!token || !selectedUserForResetPassword) return;

    setIsResettingPassword(true);
    try {
      const res = await adminService.resetUserPassword(
        token,
        selectedUserForResetPassword.id,
        resetCustomPassword ? resetCustomPassword.trim() : undefined
      );

      if (res.success && res.newPassword) {
        setResetPasswordResult(res.newPassword);
        showToast(res.message || "Kata sandi berhasil direset.");
      } else {
        showToast(res.message || "Gagal mereset kata sandi.", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyNewPassword = () => {
    if (!resetPasswordResult) return;
    navigator.clipboard.writeText(resetPasswordResult);
    setIsPasswordCopied(true);
    setTimeout(() => setIsPasswordCopied(false), 2500);
  };

  // Handler: Update Status Akun Tunggal (Protokol Switch)
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
        showToast(res.message || `Status akun ${selectedUserForStatus.name} berhasil diperbarui.`);
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

  // Handler: Update Status Massal (Bulk Status)
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
        showToast(res.message || `${selectedUserIds.length} akun pengguna berhasil diperbarui.`);
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

  // Handler: Hapus Pengguna Tunggal
  const handleConfirmDeleteUser = async () => {
    if (!token || !selectedUserForDelete) return;

    setIsDeletingUser(true);
    try {
      const res = await adminService.deleteUser(token, selectedUserForDelete.id);
      if (res.success) {
        showToast(res.message || `Pengguna '${selectedUserForDelete.name}' berhasil dihapus`);
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

  // Handler: Hapus Massal (Bulk Delete)
  const handleConfirmBulkDelete = async () => {
    if (!token || selectedUserIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const res = await adminService.bulkDeleteUsers(token, selectedUserIds);
      if (res.success) {
        showToast(res.message || `${selectedUserIds.length} akun berhasil dihapus.`);
        setIsBulkDeleteModalOpen(false);
        setSelectedUserIds([]);
        fetchUsers(true);
      } else {
        showToast(res.message || "Gagal menghapus pengguna secara massal", "error");
      }
    } catch {
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handler: Ekspor CSV Data Pengguna
  const handleExportCSV = () => {
    if (users.length === 0) {
      showToast("Tidak ada data pengguna untuk diekspor", "error");
      return;
    }

    const headers = [
      "ID",
      "Nama Lengkap",
      "Username",
      "Email",
      "Role",
      "Status",
      "Alasan Pembekuan",
      "Tanggal Terdaftar",
    ];

    const rows = users.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.username}"`,
      `"${u.email}"`,
      u.role,
      u.status,
      `"${(u.suspension_reason || "").replace(/"/g, '""')}"`,
      `"${formatDate(u.created_at)}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `nextshopid_pengguna_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Data ${users.length} pengguna berhasil diekspor ke format CSV.`);
  };

  // Format tanggal ke Bahasa Indonesia
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
              {stats.total} Akun
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Daftarkan, sunting profil, atur hak akses, dan pantau status seluruh pengguna platform NextShopID.
          </p>
        </div>

        {/* Action Controls: Tambah Pengguna, Ekspor CSV, & Segarkan Data */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Tombol Tambah Pengguna Baru (Primary CTA) */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <PlusIcon size={15} />
            <span>Tambah Pengguna</span>
          </button>

          {/* Tombol Ekspor CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Unduh data pengguna dalam format spreadsheet CSV"
          >
            <DownloadIcon size={14} className="text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Tombol Segarkan Manual */}
          <button
            type="button"
            onClick={() => fetchUsers(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshIcon
              size={14}
              className={`text-blue-500 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">{isRefreshing ? "Menyinkronkan..." : "Segarkan"}</span>
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
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {stats.totalActive ?? 0} Aktif
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-rose-500 dark:text-rose-400 font-semibold">
              {stats.totalSuspended ?? 0} Dibekukan
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "user"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Pembeli ({stats.totalPembeli})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("penjual")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "penjual"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Penjual ({stats.totalPenjual})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedRole === "admin"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Admin ({stats.totalAdmin})
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Aktif ({stats.totalActive ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("suspended")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === "suspended"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              Dibekukan ({stats.totalSuspended ?? 0})
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

      {/* Tabel Data Pengguna dengan Kontrol Lengkap */}
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
              Tidak ada data yang cocok dengan kriteria filter saat ini.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("all");
                  setSelectedStatus("all");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white transition-colors cursor-pointer"
              >
                + Tambah Pengguna Baru
              </button>
            </div>
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
                    Role & Hak Akses
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
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetail(u)}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                              u.name,
                              u.role
                            )} text-white font-bold text-sm shadow-xs cursor-pointer hover:opacity-90 transition-opacity`}
                            title="Klik untuk melihat rincian akun"
                          >
                            {u.name ? u.name[0]?.toUpperCase() : "U"}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedUserForDetail(u)}
                                className="font-semibold text-slate-900 dark:text-white truncate hover:underline text-left cursor-pointer"
                              >
                                {u.name}
                              </button>
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

                      {/* Kolom Status Akun (Switch Toggle Interaktif) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
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
                                ? "Akun Superadmin Utama dilindungi"
                                : isCurrentAuthUser
                                ? "Akun Anda sendiri sedang aktif digunakan"
                                : u.status === "active"
                                ? "Klik untuk memproses pembekuan akun (OFF)"
                                : `Status DIBEKUKAN${u.suspension_reason ? `: ${u.suspension_reason}` : ""}: Klik untuk mengaktifkan kembali (ON)`
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
                                <CheckIcon size={11} className="text-emerald-600 stroke-[3]" />
                              ) : (
                                <LockIcon size={11} className="text-rose-600" />
                              )}
                            </span>
                          </button>

                          {/* Status Pill Badge */}
                          {u.status === "suspended" ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              title={u.suspension_reason ? `Alasan: ${u.suspension_reason}` : "Dibekukan oleh admin"}
                            >
                              <LockIcon size={11} className="shrink-0" />
                              <span>Dibekukan</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircleIcon size={12} className="shrink-0" />
                              <span>Aktif</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Tanggal Terdaftar */}
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Kolom Aksi Lengkap (Detail, Edit, Reset Password, Hapus) */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Detail Akun */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetail(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            title="Lihat rincian lengkap akun"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </button>

                          {/* Tombol Edit Pengguna */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-colors cursor-pointer"
                            title="Edit profil, role, atau kata sandi"
                          >
                            <EditIcon size={13} />
                            <span>Edit</span>
                          </button>

                          {/* Tombol Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPasswordModal(u)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                            title="Reset kata sandi akun ini"
                          >
                            <KeyIcon size={14} />
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

      {/* Floating Bottom Command Dock: Aksi Massal */}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                <span>Bekukan Semua</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                <TrashIcon size={13} />
                <span>Hapus Terpilih</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: Tambah Pengguna Baru (Pembeli, Penjual, atau Admin)             */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isCreatingUser && setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-blue-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <PlusIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Tambah Pengguna Baru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daftarkan akun Pembeli, Penjual, atau Admin ke NextShopID
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {createError && (
              <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleConfirmCreateUser} className="space-y-4 my-4">
              {/* Field Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="Misal: Andi Wijaya"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field Username & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.username}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      })
                    }
                    placeholder="andiwijaya"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value.toLowerCase() })}
                    placeholder="andi@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Field Password Awal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi Awal *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Generate Acak
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="Minimal 6 karakter..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showCreatePassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>

              {/* Pilihan Role Pengguna */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Role Pengguna:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Option: Pembeli */}
                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, role: "user" })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      createFormData.role === "user"
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-500 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <UserIcon size={18} />
                    <span className="text-xs font-bold">Pembeli</span>
                  </button>

                  {/* Option: Penjual */}
                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, role: "penjual" })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      createFormData.role === "penjual"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <ShoppingBagIcon size={18} />
                    <span className="text-xs font-bold">Penjual</span>
                  </button>

                  {/* Option: Admin */}
                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, role: "admin" })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      createFormData.role === "admin"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500 shadow-xs"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <ShieldIcon size={18} />
                    <span className="text-xs font-bold">Admin</span>
                  </button>
                </div>
              </div>

              {/* Status Awal Akun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status Akun Awal:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, status: "active" })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      createFormData.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <CheckCircleIcon size={14} className="shrink-0" />
                    <span>Aktif (Normal)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateFormData({ ...createFormData, status: "suspended" })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      createFormData.status === "suspended"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <LockIcon size={14} className="shrink-0" />
                    <span>Langsung Dibekukan</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreatingUser ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <span>Simpan & Daftarkan Pengguna</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Pengguna Lengkap (Profil, Role, Status, Password Baru)     */}
      {/* ========================================================================= */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isUpdatingUser && setSelectedUserForEdit(null)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-blue-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <EditIcon size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Edit Akun Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID #{selectedUserForEdit.id} • @{selectedUserForEdit.username}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {editError && (
              <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleConfirmUpdateUser} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.username}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value.toLowerCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Role Akses: {selectedUserForEdit.id === 1 && "(Superadmin Terkunci)"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={selectedUserForEdit.id === 1}
                    onClick={() => setEditFormData({ ...editFormData, role: "user" })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      selectedUserForEdit.id === 1
                        ? "opacity-40 cursor-not-allowed"
                        : editFormData.role === "user"
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <UserIcon size={16} />
                    <span>Pembeli</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedUserForEdit.id === 1}
                    onClick={() => setEditFormData({ ...editFormData, role: "penjual" })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      selectedUserForEdit.id === 1
                        ? "opacity-40 cursor-not-allowed"
                        : editFormData.role === "penjual"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <ShoppingBagIcon size={16} />
                    <span>Penjual</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedUserForEdit.id === 1}
                    onClick={() => setEditFormData({ ...editFormData, role: "admin" })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      selectedUserForEdit.id === 1
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500"
                        : editFormData.role === "admin"
                        ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <ShieldIcon size={16} />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Status Akun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Status Akun:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={selectedUserForEdit.id === 1 || currentUser?.id === selectedUserForEdit.id}
                    onClick={() => setEditFormData({ ...editFormData, status: "active" })}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      editFormData.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <CheckCircleIcon size={14} className="shrink-0" />
                    <span>Aktif</span>
                  </button>
                  <button
                    type="button"
                    disabled={selectedUserForEdit.id === 1 || currentUser?.id === selectedUserForEdit.id}
                    onClick={() => setEditFormData({ ...editFormData, status: "suspended" })}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      editFormData.status === "suspended"
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500"
                        : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    <LockIcon size={14} className="shrink-0" />
                    <span>Dibekukan</span>
                  </button>
                </div>
                {editFormData.status === "suspended" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={editFormData.reason}
                      onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                      placeholder="Alasan pembekuan (akan dibaca user)..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Ganti Password Baru (Opsional) */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ubah Kata Sandi (Opsional)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editFormData.newPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                    placeholder="Biarkan kosong jika tidak ingin mengubah password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showEditPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimal 6 karakter jika ingin mengganti kata sandi pengguna ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-98 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingUser ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Reset Kata Sandi Langsung                                       */}
      {/* ========================================================================= */}
      {selectedUserForResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isResettingPassword && setSelectedUserForResetPassword(null)}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-amber-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <KeyIcon size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Reset Kata Sandi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Untuk akun {selectedUserForResetPassword.name} (@{selectedUserForResetPassword.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForResetPassword(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {resetPasswordResult ? (
              <div className="my-5 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mx-auto mb-2">
                    <CheckIcon size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kata Sandi Baru Berhasil Dibuat!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
                    Berikan kata sandi sementara ini kepada pemilik akun:
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0f172a] border border-emerald-500/30 flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                      {resetPasswordResult}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyNewPassword}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                    >
                      {isPasswordCopied ? "Tersalin!" : "Salin"}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserForResetPassword(null)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="my-4 space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sistem akan mengganti kata sandi akun ini. Anda dapat memasukkan kata sandi kustom atau mengosongkannya agar sistem menghasilkan kata sandi otomatis.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi Kustom (Opsional):
                  </label>
                  <input
                    type="text"
                    value={resetCustomPassword}
                    onChange={(e) => setResetCustomPassword(e.target.value)}
                    placeholder="Kosongkan untuk kata sandi acak otomatis..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForResetPassword(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmResetPassword}
                    disabled={isResettingPassword}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 active:scale-98 text-white shadow-md shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isResettingPassword ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mereset...</span>
                      </>
                    ) : (
                      <span>Reset Kata Sandi Sekarang</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Detail Pengguna Lengkap (Drawer / Card View)                    */}
      {/* ========================================================================= */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUserForDetail(null)}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Rincian Lengkap Pengguna
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="my-5 text-center">
              <div
                className={`flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-tr ${getAvatarGradient(
                  selectedUserForDetail.name,
                  selectedUserForDetail.role
                )} text-white font-extrabold text-2xl mx-auto shadow-lg mb-3`}
              >
                {selectedUserForDetail.name[0]?.toUpperCase()}
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedUserForDetail.name}
              </h4>
              <p className="text-xs text-slate-400">
                @{selectedUserForDetail.username} • {selectedUserForDetail.email}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                  ID #{selectedUserForDetail.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUserForDetail.role === "admin"
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25"
                      : selectedUserForDetail.role === "penjual"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                  }`}
                >
                  {selectedUserForDetail.role.toUpperCase()}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUserForDetail.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                  }`}
                >
                  {selectedUserForDetail.status === "active" ? "Aktif" : "Dibekukan"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Terdaftar Pada:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatDate(selectedUserForDetail.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Terakhir Diperbarui:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatDate(selectedUserForDetail.updated_at || selectedUserForDetail.created_at)}
                </span>
              </div>
              {selectedUserForDetail.suspension_reason && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <span className="block text-slate-400 mb-0.5">Alasan Pembekuan:</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    {selectedUserForDetail.suspension_reason}
                  </span>
                </div>
              )}
            </div>

            {/* Shortcut Aksi Langsung dari Detail */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = selectedUserForDetail;
                  setSelectedUserForDetail(null);
                  handleOpenEditModal(target);
                }}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-100 transition-colors cursor-pointer text-center"
              >
                Edit Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedUserForDetail;
                  setSelectedUserForDetail(null);
                  handleOpenResetPasswordModal(target);
                }}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-100 transition-colors cursor-pointer text-center"
              >
                Reset Sandi
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedUserForDetail;
                  setSelectedUserForDetail(null);
                  setSelectedUserForStatus(target);
                  setTargetStatusValue(target.status === "suspended" ? "active" : "suspended");
                }}
                className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer text-center"
              >
                Ubah Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Protokol Pembekuan Akun Pengguna                                */}
      {/* ========================================================================= */}
      {selectedUserForStatus && targetStatusValue === "suspended" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUserForStatus(null)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-rose-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

            <div className="mt-4 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Catatan Tambahan Admin (Ditampilkan di Popup User):
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Tuliskan catatan khusus atau alasan tambahan untuk pengguna..."
                rows={2}
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
              />
            </div>

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
                    <span>Menerapkan...</span>
                  </>
                ) : (
                  <span>Terapkan Pembekuan Akun</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Protokol Reaktivasi Akun Pengguna                              */}
      {/* ========================================================================= */}
      {selectedUserForStatus && targetStatusValue === "active" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedUserForStatus(null)}
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-emerald-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10">
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
              </div>
            </div>

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

      {/* ========================================================================= */}
      {/* MODAL 7: Protokol Aksi Massal (Bulk Status Update)                       */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsBulkModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-blue-500/20 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {bulkTargetStatus === "suspended"
                  ? "Pembekuan Akun Massal"
                  : "Reaktivasi Akun Massal"}
              </h3>
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
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
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

      {/* ========================================================================= */}
      {/* MODAL 8: Konfirmasi Hapus Massal (Bulk Delete)                           */}
      {/* ========================================================================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-rose-500/20 p-6 shadow-2xl animate-in zoom-in-95 duration-200 z-10 text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto mb-4 border border-rose-500/20">
              <TrashIcon size={26} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Hapus {selectedUserIds.length} Akun Terpilih?
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tindakan ini bersifat permanen. Seluruh akun yang dipilih akan dihapus dari sistem.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? "Menghapus..." : `Ya, Hapus (${selectedUserIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: Konfirmasi Hapus Pengguna Tunggal                               */}
      {/* ========================================================================= */}
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
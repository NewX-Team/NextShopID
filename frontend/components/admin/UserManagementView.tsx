"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AdminUserItem,
  AdminUserStats,
  adminService,
} from "@/services/admin.service";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth";
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
  ChevronDownIcon,
  MailIcon,
} from "@/components/ui/icons";

export const UserManagementView: React.FC = () => {
  const { token, user: currentUser } = useAuth();

  // State Data Pengguna & Statistik
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminUserStats>({
    total: 0,
    totalPembeli: 0,
    totalPenjual: 0,
    totalAdmin: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Modal & Aksi State
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserItem | null>(null);
  const [newRoleValue, setNewRoleValue] = useState<UserRole>("user");
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

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
    [token, searchTerm, selectedRole, sortBy, showToast]
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

  // Helper warna & badge avatar berdasarkan nama
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
            Kelola data akun pembeli, toko penjual, dan administrator NextShopID secara realtime.
          </p>
        </div>

        {/* Action Controls: Refresh & Auto Sync Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Status Sinkronisasi Terakhir */}
          <span className="hidden xl:inline-block text-[11px] text-slate-400">
            Sinkron: {lastSyncTime.toLocaleTimeString("id-ID")}
          </span>

          {/* Toggle Auto Sync */}
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

          {/* Tombol Segarkan Manual */}
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

      {/* KPI Cards: Statistik Pengguna Berdasarkan Role */}
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
          <p className="mt-1 text-[11px] text-slate-400">Seluruh entitas akun terdaftar</p>
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

      {/* Toolbar Filter & Pencarian */}
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

      {/* Tabel Data Pengguna */}
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
              Tidak ada data yang cocok dengan kriteria filter &quot;{searchTerm || selectedRole}&quot;. Coba reset filter Anda.
            </p>
            {(searchTerm || selectedRole !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("all");
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
                  <th scope="col" className="px-5 py-3.5">
                    Pengguna
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Role & Identitas
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Status Akun
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

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
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

                      {/* Kolom Status Akun */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span>Aktif</span>
                        </span>
                      </td>

                      {/* Kolom Tanggal Terdaftar */}
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                            <span>Ubah Role</span>
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
                                : "Hapus pengguna"
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

      {/* MODAL: Ubah Role Pengguna */}
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
                  {/* Option: Pembeli */}
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

                  {/* Option: Penjual */}
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

                  {/* Option: Admin */}
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

      {/* MODAL: Konfirmasi Hapus Pengguna */}
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

import { User, UserRole, UserStatus } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface AdminUserItem {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  suspension_reason?: string | null;
  verification_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserStats {
  total: number;
  totalPembeli: number;
  totalPenjual: number;
  totalAdmin: number;
  totalActive?: number;
  totalSuspended?: number;
}

export interface AdminGetUsersResponse {
  success: boolean;
  message?: string;
  data: AdminUserItem[];
  stats: AdminUserStats;
  meta: {
    totalFiltered: number;
    search: string;
    role: string;
    sort: string;
    timestamp: string;
  };
}

export interface AdminUpdateRoleResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    role: UserRole;
  };
}

export type VerificationDecision = "approve" | "reject" | "pending";

export interface AdminSellerVerificationItem {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  suspensionReason?: string | null;
  isStoreOpen: boolean;
  storeBalance: number;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  verificationSubmittedAt: string | null;
  verificationData: {
    ownerName?: string;
    idCardNumber?: string;
    phoneNumber?: string;
    businessType?: string;
    storeDescription?: string;
    idCardPhoto?: string;
    selfiePhoto?: string;
    businessDocPhoto?: string;
    notes?: string;
  } | null;
  verificationRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSellerBalanceItem {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  suspensionReason?: string | null;
  isStoreOpen: boolean;
  storeBalance: number;
  buyerBalance: number;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface AdminSellerBalanceStats {
  totalSellers: number;
  totalStoreBalance: number;
  averageStoreBalance: number;
  activeBalanceCount: number;
  zeroBalanceCount: number;
  openStoreCount: number;
}

export interface AdminGetSellerBalancesResponse {
  success: boolean;
  message?: string;
  data: AdminSellerBalanceItem[];
  stats: AdminSellerBalanceStats;
  meta: {
    totalFiltered: number;
    search: string;
    balanceStatus: string;
    storeStatus: string;
    sort: string;
    timestamp: string;
  };
}

export interface AdminBalanceMutationItem {
  id: number;
  userId: number;
  role: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  adminId: number | null;
  createdAt: string;
}

export interface AdminTopupBalanceResponse {
  success: boolean;
  message?: string;
  seller?: Partial<AdminSellerBalanceItem>;
  mutation?: AdminBalanceMutationItem;
}

export interface AdminGetBalanceHistoryResponse {
  success: boolean;
  message?: string;
  data: AdminBalanceMutationItem[];
}

export interface AdminVerificationStats {
  totalPenjual: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  unverifiedCount: number;
}

export interface AdminGetVerificationsResponse {
  success: boolean;
  message?: string;
  data: AdminSellerVerificationItem[];
  stats: AdminVerificationStats;
}

export interface AdminUpdateVerificationDecisionResponse {
  success: boolean;
  message?: string;
  seller?: AdminSellerVerificationItem;
  stats?: AdminVerificationStats;
}

export const adminService = {
  /**
   * Mengambil seluruh data pengguna dari endpoint GET /api/admin/users
   */
  async getUsers(
    token: string,
    filters?: {
      search?: string;
      role?: string;
      status?: string;
      sort?: string;
    }
  ): Promise<AdminGetUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.role && filters.role !== "all") queryParams.set("role", filters.role);
      if (filters?.status && filters.status !== "all") queryParams.set("status", filters.status);
      if (filters?.sort) queryParams.set("sort", filters.sort);

      const qs = queryParams.toString();
      const url = `${API_URL}/admin/users${qs ? `?${qs}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil data pengguna.",
          data: [],
          stats: { total: 0, totalPembeli: 0, totalPenjual: 0, totalAdmin: 0 },
          meta: { totalFiltered: 0, search: "", role: "all", sort: "newest", timestamp: "" },
        };
      }

      return result;
    } catch (error) {
      console.error("[adminService.getUsers] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend server.",
        data: [],
        stats: { total: 0, totalPembeli: 0, totalPenjual: 0, totalAdmin: 0 },
        meta: { totalFiltered: 0, search: "", role: "all", sort: "newest", timestamp: "" },
      };
    }
  },

  /**
   * Memperbarui role pengguna: PATCH /api/admin/users/:id/role
   */
  async updateUserRole(
    token: string,
    userId: number,
    role: UserRole
  ): Promise<AdminUpdateRoleResponse> {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.updateUserRole] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat memperbarui role.",
      };
    }
  },

  /**
   * Menambahkan pengguna baru (Pembeli, Penjual, atau Admin): POST /api/admin/users
   */
  async createUser(
    token: string,
    data: {
      name: string;
      username: string;
      email: string;
      password: string;
      role: UserRole;
      status?: UserStatus;
    }
  ): Promise<{ success: boolean; message?: string; user?: AdminUserItem }> {
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.createUser] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat menambahkan pengguna.",
      };
    }
  },

  /**
   * Mengedit data pengguna (Profil, Role, Status, Password Baru): PUT /api/admin/users/:id
   */
  async updateUser(
    token: string,
    userId: number,
    data: {
      name?: string;
      username?: string;
      email?: string;
      role?: UserRole;
      status?: UserStatus;
      newPassword?: string;
      reason?: string;
    }
  ): Promise<{ success: boolean; message?: string; user?: AdminUserItem }> {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.updateUser] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat memperbarui pengguna.",
      };
    }
  },

  /**
   * Reset password pengguna langsung oleh admin: POST /api/admin/users/:id/reset-password
   */
  async resetUserPassword(
    token: string,
    userId: number,
    customPassword?: string
  ): Promise<{ success: boolean; message?: string; newPassword?: string }> {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customPassword }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.resetUserPassword] Error:", error);
      return {
        success: false,
        message: "Gagal mereset kata sandi pengguna.",
      };
    }
  },

  /**
   * Menghapus banyak akun sekaligus (Bulk Delete): POST /api/admin/users/bulk-delete
   */
  async bulkDeleteUsers(
    token: string,
    userIds: number[]
  ): Promise<{ success: boolean; message?: string; deletedCount?: number }> {
    try {
      const response = await fetch(`${API_URL}/admin/users/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.bulkDeleteUsers] Error:", error);
      return {
        success: false,
        message: "Gagal menghapus pengguna secara massal.",
      };
    }
  },

  /**
   * Menghapus pengguna: DELETE /api/admin/users/:id
   */
  async deleteUser(
    token: string,
    userId: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.deleteUser] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat menghapus akun.",
      };
    }
  },

  /**
   * Mengubah status aktif/dibekukan akun pengguna: PATCH /api/admin/users/:id/status
   */
  async updateUserStatus(
    token: string,
    userId: number,
    status: UserStatus,
    reason?: string
  ): Promise<{ success: boolean; message?: string; user?: { id: number; status: UserStatus } }> {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reason }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.updateUserStatus] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat memperbarui status akun.",
      };
    }
  },

  /**
   * Mengubah status banyak akun sekaligus secara sistematis (Bulk Status Update)
   * PATCH /api/admin/users/bulk-status
   */
  async updateUsersBulkStatus(
    token: string,
    userIds: number[],
    status: UserStatus,
    reason?: string
  ): Promise<{ success: boolean; message?: string; updatedCount?: number }> {
    try {
      const response = await fetch(`${API_URL}/admin/users/bulk-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds, status, reason }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.updateUsersBulkStatus] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat memperbarui status akun massal.",
      };
    }
  },

  /**
   * Mengambil status server secara publik: GET /api/system/status
   */
  async getPublicServerStatus(): Promise<{ success: boolean; serverActive: boolean }> {
    try {
      const response = await fetch(`${API_URL}/system/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return { success: false, serverActive: true };
      }

      const result = await response.json();
      return {
        success: true,
        serverActive: typeof result.serverActive === "boolean" ? result.serverActive : true,
      };
    } catch {
      return { success: false, serverActive: true };
    }
  },

  /**
   * Mengubah status on/off server oleh admin: PATCH /api/admin/server-status
   */
  async updateServerStatus(
    token: string,
    active: boolean
  ): Promise<{ success: boolean; serverActive: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/admin/server-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.updateServerStatus] Error:", error);
      return {
        success: false,
        serverActive: active,
        message: "Gagal memperbarui status server.",
      };
    }
  },

  /**
   * Mengambil daftar seluruh verifikasi penjual dari endpoint GET /api/admin/verifications
   */
  async getVerifications(
    token: string,
    filters?: {
      search?: string;
      status?: string;
      sort?: string;
    }
  ): Promise<AdminGetVerificationsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.status && filters.status !== "all") queryParams.set("status", filters.status);
      if (filters?.sort) queryParams.set("sort", filters.sort);

      const qs = queryParams.toString();
      const url = `${API_URL}/admin/verifications${qs ? `?${qs}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil data verifikasi penjual.",
          data: [],
          stats: {
            totalPenjual: 0,
            pendingCount: 0,
            verifiedCount: 0,
            rejectedCount: 0,
            unverifiedCount: 0,
          },
        };
      }

      return result;
    } catch (error) {
      console.error("[adminService.getVerifications] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend server.",
        data: [],
        stats: {
          totalPenjual: 0,
          pendingCount: 0,
          verifiedCount: 0,
          rejectedCount: 0,
          unverifiedCount: 0,
        },
      };
    }
  },

  /**
   * Mengatur keputusan verifikasi penjual (ACC, Tolak dengan alasan, atau Pending)
   * PATCH /api/admin/verifications/:id/decision
   */
  async updateVerificationDecision(
    token: string,
    sellerId: number,
    payload: {
      decision: VerificationDecision;
      reason?: string;
    }
  ): Promise<AdminUpdateVerificationDecisionResponse> {
    try {
      const response = await fetch(`${API_URL}/admin/verifications/${sellerId}/decision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.updateVerificationDecision] Error:", error);
      return {
        success: false,
        message: "Gagal memproses keputusan verifikasi penjual.",
      };
    }
  },

  /**
   * Mengambil daftar saldo seluruh penjual secara realtime beserta statistik ringkasan
   * GET /api/admin/sellers/balances
   */
  async getSellerBalances(
    token: string,
    filters?: {
      search?: string;
      balanceStatus?: string;
      storeStatus?: string;
      sort?: string;
    }
  ): Promise<AdminGetSellerBalancesResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.balanceStatus) params.append("balanceStatus", filters.balanceStatus);
      if (filters?.storeStatus) params.append("storeStatus", filters.storeStatus);
      if (filters?.sort) params.append("sort", filters.sort);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`${API_URL}/admin/sellers/balances${qs}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil data saldo penjual.",
          data: [],
          stats: {
            totalSellers: 0,
            totalStoreBalance: 0,
            averageStoreBalance: 0,
            activeBalanceCount: 0,
            zeroBalanceCount: 0,
            openStoreCount: 0,
          },
          meta: {
            totalFiltered: 0,
            search: "",
            balanceStatus: "all",
            storeStatus: "all",
            sort: "highest_balance",
            timestamp: new Date().toISOString(),
          },
        };
      }

      return result;
    } catch (error) {
      console.error("[adminService.getSellerBalances] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend server.",
        data: [],
        stats: {
          totalSellers: 0,
          totalStoreBalance: 0,
          averageStoreBalance: 0,
          activeBalanceCount: 0,
          zeroBalanceCount: 0,
          openStoreCount: 0,
        },
        meta: {
          totalFiltered: 0,
          search: "",
          balanceStatus: "all",
          storeStatus: "all",
          sort: "highest_balance",
          timestamp: new Date().toISOString(),
        },
      };
    }
  },

  /**
   * Menambahkan saldo secara manual ke akun penjual oleh Administrator
   * POST /api/admin/sellers/:id/balance/topup
   */
  async topupSellerBalance(
    token: string,
    sellerId: number,
    payload: {
      amount: number;
      description?: string;
    }
  ): Promise<AdminTopupBalanceResponse> {
    try {
      const response = await fetch(`${API_URL}/admin/sellers/${sellerId}/balance/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[adminService.topupSellerBalance] Error:", error);
      return {
        success: false,
        message: "Gagal menambahkan saldo akun penjual.",
      };
    }
  },

  /**
   * Mengambil riwayat mutasi saldo penjual
   * GET /api/admin/sellers/:id/balance/history
   */
  async getSellerBalanceHistory(
    token: string,
    sellerId: number
  ): Promise<AdminGetBalanceHistoryResponse> {
    try {
      const response = await fetch(`${API_URL}/admin/sellers/${sellerId}/balance/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil riwayat mutasi saldo penjual.",
          data: [],
        };
      }

      return result;
    } catch (error) {
      console.error("[adminService.getSellerBalanceHistory] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend server.",
        data: [],
      };
    }
  },
};

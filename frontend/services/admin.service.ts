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
};

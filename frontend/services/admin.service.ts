import { User, UserRole } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface AdminUserItem {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AdminUserStats {
  total: number;
  totalPembeli: number;
  totalPenjual: number;
  totalAdmin: number;
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
      sort?: string;
    }
  ): Promise<AdminGetUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.role && filters.role !== "all") queryParams.set("role", filters.role);
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

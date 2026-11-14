import { Request, Response } from "express";
import { db, isServerActive, setServerActive } from "../config/database";
import { UserRole, UserStatus } from "../types/auth.types";

export interface AdminUserListItem {
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

export class AdminController {
  /**
   * Mengambil daftar seluruh pengguna dengan filter pencarian, filter role, dan statistik agregat
   * GET /api/admin/users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const roleFilter = typeof req.query.role === "string" ? req.query.role.trim() : "all";
      const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "all";
      const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "newest";

      // 1. Hitung statistik keseluruhan tanpa terpengaruh filter
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as totalPembeli,
          SUM(CASE WHEN role = 'penjual' THEN 1 ELSE 0 END) as totalPenjual,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as totalAdmin,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as totalActive,
          SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as totalSuspended
        FROM users
      `);
      const statsResult = statsStmt.get() as unknown as {
        total: number;
        totalPembeli: number;
        totalPenjual: number;
        totalAdmin: number;
        totalActive: number;
        totalSuspended: number;
      };

      // 2. Susun query pencarian dan pemfilteran dinamis
      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (search) {
        conditions.push("(name LIKE ? OR username LIKE ? OR email LIKE ?)");
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (roleFilter && roleFilter !== "all" && ["admin", "penjual", "user"].includes(roleFilter)) {
        conditions.push("role = ?");
        params.push(roleFilter);
      }

      if (statusFilter && statusFilter !== "all" && ["active", "suspended"].includes(statusFilter)) {
        conditions.push("status = ?");
        params.push(statusFilter);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      let orderBy = "ORDER BY created_at DESC, id DESC";
      if (sort === "oldest") {
        orderBy = "ORDER BY created_at ASC, id ASC";
      } else if (sort === "name_asc") {
        orderBy = "ORDER BY name COLLATE NOCASE ASC";
      } else if (sort === "name_desc") {
        orderBy = "ORDER BY name COLLATE NOCASE DESC";
      }

      const query = `
        SELECT id, name, username, email, role, status, suspension_reason, created_at, updated_at
        FROM users
        ${whereClause}
        ${orderBy}
      `;

      const listStmt = db.prepare(query);
      const rawUsers = listStmt.all(...params) as unknown as AdminUserListItem[];

      res.json({
        success: true,
        message: "Data pengguna berhasil diambil.",
        data: rawUsers,
        stats: {
          total: statsResult.total || 0,
          totalPembeli: statsResult.totalPembeli || 0,
          totalPenjual: statsResult.totalPenjual || 0,
          totalAdmin: statsResult.totalAdmin || 0,
          totalActive: statsResult.totalActive || 0,
          totalSuspended: statsResult.totalSuspended || 0,
        },
        meta: {
          totalFiltered: rawUsers.length,
          search,
          role: roleFilter,
          status: statusFilter,
          sort,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[AdminController.getUsers] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data pengguna dari basis data.",
      });
    }
  }

  /**
   * Mengubah role akun pengguna
   * PATCH /api/admin/users/:id/role
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const targetId = parseInt(req.params.id as string, 10);
      const { role } = req.body;

      if (isNaN(targetId) || targetId <= 0) {
        res.status(400).json({
          success: false,
          message: "ID pengguna tidak valid.",
        });
        return;
      }

      if (!["admin", "penjual", "user"].includes(role)) {
        res.status(400).json({
          success: false,
          message: "Role tidak valid. Pilihan: 'admin', 'penjual', atau 'user'.",
        });
        return;
      }

      // Lindungi Superadmin utama (ID 1 atau username 'admin') dari perubahan role
      if (targetId === 1) {
        res.status(403).json({
          success: false,
          message: "Role Superadmin utama (#1) tidak boleh diubah demi keamanan sistem.",
        });
        return;
      }

      const findStmt = db.prepare("SELECT id, name, username, role FROM users WHERE id = ?");
      const user = findStmt.get(targetId) as unknown as AdminUserListItem | undefined;

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
        return;
      }

      const updateStmt = db.prepare(`
        UPDATE users 
        SET role = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(role, targetId);

      res.json({
        success: true,
        message: `Role pengguna '${user.name}' berhasil diperbarui menjadi '${role}'.`,
        user: {
          id: targetId,
          role,
        },
      });
    } catch (error) {
      console.error("[AdminController.updateUserRole] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui role pengguna.",
      });
    }
  }

  /**
   * Mengubah status aktif / dibekukan akun pengguna (Pembeli atau Penjual)
   * PATCH /api/admin/users/:id/status
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const targetId = parseInt(req.params.id as string, 10);
      const { status, reason } = req.body;

      if (isNaN(targetId) || targetId <= 0) {
        res.status(400).json({
          success: false,
          message: "ID pengguna tidak valid.",
        });
        return;
      }

      if (!["active", "suspended"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Status tidak valid. Pilihan: 'active' atau 'suspended'.",
        });
        return;
      }

      // Lindungi Superadmin utama (#1)
      if (targetId === 1) {
        res.status(403).json({
          success: false,
          message: "Akun Superadmin utama (#1) tidak boleh dinonaktifkan.",
        });
        return;
      }

      if (req.user && req.user.id === targetId) {
        res.status(400).json({
          success: false,
          message: "Anda tidak dapat membekukan akun Anda sendiri yang sedang aktif digunakan.",
        });
        return;
      }

      const findStmt = db.prepare("SELECT id, name, username, role, status FROM users WHERE id = ?");
      const user = findStmt.get(targetId) as unknown as AdminUserListItem | undefined;

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
        return;
      }

      const suspensionReason = status === "suspended" ? (reason || "Akun Anda dibekukan oleh admin platform.") : null;

      const updateStmt = db.prepare(`
        UPDATE users 
        SET status = ?, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(status, suspensionReason, targetId);

      const statusDesc = status === "active" ? "diaktifkan kembali" : "dibekukan (nonaktif)";
      res.json({
        success: true,
        message: `Akun pengguna '${user.name}' (@${user.username}) berhasil ${statusDesc}.`,
        user: {
          id: targetId,
          status,
          suspension_reason: suspensionReason,
        },
      });
    } catch (error) {
      console.error("[AdminController.updateUserStatus] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui status akun pengguna.",
      });
    }
  }

  /**
   * Mengubah status banyak akun pengguna sekaligus secara sistematis (Bulk Update Status)
   * PATCH /api/admin/users/bulk-status
   */
  async updateUsersBulkStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, status, reason } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Daftar ID pengguna (userIds) wajib disertakan sebagai array.",
        });
        return;
      }

      if (!["active", "suspended"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Status tidak valid. Pilihan: 'active' atau 'suspended'.",
        });
        return;
      }

      // Filter akun yang dilindungi: Superadmin #1 dan akun admin yang sedang login
      const currentAdminId = req.user?.id;
      const validTargetIds = userIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id) && id > 1 && id !== currentAdminId);

      if (validTargetIds.length === 0) {
        res.status(400).json({
          success: false,
          message:
            "Tidak ada akun yang dapat diubah statusnya (Superadmin #1 dan akun aktif Anda terlindungi).",
        });
        return;
      }

      const suspensionReason = status === "suspended" ? (reason || "Akun dibekukan oleh admin platform.") : null;

      const placeholders = validTargetIds.map(() => "?").join(",");
      const updateStmt = db.prepare(`
        UPDATE users
        SET status = ?, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `);

      updateStmt.run(status, suspensionReason, ...validTargetIds);

      const statusDesc = status === "active" ? "diaktifkan kembali" : "dibekukan";
      res.json({
        success: true,
        message: `${validTargetIds.length} akun pengguna berhasil ${statusDesc}.`,
        updatedCount: validTargetIds.length,
        status,
        reason: suspensionReason,
      });
    } catch (error) {
      console.error("[AdminController.updateUsersBulkStatus] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui status akun secara massal.",
      });
    }
  }

  /**
   * Menghapus akun pengguna
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const targetId = parseInt(req.params.id as string, 10);

      if (isNaN(targetId) || targetId <= 0) {
        res.status(400).json({
          success: false,
          message: "ID pengguna tidak valid.",
        });
        return;
      }

      // Lindungi Superadmin dan akun diri sendiri
      if (targetId === 1) {
        res.status(403).json({
          success: false,
          message: "Akun Superadmin utama tidak dapat dihapus.",
        });
        return;
      }

      if (req.user && req.user.id === targetId) {
        res.status(400).json({
          success: false,
          message: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.",
        });
        return;
      }

      const findStmt = db.prepare("SELECT id, name, username FROM users WHERE id = ?");
      const user = findStmt.get(targetId) as unknown as AdminUserListItem | undefined;

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
        return;
      }

      const deleteStmt = db.prepare("DELETE FROM users WHERE id = ?");
      deleteStmt.run(targetId);

      res.json({
        success: true,
        message: `Pengguna '${user.name}' (${user.username}) berhasil dihapus dari sistem.`,
      });
    } catch (error) {
      console.error("[AdminController.deleteUser] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghapus pengguna.",
      });
    }
  }

  /**
   * Mengambil status aktif/nonaktif server
   * GET /api/admin/server-status
   */
  async getServerStatus(_req: Request, res: Response): Promise<void> {
    try {
      const active = isServerActive();
      res.json({
        success: true,
        serverActive: active,
      });
    } catch (error) {
      console.error("[AdminController.getServerStatus] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil status server.",
      });
    }
  }

  /**
   * Memperbarui status on/off server
   * PATCH /api/admin/server-status
   */
  async updateServerStatus(req: Request, res: Response): Promise<void> {
    try {
      const { active } = req.body;
      if (typeof active !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Field 'active' harus berupa boolean (true atau false).",
        });
        return;
      }

      setServerActive(active);
      res.json({
        success: true,
        serverActive: active,
        message: `Server NextShopID berhasil ${active ? "diaktifkan (ON)" : "dinonaktifkan (OFF)"}.`,
      });
    } catch (error) {
      console.error("[AdminController.updateServerStatus] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui status server.",
      });
    }
  }
}

export const adminController = new AdminController();

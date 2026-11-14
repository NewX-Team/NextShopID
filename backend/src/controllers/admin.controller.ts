import { Request, Response } from "express";
import bcrypt from "bcryptjs";
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
   * Menambahkan pengguna baru (Pembeli, Penjual, atau Admin)
   * POST /api/admin/users
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, username, email, password, role, status } = req.body;

      if (!name || !username || !email || !password) {
        res.status(400).json({
          success: false,
          message: "Field nama, username, email, dan password wajib diisi.",
        });
        return;
      }

      const trimmedName = String(name).trim();
      const trimmedUsername = String(username).trim().toLowerCase();
      const trimmedEmail = String(email).trim().toLowerCase();
      const rawPassword = String(password);
      const userRole: UserRole = ["admin", "penjual", "user"].includes(role) ? role : "user";
      const userStatus: UserStatus = ["active", "suspended"].includes(status) ? status : "active";

      if (trimmedName.length < 2) {
        res.status(400).json({
          success: false,
          message: "Nama lengkap minimal 2 karakter.",
        });
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(trimmedUsername)) {
        res.status(400).json({
          success: false,
          message: "Username harus 3-30 karakter alfanumerik atau underscore (_).",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        res.status(400).json({
          success: false,
          message: "Format email tidak valid.",
        });
        return;
      }

      if (rawPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "Password minimal 6 karakter.",
        });
        return;
      }

      // Periksa apakah username atau email sudah ada
      const checkStmt = db.prepare("SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?");
      const existingUser = checkStmt.get(trimmedUsername, trimmedEmail) as { id: number; username: string; email: string } | undefined;

      if (existingUser) {
        const field = existingUser.username.toLowerCase() === trimmedUsername ? "Username" : "Email";
        res.status(400).json({
          success: false,
          message: `${field} '${field === "Username" ? trimmedUsername : trimmedEmail}' sudah terdaftar.`,
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const insertStmt = db.prepare(`
        INSERT INTO users (name, username, email, password, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(trimmedName, trimmedUsername, trimmedEmail, hashedPassword, userRole, userStatus);
      const newId = Number(result.lastInsertRowid);

      const findStmt = db.prepare("SELECT id, name, username, email, role, status, suspension_reason, created_at, updated_at FROM users WHERE id = ?");
      const newUser = findStmt.get(newId) as unknown as AdminUserListItem;

      res.status(201).json({
        success: true,
        message: `Pengguna '${trimmedName}' (@${trimmedUsername}) berhasil ditambahkan sebagai ${userRole}.`,
        user: newUser,
      });
    } catch (error) {
      console.error("[AdminController.createUser] Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menambahkan pengguna.",
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
   * Mengedit data lengkap pengguna (Profil, Role, Status, Password Baru)
   * PUT /api/admin/users/:id
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const targetId = parseInt(req.params.id as string, 10);
      const { name, username, email, role, status, newPassword, reason } = req.body;

      if (isNaN(targetId) || targetId <= 0) {
        res.status(400).json({
          success: false,
          message: "ID pengguna tidak valid.",
        });
        return;
      }

      const findStmt = db.prepare(
        "SELECT id, name, username, email, role, status, suspension_reason FROM users WHERE id = ?"
      );
      const currentUser = findStmt.get(targetId) as unknown as AdminUserListItem | undefined;

      if (!currentUser) {
        res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
        return;
      }

      const isRootAdmin = targetId === 1;
      const isCurrentAuthUser = req.user && req.user.id === targetId;

      const trimmedName = name ? String(name).trim() : currentUser.name;
      const trimmedUsername = username ? String(username).trim().toLowerCase() : currentUser.username;
      const trimmedEmail = email ? String(email).trim().toLowerCase() : currentUser.email;

      if (trimmedName.length < 2) {
        res.status(400).json({
          success: false,
          message: "Nama lengkap minimal 2 karakter.",
        });
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(trimmedUsername)) {
        res.status(400).json({
          success: false,
          message: "Username harus 3-30 karakter alfanumerik atau underscore (_).",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        res.status(400).json({
          success: false,
          message: "Format email tidak valid.",
        });
        return;
      }

      // Proteksi Superadmin #1 dan akun sendiri
      let targetRole = currentUser.role;
      if (role && ["admin", "penjual", "user"].includes(role)) {
        if (isRootAdmin && role !== "admin") {
          res.status(403).json({
            success: false,
            message: "Role Superadmin utama (#1) tidak boleh diubah.",
          });
          return;
        }
        targetRole = role;
      }

      let targetStatus: UserStatus = currentUser.status;
      let suspensionReason: string | null = currentUser.suspension_reason ?? null;
      if (status && ["active", "suspended"].includes(status)) {
        if (isRootAdmin && status === "suspended") {
          res.status(403).json({
            success: false,
            message: "Akun Superadmin utama (#1) tidak boleh dinonaktifkan.",
          });
          return;
        }
        if (isCurrentAuthUser && status === "suspended") {
          res.status(400).json({
            success: false,
            message: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
          });
          return;
        }
        targetStatus = status;
        suspensionReason =
          status === "suspended"
            ? (reason || currentUser.suspension_reason || "Akun dibekukan oleh administrator.")
            : null;
      }

      // Validasi duplikasi username & email terhadap user lain
      const duplicateStmt = db.prepare(
        "SELECT id, username, email FROM users WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND id != ?"
      );
      const duplicate = duplicateStmt.get(trimmedUsername, trimmedEmail, targetId) as
        | { id: number; username: string; email: string }
        | undefined;
      if (duplicate) {
        const field = duplicate.username.toLowerCase() === trimmedUsername ? "Username" : "Email";
        res.status(400).json({
          success: false,
          message: `${field} '${field === "Username" ? trimmedUsername : trimmedEmail}' sudah digunakan akun lain.`,
        });
        return;
      }

      // Update password jika diisi
      if (newPassword && String(newPassword).trim().length > 0) {
        const rawPwd = String(newPassword).trim();
        if (rawPwd.length < 6) {
          res.status(400).json({
            success: false,
            message: "Password baru minimal 6 karakter.",
          });
          return;
        }
        const hashedPassword = await bcrypt.hash(rawPwd, 10);
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, targetId);
      }

      // Update data pengguna di database
      const updateStmt = db.prepare(`
        UPDATE users
        SET name = ?, username = ?, email = ?, role = ?, status = ?, suspension_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      updateStmt.run(
        trimmedName,
        trimmedUsername,
        trimmedEmail,
        targetRole,
        targetStatus,
        suspensionReason,
        targetId
      );

      const updatedUserStmt = db.prepare(
        "SELECT id, name, username, email, role, status, suspension_reason, created_at, updated_at FROM users WHERE id = ?"
      );
      const updatedUser = updatedUserStmt.get(targetId) as unknown as AdminUserListItem;

      res.json({
        success: true,
        message: `Data akun '${trimmedName}' (@${trimmedUsername}) berhasil diperbarui.`,
        user: updatedUser,
      });
    } catch (error) {
      console.error("[AdminController.updateUser] Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memperbarui data pengguna.",
      });
    }
  }

  /**
   * Menghapus banyak akun pengguna sekaligus secara massal
   * POST /api/admin/users/bulk-delete
   */
  async bulkDeleteUsers(req: Request, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Daftar ID pengguna (userIds) wajib disertakan sebagai array.",
        });
        return;
      }

      const currentAdminId = req.user?.id;
      const validTargetIds = userIds
        .map((id) => Number(id))
        .filter((id) => !isNaN(id) && id > 1 && id !== currentAdminId);

      if (validTargetIds.length === 0) {
        res.status(400).json({
          success: false,
          message:
            "Tidak ada akun valid yang dapat dihapus (Superadmin #1 dan akun aktif Anda terlindungi).",
        });
        return;
      }

      const placeholders = validTargetIds.map(() => "?").join(",");
      const deleteStmt = db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`);
      deleteStmt.run(...validTargetIds);

      res.json({
        success: true,
        message: `${validTargetIds.length} akun pengguna berhasil dihapus dari sistem.`,
        deletedCount: validTargetIds.length,
      });
    } catch (error) {
      console.error("[AdminController.bulkDeleteUsers] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghapus pengguna secara massal.",
      });
    }
  }

  /**
   * Reset kata sandi pengguna secara langsung oleh admin
   * POST /api/admin/users/:id/reset-password
   */
  async resetUserPassword(req: Request, res: Response): Promise<void> {
    try {
      const targetId = parseInt(req.params.id as string, 10);
      const { customPassword } = req.body;

      if (isNaN(targetId) || targetId <= 0) {
        res.status(400).json({
          success: false,
          message: "ID pengguna tidak valid.",
        });
        return;
      }

      const findStmt = db.prepare("SELECT id, name, username FROM users WHERE id = ?");
      const user = findStmt.get(targetId) as { id: number; name: string; username: string } | undefined;

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan.",
        });
        return;
      }

      let newPass = customPassword ? String(customPassword).trim() : "";
      if (!newPass) {
        newPass = "NextShop" + Math.floor(1000 + Math.random() * 9000);
      } else if (newPass.length < 6) {
        res.status(400).json({
          success: false,
          message: "Password baru minimal 6 karakter.",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPass, 10);
      db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        hashedPassword,
        targetId
      );

      res.json({
        success: true,
        message: `Kata sandi untuk '${user.name}' (@${user.username}) berhasil direset.`,
        newPassword: newPass,
        temporaryPassword: newPass,
      });
    } catch (error) {
      console.error("[AdminController.resetUserPassword] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mereset kata sandi pengguna.",
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

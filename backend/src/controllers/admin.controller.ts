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
  verification_status?: string | null;
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
        SELECT id, name, username, email, role, status, suspension_reason, verification_status, created_at, updated_at
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

  /**
   * Mengambil daftar seluruh penjual dan status verifikasi mereka (ACC, Tolak, Pending, Unverified)
   * GET /api/admin/verifications
   */
  async getVerifications(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "all";
      const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "newest";

      // 1. Hitung statistik keseluruhan verifikasi penjual realtime
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(*) as totalPenjual,
          SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verifiedCount,
          SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount,
          SUM(CASE WHEN verification_status = 'unverified' OR verification_status IS NULL THEN 1 ELSE 0 END) as unverifiedCount
        FROM users
        WHERE role = 'penjual'
      `);

      const statsResult = statsStmt.get() as unknown as {
        totalPenjual: number;
        pendingCount: number;
        verifiedCount: number;
        rejectedCount: number;
        unverifiedCount: number;
      };

      // 2. Susun kueri pemfilteran
      const conditions: string[] = ["role = 'penjual'"];
      const params: (string | number)[] = [];

      if (search) {
        conditions.push("(name LIKE ? OR username LIKE ? OR email LIKE ? OR verification_data LIKE ?)");
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern, pattern);
      }

      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "unverified") {
          conditions.push("(verification_status = 'unverified' OR verification_status IS NULL)");
        } else if (["pending", "verified", "rejected"].includes(statusFilter)) {
          conditions.push("verification_status = ?");
          params.push(statusFilter);
        }
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      let orderBy = "ORDER BY CASE WHEN verification_status = 'pending' THEN 0 ELSE 1 END, created_at DESC, id DESC";
      if (sort === "submitted_newest") {
        orderBy = "ORDER BY verification_submitted_at DESC, id DESC";
      } else if (sort === "oldest") {
        orderBy = "ORDER BY created_at ASC, id ASC";
      } else if (sort === "name_asc") {
        orderBy = "ORDER BY name COLLATE NOCASE ASC";
      }

      const query = `
        SELECT 
          id, name, username, email, role, status, suspension_reason,
          is_store_open, store_balance, verification_status,
          verification_submitted_at, verification_data,
          verification_rejection_reason, created_at, updated_at
        FROM users
        ${whereClause}
        ${orderBy}
      `;

      const listStmt = db.prepare(query);
      const rows = listStmt.all(...params) as unknown as Array<{
        id: number;
        name: string;
        username: string;
        email: string;
        role: string;
        status: string;
        suspension_reason: string | null;
        is_store_open: number;
        store_balance: number;
        verification_status: string | null;
        verification_submitted_at: string | null;
        verification_data: string | null;
        verification_rejection_reason: string | null;
        created_at: string;
        updated_at: string;
      }>;

      const sellers = rows.map((r) => {
        let parsedData: any = null;
        if (r.verification_data) {
          try {
            parsedData = JSON.parse(r.verification_data);
          } catch {
            parsedData = null;
          }
        }

        return {
          id: r.id,
          name: r.name,
          username: r.username,
          email: r.email,
          role: r.role,
          status: r.status,
          suspensionReason: r.suspension_reason,
          isStoreOpen: r.is_store_open !== 0,
          storeBalance: Number(r.store_balance || 0),
          verificationStatus: r.verification_status || "unverified",
          verificationSubmittedAt: r.verification_submitted_at,
          verificationData: parsedData,
          verificationRejectionReason: r.verification_rejection_reason,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      res.json({
        success: true,
        message: "Data verifikasi penjual berhasil diambil.",
        data: sellers,
        stats: {
          totalPenjual: statsResult.totalPenjual || 0,
          pendingCount: statsResult.pendingCount || 0,
          verifiedCount: statsResult.verifiedCount || 0,
          rejectedCount: statsResult.rejectedCount || 0,
          unverifiedCount: statsResult.unverifiedCount || 0,
        },
      });
    } catch (error) {
      console.error("[AdminController.getVerifications] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data verifikasi penjual.",
      });
    }
  }

  /**
   * Mengatur keputusan verifikasi toko penjual: ACC (approve), Tolak (reject) dengan alasan, atau Pending
   * PATCH /api/admin/verifications/:id/decision
   */
  async updateVerificationDecision(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = Number(req.params.id);
      if (!sellerId || isNaN(sellerId)) {
        res.status(400).json({
          success: false,
          message: "ID penjual tidak valid.",
        });
        return;
      }

      const { decision, reason } = req.body;
      if (!decision || !["approve", "reject", "pending"].includes(decision)) {
        res.status(400).json({
          success: false,
          message: "Keputusan tidak valid. Pilihan yang diperbolehkan: 'approve', 'reject', atau 'pending'.",
        });
        return;
      }

      // Pastikan akun penjual ada
      const checkStmt = db.prepare("SELECT id, name, verification_status FROM users WHERE id = ? AND role = 'penjual'");
      const current = checkStmt.get(sellerId) as unknown as { id: number; name: string; verification_status: string } | undefined;

      if (!current) {
        res.status(404).json({
          success: false,
          message: "Akun penjual tidak ditemukan.",
        });
        return;
      }

      let newStatus = "unverified";
      let newReason: string | null = null;
      let message = "";

      if (decision === "approve") {
        newStatus = "verified";
        newReason = null;
        message = `Toko '${current.name}' berhasil disetujui (ACC). Lencana 'Official Verified Merchant' telah aktif.`;
      } else if (decision === "reject") {
        const trimmedReason = typeof reason === "string" ? reason.trim() : "";
        if (!trimmedReason) {
          res.status(400).json({
            success: false,
            message: "Alasan penolakan wajib diisi untuk memberikan instruksi perbaikan kepada penjual.",
          });
          return;
        }
        newStatus = "rejected";
        newReason = trimmedReason;
        message = `Pengajuan verifikasi toko '${current.name}' telah ditolak dengan alasan: "${trimmedReason}".`;
      } else if (decision === "pending") {
        newStatus = "pending";
        newReason = typeof reason === "string" && reason.trim() ? reason.trim() : null;
        message = `Status verifikasi toko '${current.name}' berhasil diatur ke 'Menunggu Tinjauan' (Pending).`;
      }

      const updateStmt = db.prepare(`
        UPDATE users
        SET verification_status = ?,
            verification_rejection_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND role = 'penjual'
      `);

      updateStmt.run(newStatus, newReason, sellerId);

      // Ambil data penjual yang telah diperbarui
      const selectStmt = db.prepare(`
        SELECT 
          id, name, username, email, role, status, suspension_reason,
          is_store_open, store_balance, verification_status,
          verification_submitted_at, verification_data,
          verification_rejection_reason, created_at, updated_at
        FROM users
        WHERE id = ?
      `);
      const row = selectStmt.get(sellerId) as unknown as any;

      let parsedData: any = null;
      if (row.verification_data) {
        try {
          parsedData = JSON.parse(row.verification_data);
        } catch {
          parsedData = null;
        }
      }

      const updatedSeller = {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        suspensionReason: row.suspension_reason,
        isStoreOpen: row.is_store_open !== 0,
        storeBalance: Number(row.store_balance || 0),
        verificationStatus: row.verification_status,
        verificationSubmittedAt: row.verification_submitted_at,
        verificationData: parsedData,
        verificationRejectionReason: row.verification_rejection_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      // Hitung ulang statistik realtime
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(*) as totalPenjual,
          SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verifiedCount,
          SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount,
          SUM(CASE WHEN verification_status = 'unverified' OR verification_status IS NULL THEN 1 ELSE 0 END) as unverifiedCount
        FROM users
        WHERE role = 'penjual'
      `);
      const latestStats = statsStmt.get() as unknown as any;

      res.json({
        success: true,
        message,
        seller: updatedSeller,
        stats: {
          totalPenjual: latestStats.totalPenjual || 0,
          pendingCount: latestStats.pendingCount || 0,
          verifiedCount: latestStats.verifiedCount || 0,
          rejectedCount: latestStats.rejectedCount || 0,
          unverifiedCount: latestStats.unverifiedCount || 0,
        },
      });
    } catch (error) {
      console.error("[AdminController.updateVerificationDecision] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui status verifikasi penjual.",
      });
    }
  }

  /**
   * Mengambil daftar seluruh saldo akun penjual beserta statistik finansial realtime
   * GET /api/admin/sellers/balances
   */
  async getSellerBalances(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const balanceStatusQuery = req.query.balanceStatus || req.query.balance_status;
      const balanceStatus = typeof balanceStatusQuery === "string" ? balanceStatusQuery.trim() : "all";
      const storeStatusQuery = req.query.storeStatus || req.query.store_status;
      const storeStatus = typeof storeStatusQuery === "string" ? storeStatusQuery.trim() : "all";
      const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "highest_balance";

      // 1. Hitung statistik finansial penjual agregat secara realtime
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(*) as totalPenjual,
          COALESCE(SUM(store_balance), 0) as totalStoreBalance,
          COALESCE(AVG(store_balance), 0) as averageStoreBalance,
          SUM(CASE WHEN store_balance > 0 THEN 1 ELSE 0 END) as sellersWithBalanceCount,
          SUM(CASE WHEN store_balance <= 0 OR store_balance IS NULL THEN 1 ELSE 0 END) as sellersWithZeroBalanceCount
        FROM users
        WHERE role = 'penjual'
      `);

      const statsResult = statsStmt.get() as unknown as {
        totalPenjual: number;
        totalStoreBalance: number;
        averageStoreBalance: number;
        sellersWithBalanceCount: number;
        sellersWithZeroBalanceCount: number;
      };

      // 2. Susun kueri pemfilteran
      const conditions: string[] = ["role = 'penjual'"];
      const params: (string | number)[] = [];

      if (search) {
        conditions.push("(name LIKE ? OR username LIKE ? OR email LIKE ?)");
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern);
      }

      if (balanceStatus === "has_balance") {
        conditions.push("store_balance > 0");
      } else if (balanceStatus === "zero_balance") {
        conditions.push("(store_balance <= 0 OR store_balance IS NULL)");
      }

      if (storeStatus === "open") {
        conditions.push("is_store_open = 1");
      } else if (storeStatus === "closed") {
        conditions.push("is_store_open = 0");
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      let orderBy = "ORDER BY store_balance DESC, name ASC";
      if (sort === "lowest_balance") {
        orderBy = "ORDER BY store_balance ASC, name ASC";
      } else if (sort === "newest") {
        orderBy = "ORDER BY created_at DESC, id DESC";
      } else if (sort === "name_asc") {
        orderBy = "ORDER BY name COLLATE NOCASE ASC";
      }

      const query = `
        SELECT 
          id, name, username, email, role, status, is_store_open, store_balance,
          verification_status, created_at, updated_at
        FROM users
        ${whereClause}
        ${orderBy}
      `;

      const listStmt = db.prepare(query);
      const rows = listStmt.all(...params) as unknown as Array<{
        id: number;
        name: string;
        username: string;
        email: string;
        role: string;
        status: string;
        is_store_open: number;
        store_balance: number;
        verification_status: string | null;
        created_at: string;
        updated_at: string;
      }>;

      const sellers = rows.map((r) => ({
        id: r.id,
        name: r.name,
        username: r.username,
        email: r.email,
        role: r.role,
        status: r.status,
        isStoreOpen: r.is_store_open !== 0,
        storeBalance: Number(r.store_balance || 0),
        verificationStatus: r.verification_status || "unverified",
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      res.json({
        success: true,
        message: "Data saldo akun penjual berhasil diambil.",
        data: sellers,
        stats: {
          totalPenjual: statsResult.totalPenjual || 0,
          totalSellers: statsResult.totalPenjual || 0,
          totalStoreBalance: Number(statsResult.totalStoreBalance || 0),
          averageStoreBalance: Math.round(Number(statsResult.averageStoreBalance || 0)),
          activeBalanceCount: statsResult.sellersWithBalanceCount || 0,
          sellersWithBalanceCount: statsResult.sellersWithBalanceCount || 0,
          zeroBalanceCount: statsResult.sellersWithZeroBalanceCount || 0,
          sellersWithZeroBalanceCount: statsResult.sellersWithZeroBalanceCount || 0,
        },
      });
    } catch (error) {
      console.error("[AdminController.getSellerBalances] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data saldo akun penjual.",
      });
    }
  }

  /**
   * Menambahkan saldo secara manual ke akun penjual oleh Administrator
   * POST /api/admin/sellers/:id/balance/topup
   */
  async topupSellerBalance(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = Number(req.params.id);
      if (!sellerId || isNaN(sellerId)) {
        res.status(400).json({
          success: false,
          message: "ID penjual tidak valid.",
        });
        return;
      }

      const { amount, description } = req.body;
      const parsedAmount = Number(amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({
          success: false,
          message: "Nominal penambahan saldo harus berupa angka positif lebih dari Rp 0.",
        });
        return;
      }

      if (parsedAmount > 500000000) {
        res.status(400).json({
          success: false,
          message: "Batas maksimal penambahan saldo manual adalah Rp 500.000.000 per transaksi.",
        });
        return;
      }

      // Ambil data penjual saat ini
      const checkStmt = db.prepare(`
        SELECT id, name, username, email, store_balance, is_store_open, verification_status, status
        FROM users
        WHERE id = ? AND role = 'penjual'
      `);
      const seller = checkStmt.get(sellerId) as unknown as {
        id: number;
        name: string;
        username: string;
        email: string;
        store_balance: number;
        is_store_open: number;
        verification_status: string | null;
        status: string;
      } | undefined;

      if (!seller) {
        res.status(404).json({
          success: false,
          message: "Akun penjual tidak ditemukan.",
        });
        return;
      }

      const adminId = req.user?.id || null;
      const balanceBefore = Number(seller.store_balance || 0);
      const balanceAfter = balanceBefore + parsedAmount;
      const noteDesc = typeof description === "string" && description.trim()
        ? description.trim()
        : "Penambahan saldo manual oleh Administrator";

      // Lakukan transaksi penambahan saldo dan pencatatan mutasi
      const updateBalanceStmt = db.prepare(`
        UPDATE users
        SET store_balance = store_balance + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND role = 'penjual'
      `);

      const insertMutationStmt = db.prepare(`
        INSERT INTO balance_mutations (
          user_id, role, type, amount, balance_before, balance_after, description, admin_id
        ) VALUES (?, 'penjual', 'manual_credit', ?, ?, ?, ?, ?)
      `);

      updateBalanceStmt.run(parsedAmount, sellerId);
      const mutationRes = insertMutationStmt.run(
        sellerId,
        parsedAmount,
        balanceBefore,
        balanceAfter,
        noteDesc,
        adminId
      );

      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(parsedAmount);

      const formattedNewBalance = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(balanceAfter);

      res.status(200).json({
        success: true,
        message: `Saldo sebesar ${formattedAmount} berhasil ditambahkan ke toko '${seller.name}'. Saldo saat ini: ${formattedNewBalance}.`,
        seller: {
          id: seller.id,
          name: seller.name,
          username: seller.username,
          email: seller.email,
          status: seller.status,
          isStoreOpen: seller.is_store_open !== 0,
          storeBalance: balanceAfter,
          verificationStatus: seller.verification_status || "unverified",
        },
        mutation: {
          id: mutationRes.lastInsertRowid,
          userId: sellerId,
          type: "manual_credit",
          amount: parsedAmount,
          balanceBefore,
          balanceAfter,
          description: noteDesc,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[AdminController.topupSellerBalance] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menambahkan saldo akun penjual.",
      });
    }
  }

  /**
   * Mengambil riwayat mutasi saldo akun penjual tertentu
   * GET /api/admin/sellers/:id/balance/history
   */
  async getSellerBalanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = Number(req.params.id);
      if (!sellerId || isNaN(sellerId)) {
        res.status(400).json({
          success: false,
          message: "ID penjual tidak valid.",
        });
        return;
      }

      const stmt = db.prepare(`
        SELECT id, user_id, role, type, amount, balance_before, balance_after, description, admin_id, created_at
        FROM balance_mutations
        WHERE user_id = ? AND role = 'penjual'
        ORDER BY created_at DESC, id DESC
        LIMIT 50
      `);

      const mutations = stmt.all(sellerId) as unknown as Array<{
        id: number;
        user_id: number;
        role: string;
        type: string;
        amount: number;
        balance_before: number;
        balance_after: number;
        description: string;
        admin_id: number | null;
        created_at: string;
      }>;

      res.json({
        success: true,
        message: "Riwayat mutasi saldo penjual berhasil diambil.",
        data: mutations.map((m) => ({
          id: m.id,
          userId: m.user_id,
          role: m.role,
          type: m.type,
          amount: m.amount,
          balanceBefore: m.balance_before,
          balanceAfter: m.balance_after,
          description: m.description,
          adminId: m.admin_id,
          createdAt: m.created_at,
        })),
      });
    } catch (error) {
      console.error("[AdminController.getSellerBalanceHistory] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil riwayat mutasi saldo penjual.",
      });
    }
  }

  /**
   * Mengambil daftar seluruh pengajuan penarikan saldo penjual (WD) beserta statistik realtime
   * GET /api/admin/sellers/withdrawals
   */
  async getSellerWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "all";
      const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "newest";

      // 1. Hitung statistik keseluruhan penarikan realtime
      const statsStmt = db.prepare(`
        SELECT 
          COUNT(*) as totalCount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCount,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as totalCompletedAmount,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as totalPendingAmount
        FROM seller_withdrawals
      `);

      const stats = statsStmt.get() as unknown as {
        totalCount: number;
        pendingCount: number;
        completedCount: number;
        rejectedCount: number;
        totalCompletedAmount: number;
        totalPendingAmount: number;
      };

      // 2. Susun kondisi WHERE
      const conditions: string[] = ["1=1"];
      const params: (string | number)[] = [];

      if (search) {
        conditions.push(`(
          u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR 
          w.provider_name LIKE ? OR w.account_number LIKE ? OR w.account_holder_name LIKE ?
        )`);
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern, pattern, pattern, pattern);
      }

      if (statusFilter && statusFilter !== "all") {
        if (["pending", "completed", "rejected"].includes(statusFilter)) {
          conditions.push("w.status = ?");
          params.push(statusFilter);
        }
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      let orderBy = "ORDER BY CASE WHEN w.status = 'pending' THEN 0 ELSE 1 END, w.created_at DESC, w.id DESC";
      if (sort === "oldest") {
        orderBy = "ORDER BY w.created_at ASC, w.id ASC";
      } else if (sort === "highest_amount") {
        orderBy = "ORDER BY w.amount DESC, w.id DESC";
      } else if (sort === "lowest_amount") {
        orderBy = "ORDER BY w.amount ASC, w.id DESC";
      }

      const query = `
        SELECT 
          w.id, w.seller_id, w.payout_account_id, w.account_type, w.provider_name,
          w.account_number, w.account_holder_name, w.amount, w.fee, w.net_amount,
          w.status, w.notes, w.admin_notes, w.rejection_reason, w.reviewed_by,
          w.reviewed_at, w.created_at, w.updated_at,
          u.name as seller_name, u.username as seller_username, u.email as seller_email,
          u.store_balance as seller_store_balance, u.verification_status as seller_verification_status,
          a.name as reviewer_name
        FROM seller_withdrawals w
        JOIN users u ON w.seller_id = u.id
        LEFT JOIN users a ON w.reviewed_by = a.id
        ${whereClause}
        ${orderBy}
      `;

      const stmt = db.prepare(query);
      const rows = stmt.all(...params) as unknown as Array<{
        id: number;
        seller_id: number;
        payout_account_id: number;
        account_type: string;
        provider_name: string;
        account_number: string;
        account_holder_name: string;
        amount: number;
        fee: number;
        net_amount: number;
        status: string;
        notes: string | null;
        admin_notes: string | null;
        rejection_reason: string | null;
        reviewed_by: number | null;
        reviewed_at: string | null;
        created_at: string;
        updated_at: string;
        seller_name: string;
        seller_username: string;
        seller_email: string;
        seller_store_balance: number;
        seller_verification_status: string | null;
        reviewer_name: string | null;
      }>;

      const data = rows.map((r) => ({
        id: r.id,
        sellerId: r.seller_id,
        sellerName: r.seller_name,
        sellerUsername: r.seller_username,
        sellerEmail: r.seller_email,
        sellerStoreBalance: Number(r.seller_store_balance || 0),
        sellerVerificationStatus: r.seller_verification_status || "unverified",
        payoutAccountId: r.payout_account_id,
        accountType: r.account_type,
        providerName: r.provider_name,
        accountNumber: r.account_number,
        accountHolderName: r.account_holder_name,
        amount: r.amount,
        fee: r.fee,
        netAmount: r.net_amount,
        status: r.status,
        notes: r.notes,
        adminNotes: r.admin_notes,
        rejectionReason: r.rejection_reason,
        reviewedBy: r.reviewed_by,
        reviewerName: r.reviewer_name,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      res.json({
        success: true,
        message: "Data pengajuan penarikan dana penjual berhasil diambil.",
        data,
        stats: {
          totalCount: stats.totalCount || 0,
          pendingCount: stats.pendingCount || 0,
          completedCount: stats.completedCount || 0,
          rejectedCount: stats.rejectedCount || 0,
          totalCompletedAmount: Number(stats.totalCompletedAmount || 0),
          totalPendingAmount: Number(stats.totalPendingAmount || 0),
        },
      });
    } catch (error) {
      console.error("[AdminController.getSellerWithdrawals] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data penarikan saldo penjual.",
      });
    }
  }

  /**
   * Menyetujui (ACC) atau Menolak pengajuan penarikan saldo penjual
   * PATCH /api/admin/sellers/withdrawals/:id/decision
   */
  async updateWithdrawalDecision(req: Request, res: Response): Promise<void> {
    try {
      const withdrawalId = Number(req.params.id);
      const adminId = req.user?.id || 1;
      const { decision, adminNotes, rejectionReason } = req.body;

      if (!withdrawalId || isNaN(withdrawalId)) {
        res.status(400).json({
          success: false,
          message: "ID penarikan tidak valid.",
        });
        return;
      }

      if (!decision || !["approve", "reject"].includes(decision)) {
        res.status(400).json({
          success: false,
          message: "Keputusan harus berupa 'approve' (ACC) atau 'reject' (Tolak).",
        });
        return;
      }

      // 1. Ambil data pengajuan penarikan saat ini
      const findStmt = db.prepare(`
        SELECT w.*, u.name as seller_name, u.store_balance
        FROM seller_withdrawals w
        JOIN users u ON w.seller_id = u.id
        WHERE w.id = ?
      `);
      const withdrawal = findStmt.get(withdrawalId) as unknown as any;

      if (!withdrawal) {
        res.status(404).json({
          success: false,
          message: "Data pengajuan penarikan tidak ditemukan.",
        });
        return;
      }

      if (withdrawal.status !== "pending") {
        res.status(400).json({
          success: false,
          message: `Transaksi penarikan ini sudah ${
            withdrawal.status === "completed" ? "disetujui (ACC)" : "ditolak"
          } sebelumnya dan tidak dapat diproses ulang.`,
        });
        return;
      }

      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(withdrawal.amount);

      if (decision === "approve") {
        // ACC / Setujui
        const defaultApproveNote =
          "Transaksi penarikan saldo telah berhasil diproses dan ditransfer. Silakan periksa mutasi rekening/dompet digital Anda.";
        const finalAdminNote = adminNotes ? String(adminNotes).trim() : defaultApproveNote;

        const updateStmt = db.prepare(`
          UPDATE seller_withdrawals
          SET status = 'completed',
              admin_notes = ?,
              rejection_reason = NULL,
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        updateStmt.run(finalAdminNote, adminId, withdrawalId);

        res.json({
          success: true,
          message: `Transaksi penarikan saldo sebesar ${formattedAmount} untuk toko '${withdrawal.seller_name}' berhasil disetujui (ACC).`,
          status: "completed",
          adminNotes: finalAdminNote,
        });
      } else {
        // Tolak / Reject
        const cleanReason = rejectionReason ? String(rejectionReason).trim() : "";
        if (!cleanReason || cleanReason.length < 3) {
          res.status(400).json({
            success: false,
            message:
              "Alasan penolakan penarikan wajib diisi minimal 3 karakter (misal: nama dan nomor rekening tidak sesuai).",
          });
          return;
        }

        const finalAdminNote = adminNotes
          ? String(adminNotes).trim()
          : `Penarikan ditolak admin: ${cleanReason}`;

        // Atomic transaction: update status, refund seller balance, dan catat mutasi pengembalian dana
        const currentBalance = Number(withdrawal.store_balance || 0);
        const balanceAfter = currentBalance + Number(withdrawal.amount);

        const updateWdStmt = db.prepare(`
          UPDATE seller_withdrawals
          SET status = 'rejected',
              rejection_reason = ?,
              admin_notes = ?,
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const refundBalanceStmt = db.prepare(`
          UPDATE users
          SET store_balance = store_balance + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const insertRefundMutationStmt = db.prepare(`
          INSERT INTO balance_mutations (
            user_id, role, type, amount, balance_before, balance_after, description, admin_id
          ) VALUES (?, 'penjual', 'refund', ?, ?, ?, ?, ?)
        `);

        updateWdStmt.run(cleanReason, finalAdminNote, adminId, withdrawalId);
        refundBalanceStmt.run(withdrawal.amount, withdrawal.seller_id);
        insertRefundMutationStmt.run(
          withdrawal.seller_id,
          withdrawal.amount,
          currentBalance,
          balanceAfter,
          `Pengembalian dana (refund) akibat penarikan saldo ditolak admin: ${cleanReason}`,
          adminId
        );

        res.json({
          success: true,
          message: `Transaksi penarikan saldo sebesar ${formattedAmount} untuk toko '${withdrawal.seller_name}' berhasil ditolak. Saldo sebesar ${formattedAmount} telah dikembalikan secara realtime ke saldo toko penjual.`,
          status: "rejected",
          rejectionReason: cleanReason,
          refundedAmount: withdrawal.amount,
          newSellerBalance: balanceAfter,
        });
      }
    } catch (error) {
      console.error("[AdminController.updateWithdrawalDecision] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memproses keputusan penarikan saldo.",
      });
    }
  }
}

export const adminController = new AdminController();

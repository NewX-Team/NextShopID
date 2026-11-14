import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Seluruh route di bawah ini diproteksi ketat: wajib login dan memiliki role 'admin'
router.use(authenticate, requireRole(["admin"]));

// Manajemen Pengguna
router.get("/users", adminController.getUsers.bind(adminController));
router.post("/users", adminController.createUser.bind(adminController));
router.patch("/users/bulk-status", adminController.updateUsersBulkStatus.bind(adminController));
router.post("/users/bulk-delete", adminController.bulkDeleteUsers.bind(adminController));
router.patch("/users/:id/role", adminController.updateUserRole.bind(adminController));
router.patch("/users/:id/status", adminController.updateUserStatus.bind(adminController));
router.put("/users/:id", adminController.updateUser.bind(adminController));
router.post("/users/:id/reset-password", adminController.resetUserPassword.bind(adminController));
router.delete("/users/:id", adminController.deleteUser.bind(adminController));

// Kontrol On/Off Server
router.get("/server-status", adminController.getServerStatus.bind(adminController));
router.patch("/server-status", adminController.updateServerStatus.bind(adminController));

export const adminRoutes = router;

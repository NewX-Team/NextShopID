import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Seluruh route di bawah ini diproteksi ketat: wajib login dan memiliki role 'admin'
router.use(authenticate, requireRole(["admin"]));

// Manajemen Pengguna
router.get("/users", adminController.getUsers.bind(adminController));
router.patch("/users/:id/role", adminController.updateUserRole.bind(adminController));
router.delete("/users/:id", adminController.deleteUser.bind(adminController));

export const adminRoutes = router;

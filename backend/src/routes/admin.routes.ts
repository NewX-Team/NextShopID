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

// Verifikasi & Kelayakan Merchant (Penjual)
router.get("/verifications", adminController.getVerifications.bind(adminController));
router.patch("/verifications/:id/decision", adminController.updateVerificationDecision.bind(adminController));

// Finansial - Saldo Penjual
router.get("/sellers/balances", adminController.getSellerBalances.bind(adminController));
router.post("/sellers/:id/balance/topup", adminController.topupSellerBalance.bind(adminController));
router.get("/sellers/:id/balance/history", adminController.getSellerBalanceHistory.bind(adminController));

// Finansial - Persetujuan Penarikan Saldo Penjual (WD)
router.get("/sellers/withdrawals", adminController.getSellerWithdrawals.bind(adminController));
router.patch("/sellers/withdrawals/:id/decision", adminController.updateWithdrawalDecision.bind(adminController));

// Kontrol On/Off Server
router.get("/server-status", adminController.getServerStatus.bind(adminController));
router.patch("/server-status", adminController.updateServerStatus.bind(adminController));

export const adminRoutes = router;

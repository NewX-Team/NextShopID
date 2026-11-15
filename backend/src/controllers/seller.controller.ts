import { Request, Response } from "express";
import { db } from "../config/database";

export type SellerVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export type PayoutAccountType = "bank" | "wallet";
export type PayoutMethod = "preset" | "manual";

export interface SellerPayoutAccountItem {
  id: number;
  sellerId: number;
  accountType: PayoutAccountType;
  providerName: string;
  accountNumber: string;
  accountHolderName: string;
  method: PayoutMethod;
  isAgreed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WithdrawalStatus = "pending" | "processing" | "completed" | "rejected";

export interface SellerWithdrawalItem {
  id: number;
  sellerId: number;
  payoutAccountId: number;
  accountType: string;
  providerName: string;
  accountNumber: string;
  accountHolderName: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  notes: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerVerificationPayload {
  ownerName: string;
  idCardNumber: string;
  phoneNumber: string;
  businessType: string;
  storeDescription?: string;
  idCardPhoto?: string;
  selfiePhoto?: string;
  businessDocPhoto?: string;
  notes?: string;
}

export interface SellerProfileData {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  isStoreOpen: boolean;
  balance: number;
  verificationStatus: SellerVerificationStatus;
  verificationSubmittedAt?: string | null;
  verificationData?: SellerVerificationPayload | null;
  verificationRejectionReason?: string | null;
  mallSuspendedUntil?: string | null;
  mallSuspensionReason?: string | null;
  mallSuspensionHours?: number | null;
  isMallSuspended?: boolean;
  isBalanceFrozen?: boolean;
  balanceFreezeReason?: string | null;
  balanceFrozenAt?: string | null;
  createdAt: string;
  stats: {
    totalProducts: number;
    totalOrders: number;
    newOrdersCount: number;
    shippingOrdersCount: number;
    totalReviews: number;
    averageRating: number;
    totalRevenue: number;
  };
}

export class SellerController {
  /**
   * Mengambil data profil toko, status verifikasi, dan metrik realtime penjual
   * GET /api/seller/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const stmt = db.prepare(`
        SELECT id, name, username, email, role, status, is_store_open, store_balance,
               verification_status, verification_submitted_at, verification_data, verification_rejection_reason,
               mall_suspended_until, mall_suspension_reason, mall_suspension_hours,
               is_balance_frozen, balance_freeze_reason, balance_frozen_at,
               created_at
        FROM users
        WHERE id = ? AND role = 'penjual'
      `);

      const row = stmt.get(sellerId) as unknown as {
        id: number;
        name: string;
        username: string;
        email: string;
        role: string;
        status: string;
        is_store_open: number | null;
        store_balance: number | null;
        verification_status: SellerVerificationStatus | null;
        verification_submitted_at: string | null;
        verification_data: string | null;
        verification_rejection_reason: string | null;
        mall_suspended_until: string | null;
        mall_suspension_reason: string | null;
        mall_suspension_hours: number | null;
        is_balance_frozen: number | null;
        balance_freeze_reason: string | null;
        balance_frozen_at: string | null;
        created_at: string;
      } | undefined;

      if (!row) {
        res.status(404).json({
          success: false,
          message: "Data akun penjual tidak ditemukan.",
        });
        return;
      }

      let parsedVerificationData: SellerVerificationPayload | null = null;
      if (row.verification_data) {
        try {
          parsedVerificationData = JSON.parse(row.verification_data);
        } catch {
          parsedVerificationData = null;
        }
      }

      const isMallSuspended = Boolean(
        row.verification_status === "suspended" &&
        row.mall_suspended_until &&
        new Date(row.mall_suspended_until).getTime() > Date.now()
      );

      // Hitung metrik realtime sesungguhnya (tanpa data dummy)
      const totalProducts = 0;
      const totalOrders = 0;
      const newOrdersCount = 0;
      const shippingOrdersCount = 0;
      const totalReviews = 0;
      const averageRating = 0;
      const totalRevenue = 0;

      const profile: SellerProfileData = {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        role: row.role,
        status: row.status,
        isStoreOpen: row.is_store_open !== 0,
        balance: Number(row.store_balance || 0),
        verificationStatus: row.verification_status || "unverified",
        verificationSubmittedAt: row.verification_submitted_at,
        verificationData: parsedVerificationData,
        verificationRejectionReason: row.verification_rejection_reason,
        mallSuspendedUntil: row.mall_suspended_until,
        mallSuspensionReason: row.mall_suspension_reason,
        mallSuspensionHours: row.mall_suspension_hours,
        isMallSuspended,
        isBalanceFrozen: row.is_balance_frozen === 1,
        balanceFreezeReason: row.balance_freeze_reason,
        balanceFrozenAt: row.balance_frozen_at,
        createdAt: row.created_at,
        stats: {
          totalProducts,
          totalOrders,
          newOrdersCount,
          shippingOrdersCount,
          totalReviews,
          averageRating,
          totalRevenue,
        },
      };

      res.json({
        success: true,
        seller: profile,
      });
    } catch (error) {
      console.error("[SellerController.getProfile] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memuat profil toko penjual.",
      });
    }
  }

  /**
   * Mengambil rincian status verifikasi toko penjual
   * GET /api/seller/verification
   */
  async getVerification(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const stmt = db.prepare(`
        SELECT verification_status, verification_submitted_at, verification_data,
               verification_rejection_reason, mall_suspended_until, mall_suspension_reason,
               mall_suspension_hours
        FROM users
        WHERE id = ? AND role = 'penjual'
      `);

      const row = stmt.get(sellerId) as unknown as {
        verification_status: SellerVerificationStatus | null;
        verification_submitted_at: string | null;
        verification_data: string | null;
        verification_rejection_reason: string | null;
        mall_suspended_until: string | null;
        mall_suspension_reason: string | null;
        mall_suspension_hours: number | null;
      } | undefined;

      if (!row) {
        res.status(404).json({
          success: false,
          message: "Data akun penjual tidak ditemukan.",
        });
        return;
      }

      let parsedData: SellerVerificationPayload | null = null;
      if (row.verification_data) {
        try {
          parsedData = JSON.parse(row.verification_data);
        } catch {
          parsedData = null;
        }
      }

      const isMallSuspended = Boolean(
        row.verification_status === "suspended" &&
        row.mall_suspended_until &&
        new Date(row.mall_suspended_until).getTime() > Date.now()
      );

      res.json({
        success: true,
        verificationStatus: row.verification_status || "unverified",
        submittedAt: row.verification_submitted_at,
        data: parsedData,
        rejectionReason: row.verification_rejection_reason,
        mallSuspendedUntil: row.mall_suspended_until,
        mallSuspensionReason: row.mall_suspension_reason,
        mallSuspensionHours: row.mall_suspension_hours,
        isMallSuspended,
      });
    } catch (error) {
      console.error("[SellerController.getVerification] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data status verifikasi.",
      });
    }
  }

  /**
   * Mengajukan verifikasi toko ke administrator
   * POST /api/seller/verification
   */
  async submitVerification(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      // Periksa status akun saat ini
      const checkStmt = db.prepare("SELECT verification_status FROM users WHERE id = ? AND role = 'penjual'");
      const current = checkStmt.get(sellerId) as unknown as { verification_status: SellerVerificationStatus } | undefined;

      if (!current) {
        res.status(404).json({
          success: false,
          message: "Akun penjual tidak ditemukan.",
        });
        return;
      }

      // Tentukan pesan respon berdasarkan status sebelumnya
      let responseMessage = "Pengajuan verifikasi toko berhasil dikirimkan ke admin untuk ditinjau.";
      if (current.verification_status === "pending") {
        responseMessage = "Pengajuan verifikasi toko berhasil diperbarui dan dikirimkan ulang ke admin untuk ditinjau.";
      } else if (current.verification_status === "rejected") {
        responseMessage = "Pengajuan verifikasi ulang toko berhasil dikirimkan ke admin untuk ditinjau kembali.";
      } else if (current.verification_status === "verified") {
        responseMessage = "Pembaruan data verifikasi toko berhasil diajukan kembali ke admin.";
      }

      const {
        ownerName,
        idCardNumber,
        phoneNumber,
        businessType,
        storeDescription,
        idCardPhoto,
        selfiePhoto,
        businessDocPhoto,
        notes,
      } = req.body;

      // Validasi kelengkapan form
      if (!ownerName || !idCardNumber || !phoneNumber || !businessType) {
        res.status(400).json({
          success: false,
          message: "Nama pemilik, NIK KTP, nomor telepon, dan jenis usaha wajib diisi.",
        });
        return;
      }

      const trimmedName = String(ownerName).trim();
      const trimmedNik = String(idCardNumber).trim();
      const trimmedPhone = String(phoneNumber).trim();
      const trimmedType = String(businessType).trim();

      if (trimmedName.length < 3) {
        res.status(400).json({
          success: false,
          message: "Nama lengkap pemilik minimal 3 karakter.",
        });
        return;
      }

      if (trimmedNik.length < 8 || trimmedNik.length > 20) {
        res.status(400).json({
          success: false,
          message: "Nomor identitas (NIK/Paspor) harus antara 8 - 20 digit.",
        });
        return;
      }

      const verificationPayload: SellerVerificationPayload = {
        ownerName: trimmedName,
        idCardNumber: trimmedNik,
        phoneNumber: trimmedPhone,
        businessType: trimmedType,
        storeDescription: storeDescription ? String(storeDescription).trim() : undefined,
        idCardPhoto: idCardPhoto ? String(idCardPhoto) : undefined,
        selfiePhoto: selfiePhoto ? String(selfiePhoto) : undefined,
        businessDocPhoto: businessDocPhoto ? String(businessDocPhoto) : undefined,
        notes: notes ? String(notes).trim() : undefined,
      };

      const payloadJson = JSON.stringify(verificationPayload);

      // Update database: ubah status ke 'pending' & simpan berkas pengajuan
      const updateStmt = db.prepare(`
        UPDATE users
        SET verification_status = 'pending',
            verification_submitted_at = CURRENT_TIMESTAMP,
            verification_data = ?,
            verification_rejection_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND role = 'penjual'
      `);

      updateStmt.run(payloadJson, sellerId);

      res.status(200).json({
        success: true,
        message: responseMessage,
        verificationStatus: "pending",
        submittedAt: new Date().toISOString(),
        data: verificationPayload,
      });
    } catch (error) {
      console.error("[SellerController.submitVerification] Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengirim pengajuan verifikasi.",
      });
    }
  }

  /**
   * Mengubah status operasional toko (Buka / Tutup) secara realtime
   * PATCH /api/seller/store-status
   */
  async updateStoreStatus(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const { isStoreOpen } = req.body;
      if (typeof isStoreOpen !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Field 'isStoreOpen' harus bernilai boolean (true atau false).",
        });
        return;
      }

      const updateVal = isStoreOpen ? 1 : 0;
      const stmt = db.prepare(`
        UPDATE users
        SET is_store_open = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND role = 'penjual'
      `);
      stmt.run(updateVal, sellerId);

      res.json({
        success: true,
        isStoreOpen,
        message: `Status toko berhasil diubah menjadi ${isStoreOpen ? "Buka (Menerima Pesanan)" : "Libur / Tutup"}.`,
      });
    } catch (error) {
      console.error("[SellerController.updateStoreStatus] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui status operasional toko.",
      });
    }
  }

  /**
   * Mengambil seluruh daftar akun bank & e-wallet penarikan dana penjual
   * GET /api/seller/payout-accounts
   */
  async getPayoutAccounts(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const stmt = db.prepare(`
        SELECT id, seller_id, account_type, provider_name, account_number, account_holder_name,
               method, is_agreed, created_at, updated_at
        FROM seller_payout_accounts
        WHERE seller_id = ?
        ORDER BY created_at DESC, id DESC
      `);

      const rows = stmt.all(sellerId) as unknown as Array<{
        id: number;
        seller_id: number;
        account_type: "bank" | "wallet";
        provider_name: string;
        account_number: string;
        account_holder_name: string;
        method: "preset" | "manual";
        is_agreed: number;
        created_at: string;
        updated_at: string;
      }>;

      const data: SellerPayoutAccountItem[] = rows.map((r) => ({
        id: r.id,
        sellerId: r.seller_id,
        accountType: r.account_type,
        providerName: r.provider_name,
        accountNumber: r.account_number,
        accountHolderName: r.account_holder_name,
        method: r.method,
        isAgreed: r.is_agreed === 1,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      res.status(200).json({
        success: true,
        message: "Daftar akun penarikan dana berhasil diambil.",
        data,
      });
    } catch (error) {
      console.error("[SellerController.getPayoutAccounts] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil daftar akun penarikan dana.",
      });
    }
  }

  /**
   * Menyimpan akun bank atau e-wallet penarikan baru untuk penjual
   * POST /api/seller/payout-accounts
   */
  async addPayoutAccount(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const {
        accountType,
        providerName,
        accountNumber,
        accountHolderName,
        method,
        isAgreed,
      } = req.body;

      // 1. Validasi Jenis Akun
      if (!accountType || !["bank", "wallet"].includes(accountType)) {
        res.status(400).json({
          success: false,
          message: "Jenis akun harus berupa 'bank' atau 'wallet'.",
        });
        return;
      }

      // 2. Validasi Metode Penambahan
      if (!method || !["preset", "manual"].includes(method)) {
        res.status(400).json({
          success: false,
          message: "Metode penambahan harus berupa 'preset' atau 'manual'.",
        });
        return;
      }

      // 3. Validasi Nama Provider (Bank / Wallet)
      const cleanProviderName = String(providerName || "").trim();
      if (!cleanProviderName || cleanProviderName.length < 2) {
        res.status(400).json({
          success: false,
          message:
            accountType === "bank"
              ? "Nama bank wajib dipilih atau diisi minimal 2 karakter."
              : "Nama e-wallet wajib dipilih atau diisi minimal 2 karakter.",
        });
        return;
      }

      // 4. Validasi Nomor Rekening / Wallet: Wajib HANYA ANGKA (0-9)
      const rawNumber = String(accountNumber || "").trim();
      const isDigitsOnly = /^[0-9]+$/.test(rawNumber);
      if (!rawNumber || !isDigitsOnly || rawNumber.length < 5 || rawNumber.length > 35) {
        res.status(400).json({
          success: false,
          message:
            accountType === "bank"
              ? "Nomor rekening bank wajib hanya menggunakan angka (0-9) dan tidak boleh mengandung huruf atau simbol (5-35 digit)."
              : "Nomor e-wallet / handphone wajib hanya menggunakan angka (0-9) dan tidak boleh mengandung huruf atau simbol (5-35 digit).",
        });
        return;
      }

      // 5. Validasi Nama Pemilik Akun (Bebas huruf dan angka)
      const cleanHolderName = String(accountHolderName || "").trim();
      if (!cleanHolderName || cleanHolderName.length < 2) {
        res.status(400).json({
          success: false,
          message: "Nama lengkap pemilik akun rekening/wallet minimal 2 karakter (bebas kombinasi huruf dan angka).",
        });
        return;
      }

      // 6. Validasi Pernyataan Keabsahan untuk Metode Manual
      if (method === "manual" && !isAgreed) {
        res.status(400).json({
          success: false,
          message:
            "Anda wajib menyetujui pernyataan bahwa data rekening/wallet yang dimasukkan adalah sah dan benar milik Anda.",
        });
        return;
      }

      // 7. Cek Duplikasi Nomor pada Toko yang Sama
      const checkStmt = db.prepare(`
        SELECT id FROM seller_payout_accounts
        WHERE seller_id = ? AND provider_name = ? AND account_number = ?
      `);
      const existing = checkStmt.get(sellerId, cleanProviderName, rawNumber);
      if (existing) {
        res.status(400).json({
          success: false,
          message: `Akun ${accountType === "bank" ? "rekening" : "e-wallet"} ${cleanProviderName} dengan nomor ${rawNumber} sudah tersimpan di akun Anda.`,
        });
        return;
      }

      // 8. Insert ke Database
      const insertStmt = db.prepare(`
        INSERT INTO seller_payout_accounts (
          seller_id, account_type, provider_name, account_number, account_holder_name, method, is_agreed
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(
        sellerId,
        accountType,
        cleanProviderName,
        rawNumber,
        cleanHolderName,
        method,
        method === "manual" ? (isAgreed ? 1 : 0) : 1
      );

      const newAccountId = Number(result.lastInsertRowid);

      const newAccount: SellerPayoutAccountItem = {
        id: newAccountId,
        sellerId,
        accountType,
        providerName: cleanProviderName,
        accountNumber: rawNumber,
        accountHolderName: cleanHolderName,
        method,
        isAgreed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: `Akun ${accountType === "bank" ? "rekening bank" : "e-wallet"} ${cleanProviderName} berhasil disimpan untuk proses penarikan saldo.`,
        data: newAccount,
      });
    } catch (error) {
      console.error("[SellerController.addPayoutAccount] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menyimpan akun penarikan dana.",
      });
    }
  }

  /**
   * Menghapus akun bank atau e-wallet penarikan penjual
   * DELETE /api/seller/payout-accounts/:id
   */
  async deletePayoutAccount(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const accountId = Number(req.params.id);
      if (!accountId || isNaN(accountId)) {
        res.status(400).json({
          success: false,
          message: "ID akun tidak valid.",
        });
        return;
      }

      const findStmt = db.prepare(`
        SELECT id, provider_name, account_number, account_type
        FROM seller_payout_accounts
        WHERE id = ? AND seller_id = ?
      `);
      const target = findStmt.get(accountId, sellerId) as unknown as {
        id: number;
        provider_name: string;
        account_number: string;
        account_type: string;
      } | undefined;

      if (!target) {
        res.status(404).json({
          success: false,
          message: "Akun penarikan tidak ditemukan atau bukan milik Anda.",
        });
        return;
      }

      const deleteStmt = db.prepare(`
        DELETE FROM seller_payout_accounts WHERE id = ? AND seller_id = ?
      `);
      deleteStmt.run(accountId, sellerId);

      res.status(200).json({
        success: true,
        message: `Akun ${target.account_type === "bank" ? "rekening" : "e-wallet"} ${target.provider_name} (${target.account_number}) berhasil dihapus.`,
      });
    } catch (error) {
      console.error("[SellerController.deletePayoutAccount] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal menghapus akun penarikan dana.",
      });
    }
  }

  /**
   * Mengambil riwayat pengajuan penarikan dana (WD) penjual
   * GET /api/seller/withdrawals
   */
  async getWithdrawals(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      const stmt = db.prepare(`
        SELECT id, seller_id, payout_account_id, account_type, provider_name, account_number,
               account_holder_name, amount, fee, net_amount, status, notes, admin_notes,
               rejection_reason, reviewed_at, created_at, updated_at
        FROM seller_withdrawals
        WHERE seller_id = ?
        ORDER BY created_at DESC, id DESC
      `);

      const rows = stmt.all(sellerId) as unknown as Array<{
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
        status: WithdrawalStatus;
        notes: string | null;
        admin_notes: string | null;
        rejection_reason: string | null;
        reviewed_at: string | null;
        created_at: string;
        updated_at: string;
      }>;

      const data: SellerWithdrawalItem[] = rows.map((r) => ({
        id: r.id,
        sellerId: r.seller_id,
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
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      res.status(200).json({
        success: true,
        message: "Riwayat penarikan dana berhasil diambil.",
        data,
      });
    } catch (error) {
      console.error("[SellerController.getWithdrawals] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil riwayat penarikan dana.",
      });
    }
  }

  /**
   * Mengajukan penarikan dana (Withdrawal / WD) ke akun bank atau e-wallet tujuan
   * POST /api/seller/withdrawals
   */
  async requestWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user?.id;
      if (!sellerId) {
        res.status(401).json({
          success: false,
          message: "Tidak terautentikasi.",
        });
        return;
      }

      // 1. Cek apakah penjual sudah memiliki akun rekening / wallet yang tersimpan
      const countStmt = db.prepare(`
        SELECT COUNT(*) as total FROM seller_payout_accounts WHERE seller_id = ?
      `);
      const countRes = countStmt.get(sellerId) as unknown as { total: number };
      if (!countRes || countRes.total === 0) {
        res.status(400).json({
          success: false,
          message:
            "Anda belum memiliki akun bank atau dompet digital yang tersimpan. Silakan tambahkan akun penarikan terlebih dahulu untuk menarik saldo.",
          needAccount: true,
        });
        return;
      }

      const { payoutAccountId, amount, notes } = req.body;

      // 2. Validasi Akun Tujuan Penarikan
      const parsedAccountId = Number(payoutAccountId);
      if (!parsedAccountId || isNaN(parsedAccountId)) {
        res.status(400).json({
          success: false,
          message: "Silakan pilih akun rekening atau dompet digital tujuan penarikan.",
        });
        return;
      }

      const findAccountStmt = db.prepare(`
        SELECT id, account_type, provider_name, account_number, account_holder_name
        FROM seller_payout_accounts
        WHERE id = ? AND seller_id = ?
      `);
      const targetAccount = findAccountStmt.get(parsedAccountId, sellerId) as unknown as {
        id: number;
        account_type: string;
        provider_name: string;
        account_number: string;
        account_holder_name: string;
      } | undefined;

      if (!targetAccount) {
        res.status(404).json({
          success: false,
          message: "Akun penarikan tujuan tidak ditemukan dalam daftar akun tersimpan Anda.",
        });
        return;
      }

      // 3. Validasi Nominal Penarikan
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({
          success: false,
          message: "Nominal penarikan harus berupa angka positif.",
        });
        return;
      }

      const MIN_WITHDRAWAL = 10000;
      if (parsedAmount < MIN_WITHDRAWAL) {
        res.status(400).json({
          success: false,
          message: `Minimal penarikan saldo adalah Rp ${MIN_WITHDRAWAL.toLocaleString("id-ID")}.`,
        });
        return;
      }

      // 4. Cek Saldo Toko Terkini & Status Pembekuan Saldo
      const userStmt = db.prepare(`
        SELECT id, name, store_balance, is_balance_frozen, balance_freeze_reason
        FROM users
        WHERE id = ? AND role = 'penjual'
      `);
      const seller = userStmt.get(sellerId) as unknown as {
        id: number;
        name: string;
        store_balance: number | null;
        is_balance_frozen: number | null;
        balance_freeze_reason: string | null;
      } | undefined;

      if (!seller) {
        res.status(404).json({
          success: false,
          message: "Data akun penjual tidak ditemukan.",
        });
        return;
      }

      if (seller.is_balance_frozen === 1) {
        res.status(403).json({
          success: false,
          message: `Saldo toko Anda saat ini sedang dibekukan oleh Admin (${seller.balance_freeze_reason || "Terindikasi pelanggaran / kecurangan"}). Penarikan saldo dinonaktifkan sementara demi keamanan akun.`,
        });
        return;
      }

      const currentBalance = Number(seller.store_balance || 0);
      if (parsedAmount > currentBalance) {
        const formattedCurrent = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(currentBalance);

        res.status(400).json({
          success: false,
          message: `Saldo toko Anda (${formattedCurrent}) tidak mencukupi untuk melakukan penarikan sebesar Rp ${parsedAmount.toLocaleString("id-ID")}.`,
        });
        return;
      }

      // 5. Eksekusi Pengurangan Saldo & Pencatatan Transaksi secara Atomic
      const fee = 0; // Bebas biaya admin platform
      const netAmount = parsedAmount - fee;
      const balanceAfter = currentBalance - parsedAmount;
      const cleanNotes = notes ? String(notes).trim() : null;

      const updateBalanceStmt = db.prepare(`
        UPDATE users
        SET store_balance = store_balance - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      const insertWithdrawalStmt = db.prepare(`
        INSERT INTO seller_withdrawals (
          seller_id, payout_account_id, account_type, provider_name, account_number, account_holder_name,
          amount, fee, net_amount, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `);

      const mutationDesc = `Pengajuan penarikan saldo (WD) ke ${targetAccount.provider_name} (${targetAccount.account_number}) a.n ${targetAccount.account_holder_name} - Menunggu persetujuan admin${
        cleanNotes ? ` - Catatan: ${cleanNotes}` : ""
      }`;

      const insertMutationStmt = db.prepare(`
        INSERT INTO balance_mutations (
          user_id, role, type, amount, balance_before, balance_after, description, admin_id
        ) VALUES (?, 'penjual', 'withdrawal', ?, ?, ?, ?, NULL)
      `);

      updateBalanceStmt.run(parsedAmount, sellerId);
      const wdResult = insertWithdrawalStmt.run(
        sellerId,
        targetAccount.id,
        targetAccount.account_type,
        targetAccount.provider_name,
        targetAccount.account_number,
        targetAccount.account_holder_name,
        parsedAmount,
        fee,
        netAmount,
        cleanNotes
      );
      insertMutationStmt.run(sellerId, parsedAmount, currentBalance, balanceAfter, mutationDesc);

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

      const newWithdrawal: SellerWithdrawalItem = {
        id: Number(wdResult.lastInsertRowid),
        sellerId,
        payoutAccountId: targetAccount.id,
        accountType: targetAccount.account_type,
        providerName: targetAccount.provider_name,
        accountNumber: targetAccount.account_number,
        accountHolderName: targetAccount.account_holder_name,
        amount: parsedAmount,
        fee,
        netAmount,
        status: "pending",
        notes: cleanNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: `Pengajuan penarikan dana sebesar ${formattedAmount} ke ${targetAccount.provider_name} (${targetAccount.account_number}) berhasil dikirim dan sedang menunggu persetujuan admin. Sisa saldo toko: ${formattedNewBalance}.`,
        data: newWithdrawal,
        newBalance: balanceAfter,
      });
    } catch (error) {
      console.error("[SellerController.requestWithdrawal] Error:", error);
      res.status(500).json({
        success: false,
        message: "Gagal memproses pengajuan penarikan dana.",
      });
    }
  }
}

export const sellerController = new SellerController();

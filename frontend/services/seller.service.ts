const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type SellerVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

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

export interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  newOrdersCount: number;
  shippingOrdersCount: number;
  totalReviews: number;
  averageRating: number;
  totalRevenue: number;
}

export interface SellerProfile {
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
  createdAt: string;
  stats: SellerStats;
}

export interface SellerProfileResponse {
  success: boolean;
  message?: string;
  seller?: SellerProfile;
}

export interface UpdateStoreStatusResponse {
  success: boolean;
  message?: string;
  isStoreOpen?: boolean;
}

export interface SellerVerificationResponse {
  success: boolean;
  message?: string;
  verificationStatus?: SellerVerificationStatus;
  submittedAt?: string;
  data?: SellerVerificationPayload | null;
  rejectionReason?: string | null;
}

export type PayoutAccountType = "bank" | "wallet";
export type PayoutMethod = "preset" | "manual";

export interface SellerPayoutAccount {
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

export interface GetPayoutAccountsResponse {
  success: boolean;
  message?: string;
  data: SellerPayoutAccount[];
}

export interface AddPayoutAccountPayload {
  accountType: PayoutAccountType;
  providerName: string;
  accountNumber: string;
  accountHolderName: string;
  method: PayoutMethod;
  isAgreed?: boolean;
}

export interface AddPayoutAccountResponse {
  success: boolean;
  message?: string;
  data?: SellerPayoutAccount;
}

export interface DeletePayoutAccountResponse {
  success: boolean;
  message?: string;
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

export interface GetWithdrawalsResponse {
  success: boolean;
  message?: string;
  data: SellerWithdrawalItem[];
}

export interface RequestWithdrawalPayload {
  payoutAccountId: number;
  amount: number;
  notes?: string;
}

export interface RequestWithdrawalResponse {
  success: boolean;
  message?: string;
  needAccount?: boolean;
  data?: SellerWithdrawalItem;
  newBalance?: number;
}

export const sellerService = {
  /**
   * Mengambil data profil dan statistik realtime penjual: GET /api/seller/profile
   */
  async getProfile(token: string): Promise<SellerProfileResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[sellerService.getProfile] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server backend penjual.",
      };
    }
  },

  /**
   * Mengambil rincian status verifikasi toko penjual: GET /api/seller/verification
   */
  async getVerification(token: string): Promise<SellerVerificationResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/verification`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[sellerService.getVerification] Error:", error);
      return {
        success: false,
        message: "Gagal mengambil data status verifikasi.",
      };
    }
  },

  /**
   * Mengajukan verifikasi toko ke admin: POST /api/seller/verification
   */
  async submitVerification(
    token: string,
    payload: SellerVerificationPayload
  ): Promise<SellerVerificationResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        if (response.status === 413) {
          return {
            success: false,
            message: "Ukuran dokumen foto terlalu besar. Gunakan foto dengan resolusi lebih kecil (maksimal 5MB).",
          };
        }
        return {
          success: false,
          message:
            result?.message ||
            `Gagal mengirim pengajuan verifikasi (${response.status}: ${response.statusText}).`,
        };
      }

      return (
        result || {
          success: true,
          message: "Pengajuan verifikasi berhasil dikirim.",
          verificationStatus: "pending",
        }
      );
    } catch (error: any) {
      console.error("[sellerService.submitVerification] Error:", error);
      return {
        success: false,
        message: error?.message || "Gagal mengirim pengajuan verifikasi ke admin.",
      };
    }
  },

  /**
   * Mengubah status operasional toko buka/tutup secara realtime: PATCH /api/seller/store-status
   */
  async updateStoreStatus(
    token: string,
    isStoreOpen: boolean
  ): Promise<UpdateStoreStatusResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/store-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isStoreOpen }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[sellerService.updateStoreStatus] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server backend penjual.",
      };
    }
  },

  /**
   * Mengambil daftar akun rekening & e-wallet penarikan penjual: GET /api/seller/payout-accounts
   */
  async getPayoutAccounts(token: string): Promise<GetPayoutAccountsResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/payout-accounts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil daftar akun penarikan.",
          data: [],
        };
      }

      return result;
    } catch (error) {
      console.error("[sellerService.getPayoutAccounts] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server backend penjual.",
        data: [],
      };
    }
  },

  /**
   * Menambahkan akun rekening atau e-wallet penarikan baru: POST /api/seller/payout-accounts
   */
  async addPayoutAccount(
    token: string,
    payload: AddPayoutAccountPayload
  ): Promise<AddPayoutAccountResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/payout-accounts`, {
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
      console.error("[sellerService.addPayoutAccount] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat menyimpan akun penarikan.",
      };
    }
  },

  /**
   * Menghapus akun penarikan penjual: DELETE /api/seller/payout-accounts/:id
   */
  async deletePayoutAccount(
    token: string,
    id: number
  ): Promise<DeletePayoutAccountResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/payout-accounts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[sellerService.deletePayoutAccount] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat menghapus akun penarikan.",
      };
    }
  },

  /**
   * Mengambil riwayat transaksi penarikan saldo (Withdrawal / WD): GET /api/seller/withdrawals
   */
  async getWithdrawals(token: string): Promise<GetWithdrawalsResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/withdrawals`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil riwayat penarikan dana.",
          data: [],
        };
      }

      return result;
    } catch (error) {
      console.error("[sellerService.getWithdrawals] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend server.",
        data: [],
      };
    }
  },

  /**
   * Mengajukan penarikan saldo (Withdrawal / WD): POST /api/seller/withdrawals
   */
  async requestWithdrawal(
    token: string,
    payload: RequestWithdrawalPayload
  ): Promise<RequestWithdrawalResponse> {
    try {
      const response = await fetch(`${API_URL}/seller/withdrawals`, {
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
      console.error("[sellerService.requestWithdrawal] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke server saat memproses penarikan saldo.",
      };
    }
  },
};

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

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("[sellerService.submitVerification] Error:", error);
      return {
        success: false,
        message: "Gagal mengirim pengajuan verifikasi ke admin.",
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
};

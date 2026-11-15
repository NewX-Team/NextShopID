/**
 * Service API untuk Role Pembeli (Customer) NextShopID
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface BuyerProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  createdAt: string;
}

export interface BuyerOrderSummary {
  totalOrders: number;
  unpaidCount: number;
  processingCount: number;
  shippingCount: number;
  completedCount: number;
}

export const buyerService = {
  /**
   * Mengambil profil ringkas akun pembeli
   */
  async getProfile(token: string): Promise<{ success: boolean; data?: BuyerProfile; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Gagal mengambil data profil pembeli.",
        };
      }
      return {
        success: true,
        data: result.user,
      };
    } catch (error) {
      console.error("[buyerService.getProfile] Error:", error);
      return {
        success: false,
        message: "Gagal terhubung ke backend server.",
      };
    }
  },
};

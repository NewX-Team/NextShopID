import { Metadata } from "next";
import { AuthCard } from "@/components/forms/AuthCard";

export const metadata: Metadata = {
  title: "Register NextShopID - Buat Akun Baru",
  description: "Daftar akun baru di NextShopID untuk menikmati promo belanja eksklusif dan kemudahan checkout.",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12 bg-white dark:bg-[#0b0f19] transition-colors duration-200">
      <AuthCard initialMode="register" />
    </main>
  );
}

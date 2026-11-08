import { Metadata } from "next";
import { AuthCard } from "@/components/forms/AuthCard";

export const metadata: Metadata = {
  title: "Login NextShopID - Masuk ke Akun Anda",
  description: "Masuk ke akun NextShopID untuk mulai berbelanja produk pilihan dan melacak pesanan.",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12 bg-white">
      <AuthCard initialMode="login" />
    </main>
  );
}

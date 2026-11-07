import { Metadata } from "next";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Register - NextShopID",
  description: "Daftar akun baru di NextShopID",
};

// Server Component: simpan metadata SEO di sini, delegasikan interaksi client ke RegisterForm
export default function RegisterPage() {
  return (
    <main>
      <RegisterForm />
    </main>
  );
}

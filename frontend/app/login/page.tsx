import { Metadata } from "next";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Login - NextShopID",
  description: "Masuk ke akun NextShopID Anda",
};

// Server Component: simpan metadata SEO di sini, delegasikan interaksi client ke LoginForm
export default function LoginPage() {
  return (
    <main>
      <LoginForm />
    </main>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ServerStatusProvider } from "@/context/ServerStatusContext";
import { AdminAccessGuard } from "@/components/auth/AdminAccessGuard";
import { ServerOfflineModal } from "@/components/maintenance/ServerOfflineModal";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "NextShopID - Modern E-Commerce Platform",
  description: "Platform E-Commerce Modern NextShopID",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <ServerStatusProvider>
              <AdminAccessGuard>
                <Navbar />
                <div className="flex flex-1 flex-col">{children}</div>
                <ServerOfflineModal />
              </AdminAccessGuard>
            </ServerStatusProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

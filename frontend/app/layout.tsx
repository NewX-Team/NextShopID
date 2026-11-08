import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
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
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-slate-900 selection:text-white">
        <AuthProvider>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}

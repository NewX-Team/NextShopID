import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}

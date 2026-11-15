"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PackageIcon,
  SearchIcon,
  ShoppingBagIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";

export const PembeliOrdersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const tabs = [
    { id: "all", label: "Semua Pesanan" },
    { id: "unpaid", label: "Belum Bayar" },
    { id: "processing", label: "Diproses" },
    { id: "shipping", label: "Sedang Dikirim" },
    { id: "completed", label: "Selesai" },
    { id: "cancelled", label: "Dibatalkan" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <PackageIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Pesanan Saya
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Pantau riwayat belanja online, status pesanan, dan resi kurir pengiriman Anda.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <ShoppingBagIcon size={16} />
            <span>Belanja Lagi</span>
          </Link>
        </div>
      </div>

      {/* Tabs Kategori Status Pesanan */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State Pesanan (Zero Dummy Data) */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] p-8 sm:p-14 text-center shadow-xs">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 mb-4 shadow-xs">
          <PackageIcon size={30} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
          Belum Ada Pesanan Masuk
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Anda belum memiliki transaksi pesanan di kategori ini. Jelajahi ribuan produk terbaik di etalase katalog NextShopID.
        </p>
        <Link
          href="/katalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <ShoppingBagIcon size={16} />
          <span>Jelajahi Katalog Produk</span>
        </Link>
      </div>
    </div>
  );
};

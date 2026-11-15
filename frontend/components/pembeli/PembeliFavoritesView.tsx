"use client";

import React from "react";
import Link from "next/link";
import { HeartIcon, ShoppingBagIcon } from "@/components/ui/icons";

export const PembeliFavoritesView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <HeartIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Produk Favorit (Wishlist)
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Daftar barang impian yang Anda simpan untuk dibeli di kemudian hari.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] p-8 sm:p-14 text-center shadow-xs">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 mb-4 shadow-xs">
          <HeartIcon size={30} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
          Wishlist Masih Kosong
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Belum ada produk yang Anda tandai sebagai favorit. Klik ikon hati pada barang yang Anda sukai di katalog untuk menyimpannya di sini.
        </p>
        <Link
          href="/katalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <ShoppingBagIcon size={16} />
          <span>Cari Produk Sekarang</span>
        </Link>
      </div>
    </div>
  );
};

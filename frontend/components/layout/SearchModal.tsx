"use client";

import React, { useEffect, useRef, useState } from "react";
import { SearchIcon, CloseIcon, TrendingUpIcon, ArrowRightIcon, ClockIcon } from "@/components/ui/icons";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = [
  "Sneakers Casual",
  "T-Shirt Heavyweight Oversized",
  "Hoodie Fleece Minimalis",
  "Celana Chino Slim Fit",
  "Smartwatch Seri 9",
  "Tas Ransel Laptop Waterproof",
];

const QUICK_CATEGORIES = [
  { name: "Pria", count: "1.2k+ barang" },
  { name: "Wanita", count: "2.4k+ barang" },
  { name: "Gadget & Aksesoris", count: "850+ barang" },
  { name: "Sepatu & Sneakers", count: "640+ barang" },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus input saat modal terbuka & kunci scroll body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC shortcut untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectKeyword = (keyword: string) => {
    setQuery(keyword);
    console.log("[SearchModal] Memilih keyword:", keyword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log("[SearchModal] Submit pencarian:", query);
      onClose();
    }
  };

  const filteredTrending = query.trim()
    ? TRENDING_SEARCHES.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : TRENDING_SEARCHES;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Modal Pencarian Produk"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-2xl transition-all transform scale-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-slate-100 dark:border-white/10 px-4 py-3 sm:px-6">
          <span className="text-slate-400 mr-3 flex-shrink-0">
            <SearchIcon size={20} />
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, brand, atau kategori..."
            className="w-full bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-md transition-colors cursor-pointer"
              aria-label="Bersihkan input pencarian"
            >
              <CloseIcon size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-md">
              ESC
            </kbd>
          )}
        </form>

        {/* Modal Body: Suggestions & Categories */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Trending Searches Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              <TrendingUpIcon size={14} />
              <span>Paling Banyak Dicari</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredTrending.length > 0 ? (
                filteredTrending.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectKeyword(item)}
                    className="group flex items-center justify-between p-2.5 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="truncate">{item}</span>
                    <ArrowRightIcon
                      size={14}
                      className="text-slate-300 dark:text-slate-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2"
                    />
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-2 col-span-2">
                  Tidak ada kata kunci yang cocok dengan &quot;{query}&quot;.
                </p>
              )}
            </div>
          </div>

          {/* Quick Categories Section */}
          <div className="border-t border-slate-100 dark:border-white/10 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              <ClockIcon size={14} />
              <span>Jelajahi Kategori</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleSelectKeyword(cat.name)}
                  className="p-3 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-white/20 hover:bg-white dark:hover:bg-slate-800 transition-all text-left cursor-pointer group"
                >
                  <p className="text-xs font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {cat.count}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/50 px-4 py-2.5 sm:px-6 text-[11px] text-slate-400">
          <span>Tekan <kbd className="font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-1 py-0.5 rounded text-[10px]">↵</kbd> untuk mencari</span>
          <span>Navigasi Cepat NextShopID</span>
        </div>
      </div>
    </div>
  );
};

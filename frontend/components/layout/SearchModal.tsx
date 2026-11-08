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
    // TODO: integrasikan dengan navigasi katalog saat endpoint produk aktif
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Modal Pencarian Produk"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 transition-all transform scale-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-slate-100 px-4 py-3 sm:px-6">
          <span className="text-slate-400 mr-3 flex-shrink-0">
            <SearchIcon size={20} />
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk, brand, atau kategori..."
            className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              aria-label="Bersihkan input pencarian"
            >
              <CloseIcon size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded-md">
              ESC
            </kbd>
          )}
        </form>

        {/* Modal Body: Suggestions & Categories */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Trending Searches Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
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
                    className="group flex items-center justify-between p-2.5 rounded-xl text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                  >
                    <span className="truncate">{item}</span>
                    <ArrowRightIcon
                      size={14}
                      className="text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-slate-700 flex-shrink-0"
                    />
                  </button>
                ))
              ) : (
                <div className="col-span-2 py-6 text-center text-sm text-slate-400">
                  Tidak ada kata kunci yang cocok dengan &quot;{query}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Quick Categories */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Kategori Terpopuler
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => handleSelectKeyword(category.name)}
                  className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-800 transition-colors active:scale-95"
                >
                  <span>{category.name}</span>
                  <span className="text-[11px] text-slate-400 font-normal group-hover:text-slate-500">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer: Tactical Guidance */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-6 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded">↵</kbd>
              <span>pilih / cari</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded">ESC</kbd>
              <span>tutup</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-400">NextShopID Quick Search</span>
        </div>
      </div>
    </div>
  );
};

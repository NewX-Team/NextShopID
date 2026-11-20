"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BadgeCheckIcon,
    CalendarIcon,
    CartIcon,
    CheckIcon,
    FilterIcon,
    HeartIcon,
    LocationIcon,
    MessageSquareIcon,
    SearchIcon,
    ShareIcon,
    ShieldIcon,
    StarIcon,
    StoreIcon,
    TruckIcon,
} from "@/components/ui/icons";
import {
    discountPercent,
    formatRupiah,
    formatSold,
    type MarketplaceProduct,
    type StoreProfile,
} from "@/data/marketplace";

interface StorefrontViewProps {
    store: StoreProfile;
    initialProducts: MarketplaceProduct[];
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
    store,
    initialProducts,
}) => {
    const [activeCategory, setActiveCategory] = useState<string>("Semua Produk");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("popular");
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [copiedToast, setCopiedToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopiedToast(true);
            setTimeout(() => setCopiedToast(false), 2500);
        }
    };

    const handleFollowToggle = () => {
        setIsFollowing((prev) => {
            const next = !prev;
            setToastMessage(
                next
                    ? `Berhasil mengikuti toko ${store.name}!`
                    : `Berhenti mengikuti toko ${store.name}.`
            );
            setTimeout(() => setToastMessage(null), 3000);
            return next;
        });
    };

    // Filter & Sort Products
    const filteredProducts = useMemo(() => {
        let list = [...initialProducts];

        // 1. Filter by category
        if (activeCategory !== "Semua Produk") {
            const catLower = activeCategory.toLowerCase();
            list = list.filter((p) => {
                const nameMatch = p.name.toLowerCase().includes(catLower.replace("pilihan", "").trim());
                const tagMatch = p.tags.some((t) => t.toLowerCase().includes(catLower));
                const catMatch = p.category.toLowerCase().includes(catLower);

                // Specific keyword matches
                if (catLower.includes("audio") || catLower.includes("headset") || catLower.includes("speaker")) {
                    return p.name.toLowerCase().includes("headset") ||
                        p.name.toLowerCase().includes("audio") ||
                        p.name.toLowerCase().includes("tws") ||
                        p.name.toLowerCase().includes("speaker");
                }
                if (catLower.includes("flanel")) {
                    return p.name.toLowerCase().includes("flanel") || p.name.toLowerCase().includes("kemeja");
                }
                if (catLower.includes("outer") || catLower.includes("jaket")) {
                    return p.name.toLowerCase().includes("jaket") || p.name.toLowerCase().includes("outer");
                }
                if (catLower.includes("keyboard") || catLower.includes("mouse")) {
                    return p.name.toLowerCase().includes("keyboard") || p.name.toLowerCase().includes("mouse");
                }
                if (catLower.includes("gaming")) {
                    return p.name.toLowerCase().includes("gaming") || p.tags.includes("Gaming");
                }

                return nameMatch || tagMatch || catMatch;
            });
        }

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.tags.some((t) => t.toLowerCase().includes(query)) ||
                    p.category.toLowerCase().includes(query)
            );
        }

        // 3. Sorting
        switch (sortBy) {
            case "popular":
                list.sort((a, b) => b.sold - a.sold);
                break;
            case "price_asc":
                list.sort((a, b) => a.price - b.price);
                break;
            case "price_desc":
                list.sort((a, b) => b.price - a.price);
                break;
            case "rating":
                list.sort((a, b) => b.rating - a.rating);
                break;
            case "newest":
            default:
                break;
        }

        return list;
    }, [initialProducts, activeCategory, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-slate-50/70 pb-20 dark:bg-[#070b12] transition-colors duration-200">
            {/* Top Navigation & Breadcrumbs */}
            <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/"
                            className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/70 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                            title="Kembali ke Beranda Utama"
                        >
                            <ArrowLeftIcon size={14} className="transition group-hover:-translate-x-0.5" />
                            <span>Kembali ke Beranda</span>
                        </Link>

                        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-white/10" />

                        <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Link href="/" className="transition hover:text-blue-600 dark:hover:text-blue-400">
                                Beranda
                            </Link>
                            <span>/</span>
                            <span className="text-slate-400">Toko</span>
                            <span>/</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {store.name}
                            </span>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                            title="Bagikan profil toko"
                        >
                            {copiedToast ? (
                                <>
                                    <CheckIcon size={14} className="text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Tersalin!</span>
                                </>
                            ) : (
                                <>
                                    <ShareIcon size={14} />
                                    <span>Bagikan Toko</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 1. PALING ATAS: BANNER TOKO (HEADER HERO COVER) */}
            <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                <div className="relative h-44 sm:h-56 md:h-72 lg:h-80 w-full overflow-hidden rounded-3xl border border-slate-200/90 shadow-md dark:border-white/10">
                    <img
                        src={store.banner}
                        alt={`Banner Toko ${store.name}`}
                        className="h-full w-full object-cover object-center transition duration-500 hover:scale-105"
                    />
                    {/* Gradient Overlay untuk Keterbacaan Teks */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                    {/* Top Right Official Badge on Banner */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        {store.isMall ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                                <BadgeCheckIcon size={15} />
                                <span>Official Mall Partner</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                                <StoreIcon size={14} />
                                <span>Toko Terpercaya</span>
                            </span>
                        )}
                    </div>

                    {/* Floating Bottom Info on Banner */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-end justify-between gap-3 text-white">
                        <div className="max-w-xl">
                            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-300">
                                Profil Resmi Penjual
                            </span>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight drop-shadow-md">
                                {store.name}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. PROFIL TOKO (SEBELAH KIRI) & STATISTIK TOKO */}
            <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* 2.1 SISI KIRI: PROFILE AVATAR, NAMA, CENTANG MERAH, & DESKRIPSI */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-start gap-4 sm:gap-5">
                                {/* Profile Avatar dengan Border Mall jika status Mall */}
                                <div className="relative shrink-0">
                                    <div
                                        className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl transition-all ${
                                            store.isMall
                                                ? "p-[3px] bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 shadow-xl shadow-rose-500/25 ring-2 ring-rose-500/30"
                                                : "p-[2px] bg-slate-200 dark:bg-slate-700 shadow-md"
                                        }`}
                                    >
                                        <div className="h-full w-full overflow-hidden rounded-[13px] bg-white dark:bg-slate-900">
                                            <img
                                                src={store.avatar}
                                                alt={store.name}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>
                                    </div>

                                    {/* Floating Mall Tag Badge di Pojok Avatar */}
                                    {store.isMall && (
                                        <span
                                            className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-md bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md ring-2 ring-white dark:ring-slate-900"
                                            title="Penjual Terverifikasi Mall"
                                        >
                                            Mall
                                        </span>
                                    )}
                                </div>

                                {/* Detail Nama & Status */}
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                            {store.name}
                                        </h1>

                                        {/* Tanda Centang Merah jika Terverifikasi / Mall */}
                                        {store.isMall ? (
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm"
                                                    title="Toko Resmi Terverifikasi Mall"
                                                >
                                                    <CheckIcon size={12} strokeWidth={3} />
                                                </span>
                                                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                                    Official Store
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                                Penjual Terverifikasi
                                            </span>
                                        )}
                                    </div>

                                    {/* Info Lokasi, Kapan Toko Dibuat, & Online Aktif */}
                                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <LocationIcon size={13} className="text-slate-400" />
                                            <span>{store.location}</span>
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon size={13} className="text-slate-400" />
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {store.joinedDate}
                                            </span>
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            Online Aktif
                                        </span>
                                    </div>

                                    {/* Deskripsi Toko */}
                                    <p className="pt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        {store.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2.2 SISI KANAN: STATISTIK TOKO & TOMBOL AKSI */}
                        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4 lg:border-l lg:border-slate-100 lg:pl-6 dark:lg:border-white/5">
                            {/* Grid Statistik Toko */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                                {/* Rating Toko */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Rating Toko
                                    </span>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span className="flex items-center gap-1 font-black text-amber-500 text-base">
                                            <StarIcon size={16} />
                                            <span className="text-slate-900 dark:text-white">
                                                {store.rating.toFixed(1)}
                                            </span>
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            ({store.reviewsCount} ulasan)
                                        </span>
                                    </div>
                                </div>

                                {/* Kapan Toko Dibuat */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Waktu Buka Toko
                                    </span>
                                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                        <CalendarIcon size={14} className="text-blue-600 dark:text-blue-400" />
                                        <span>{store.joinedDate}</span>
                                    </div>
                                </div>

                                {/* Waktu Balas Chat */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Kecepatan Balas
                                    </span>
                                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        <MessageSquareIcon size={14} />
                                        <span>{store.responseTime}</span>
                                    </div>
                                </div>

                                {/* Total Produk & Pengikut */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Katalog & Pengikut
                                    </span>
                                    <div className="mt-1 text-xs font-extrabold text-slate-900 dark:text-white">
                                        <span>{initialProducts.length} Produk Aktif</span>
                                        <span className="block text-[11px] font-medium text-slate-400">
                                            {store.followersCount.toLocaleString("id-ID")} Pengikut
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Aksi: Ikuti Toko & Chat */}
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleFollowToggle}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                                        isFollowing
                                            ? "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                                            : "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700"
                                    }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <CheckIcon size={14} className="text-emerald-500" />
                                            <span>Mengikuti</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>+ Ikuti Toko</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setToastMessage(`Membuka percakapan chat dengan ${store.name}...`);
                                        setTimeout(() => setToastMessage(null), 3000);
                                    }}
                                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    <MessageSquareIcon size={15} />
                                    <span>Chat Penjual</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. DI BAWAHNYA: KATEGORI / FILTER TOKO & KATALOG PRODUK YANG DIJUAL */}
            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                {/* Header Bagian Produk */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                            Produk Penjualan Toko
                        </h2>
                        <p className="text-xs text-slate-400">
                            Pilihan kategori yang dirancang khusus oleh {store.name}
                        </p>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Bar Khusus Toko */}
                        <div className="relative flex-1 sm:w-60">
                            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Cari di ${store.name}...`}
                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                            aria-label="Urutkan produk toko"
                        >
                            <option value="popular">Paling Banyak Dibeli</option>
                            <option value="rating">Rating Tertinggi</option>
                            <option value="price_asc">Harga Terendah</option>
                            <option value="price_desc">Harga Tertinggi</option>
                            <option value="newest">Produk Terbaru</option>
                        </select>
                    </div>
                </div>

                {/* Kategori Khusus yang Toko Buat Sendiri (Custom Store Categories) */}
                <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {store.customCategories.map((cat) => {
                        const isSelected = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                                    isSelected
                                        ? "bg-blue-600 text-white shadow-blue-500/20"
                                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Counter & Status Filter */}
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                        Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{filteredProducts.length}</strong> produk
                        {activeCategory !== "Semua Produk" && ` dalam kategori "${activeCategory}"`}
                        {searchQuery && ` dengan kata kunci "${searchQuery}"`}
                    </span>
                    {(activeCategory !== "Semua Produk" || searchQuery) && (
                        <button
                            type="button"
                            onClick={() => {
                                setActiveCategory("Semua Produk");
                                setSearchQuery("");
                            }}
                            className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* GRID PRODUK YANG SUDAH TOKO JUAL */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 sm:gap-5">
                        {filteredProducts.map((product) => {
                            const disc = discountPercent(product.price, product.originalPrice);

                            return (
                                <Link
                                    key={product.id}
                                    href={`/produk/${product.id}`}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-500"
                                >
                                    {/* Thumbnail Image */}
                                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                                        />

                                        {/* Badges */}
                                        <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1">
                                            {store.isMall && (
                                                <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                                                    <BadgeCheckIcon size={10} />
                                                    MALL
                                                </span>
                                            )}
                                            {disc > 0 && (
                                                <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                                                    -{disc}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Produk */}
                                    <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                                        <div className="space-y-1">
                                            <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 leading-snug">
                                                {product.name}
                                            </h3>

                                            <div className="flex flex-wrap items-baseline gap-1.5 pt-1">
                                                <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
                                                    {formatRupiah(product.price)}
                                                </span>
                                                {disc > 0 && (
                                                    <span className="text-[10px] text-slate-400 line-through">
                                                        {formatRupiah(product.originalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rating & Total Terjual */}
                                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-white/5 dark:text-slate-400">
                                            <span className="flex items-center gap-1 font-semibold text-amber-500">
                                                {product.rating > 0 ? (
                                                    <>
                                                        <StarIcon size={12} />
                                                        <span className="text-slate-700 dark:text-slate-300">
                                                            {product.rating.toFixed(1)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 font-normal">Baru</span>
                                                )}
                                            </span>

                                            <span className="truncate">
                                                {formatSold(product.sold)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    /* State Kosong Jika Filter / Pencarian Tidak Ada Hasil */
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 mb-3">
                            <SearchIcon size={22} />
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Tidak Ada Produk Ditemukan
                        </h3>
                        <p className="mt-1 max-w-sm text-xs text-slate-400">
                            Tidak ada produk dalam kategori &quot;{activeCategory}&quot;
                            {searchQuery ? ` dengan kata kunci "${searchQuery}"` : ""}.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveCategory("Semua Produk");
                                setSearchQuery("");
                            }}
                            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                        >
                            Tampilkan Semua Produk Toko
                        </button>
                    </div>
                )}
            </div>

            {/* Toast Feedback Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200 dark:border-white/10 dark:bg-slate-900">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <CheckIcon size={14} />
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {toastMessage}
                    </p>
                </div>
            )}
        </div>
    );
};

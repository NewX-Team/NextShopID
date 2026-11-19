"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRightIcon,
    BadgeCheckIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    EyeIcon,
    HeartIcon,
    LocationIcon,
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
    getProductImages,
    type MarketplaceProduct,
} from "@/data/marketplace";

interface ProductDetailTopViewProps {
    product: MarketplaceProduct;
}

export const ProductDetailTopView: React.FC<ProductDetailTopViewProps> = ({ product }) => {
    const images = useMemo(() => getProductImages(product), [product]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [copiedToast, setCopiedToast] = useState(false);

    const disc = discountPercent(product.price, product.originalPrice);

    // Keyboard navigation for image slider
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
            } else if (e.key === "ArrowRight") {
                setActiveImageIndex((prev) => (prev + 1) % images.length);
            } else if (e.key === "Escape" && isLightboxOpen) {
                setIsLightboxOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [images.length, isLightboxOpen]);

    const handleShare = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopiedToast(true);
            setTimeout(() => setCopiedToast(false), 2500);
        }
    };

    const nextImage = () => {
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Rating & Sold evaluation
    // Case 1: Has ratings & reviews -> display star + average + count
    // Case 2: No ratings yet (whether sold or not) -> display "Belum ada penilaian"
    const hasRating = product.rating > 0 && product.reviewsCount > 0;
    const hasSold = product.sold > 0;

    return (
        <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {/* Top Navigation & Breadcrumbs */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Link
                        href="/"
                        className="font-medium transition hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        Beranda
                    </Link>
                    <span>/</span>
                    <Link
                        href="/katalog"
                        className="capitalize font-medium transition hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        {product.category || "Katalog"}
                    </Link>
                    <span>/</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs font-semibold text-slate-800 dark:text-slate-200">
                        {product.name}
                    </span>
                </nav>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                        title="Salin tautan produk"
                    >
                        {copiedToast ? (
                            <>
                                <CheckIcon size={14} className="text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                            </>
                        ) : (
                            <>
                                <ShareIcon size={14} />
                                <span>Bagikan</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsWishlisted((prev) => !prev)}
                        className={`flex items-center justify-center rounded-xl border p-2 shadow-sm transition ${
                            isWishlisted
                                ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                        }`}
                        title={isWishlisted ? "Hapus dari favorit" : "Simpan ke favorit"}
                    >
                        <HeartIcon
                            size={16}
                            fill={isWishlisted ? "currentColor" : "none"}
                            className={isWishlisted ? "text-rose-600" : ""}
                        />
                    </button>
                </div>
            </div>

            {/* Main Product Top Card */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
                {/* 1. BAGIAN PALING ATAS: FOTO-FOTO PRODUK YANG BISA DI-SLIDE */}
                <div className="space-y-3.5">
                    {/* Main Image Slider Viewport */}
                    <div className="group relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <img
                            src={images[activeImageIndex]}
                            alt={`${product.name} - Foto ${activeImageIndex + 1}`}
                            className="h-full w-full object-cover object-center transition-all duration-300"
                        />

                        {/* Top Left Badges */}
                        <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
                            {product.badge && (
                                <span
                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${
                                        product.badge === "Mall"
                                            ? "bg-rose-600 text-white"
                                            : product.badge === "Terlaris"
                                            ? "bg-amber-500 text-slate-950"
                                            : product.badge === "BPOM" || product.badge === "SNI"
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                    }`}
                                >
                                    {product.badge === "Mall" && <BadgeCheckIcon size={13} />}
                                    {product.badge}
                                </span>
                            )}
                            {disc > 0 && (
                                <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                                    Diskon {disc}%
                                </span>
                            )}
                        </div>

                        {/* Counter Pill & Zoom Button Top Right */}
                        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                            <span className="rounded-full bg-slate-950/60 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur-md">
                                {activeImageIndex + 1} / {images.length}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsLightboxOpen(true)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md transition hover:bg-slate-950/90"
                                title="Perbesar foto"
                            >
                                <EyeIcon size={14} />
                            </button>
                        </div>

                        {/* Slide Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={prevImage}
                                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-white dark:bg-slate-900/90 dark:text-white sm:opacity-0 sm:group-hover:opacity-100"
                                    aria-label="Foto sebelumnya"
                                >
                                    <ChevronLeftIcon size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextImage}
                                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-white dark:bg-slate-900/90 dark:text-white sm:opacity-0 sm:group-hover:opacity-100"
                                    aria-label="Foto berikutnya"
                                >
                                    <ChevronRightIcon size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip for Sliding / Selecting Photos */}
                    {images.length > 1 && (
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                            {images.map((img, idx) => {
                                const isActive = idx === activeImageIndex;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                            isActive
                                                ? "border-blue-600 ring-2 ring-blue-500/30 scale-105 dark:border-blue-400"
                                                : "border-slate-200 opacity-60 hover:opacity-100 dark:border-white/10"
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="h-full w-full object-cover object-center"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. DI BAWAH FOTO: NAMA PRODUCT */}
                <div className="mt-6 space-y-2 border-t border-slate-100 pt-5 dark:border-white/5">
                    {/* Store & Location Header */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                            <StoreIcon size={14} />
                            {product.store}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <LocationIcon size={13} />
                            {product.location}
                        </span>
                        {product.badge === "Mall" && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                    <BadgeCheckIcon size={12} />
                                    Official Store
                                </span>
                            </>
                        )}
                    </div>

                    {/* Product Name Title */}
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                        {product.name}
                    </h1>
                </div>

                {/* 3. DI BAWAH NAMA: HARGA PRODUCT & DI SAMPING HARGA: TOTAL RATING + TOTAL TERJUAL */}
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Harga Product (Sisi Kiri) */}
                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                                {formatRupiah(product.price)}
                            </span>

                            {disc > 0 && (
                                <>
                                    <span className="text-xs sm:text-sm text-slate-400 line-through font-medium">
                                        {formatRupiah(product.originalPrice)}
                                    </span>
                                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                        Hemat {disc}%
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Di Samping Harga: Total Rating Bintang & Total Yang Beli */}
                        <div className="flex items-center gap-3 sm:gap-4 border-t border-slate-200/60 pt-2.5 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0 dark:border-white/10">
                            {/* Logic Rating Bintang:
                                - Ada rating & ulasan: Tampilkan bintang emas + angka rating + total penilaian
                                - Belum ada ulasan / pembeli: Tampilkan "Belum ada penilaian"
                            */}
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                                {hasRating ? (
                                    <>
                                        <span className="flex items-center gap-1 font-bold text-amber-500">
                                            <StarIcon size={16} />
                                            <span className="text-slate-900 dark:text-white text-sm sm:text-base font-extrabold">
                                                {product.rating.toFixed(1)}
                                            </span>
                                        </span>
                                        <span className="text-slate-400 font-medium">
                                            ({product.reviewsCount} penilaian)
                                        </span>
                                    </>
                                ) : (
                                    <span className="rounded-md bg-slate-200/70 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                        Belum ada penilaian
                                    </span>
                                )}
                            </div>

                            {/* Separator Divider */}
                            <div className="h-4 w-px bg-slate-300 dark:bg-white/20" />

                            {/* Total Yang Beli / Terjual:
                                - Jika sudah ada pembeli (> 0): tampilkan berapa banyak yang beli
                                - Jika belum ada pembeli: tampilkan "Belum ada penjualan"
                            */}
                            <div className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {hasSold ? (
                                    <span>{formatSold(product.sold)}</span>
                                ) : (
                                    <span className="text-slate-400 font-normal">
                                        Belum ada penjualan
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Fullview Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                        aria-label="Tutup foto penuh"
                    >
                        <CloseIcon size={20} />
                    </button>

                    <div
                        className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[activeImageIndex]}
                            alt={product.name}
                            className="max-h-[80vh] w-auto object-contain rounded-2xl"
                        />

                        {images.length > 1 && (
                            <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                                <button
                                    type="button"
                                    onClick={prevImage}
                                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                                >
                                    <ChevronLeftIcon size={22} />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextImage}
                                    className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
                                >
                                    <ChevronRightIcon size={22} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

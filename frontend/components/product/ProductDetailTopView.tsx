"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BadgeCheckIcon,
    CartIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    CloseIcon,
    EyeIcon,
    HeartIcon,
    LocationIcon,
    MinusIcon,
    PackageIcon,
    PlusIcon,
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
    getProductVariantGroups,
    getSellerInfo,
    slugifyStore,
    type MarketplaceProduct,
    type ProductVariantGroup,
    type ProductVariantOption,
} from "@/data/marketplace";

interface ProductDetailTopViewProps {
    product: MarketplaceProduct;
}

export const ProductDetailTopView: React.FC<ProductDetailTopViewProps> = ({ product }) => {
    const images = useMemo(() => getProductImages(product), [product]);
    const seller = useMemo(() => getSellerInfo(product), [product]);
    const variantGroups = useMemo(() => getProductVariantGroups(product), [product]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [copiedToast, setCopiedToast] = useState(false);

    // Quantity & Cart state
    const [quantity, setQuantity] = useState(1);
    const [cartCount, setCartCount] = useState(0);
    const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

    // Product Variant state: mapping of groupId -> optionId
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        const groups = getProductVariantGroups(product);
        groups.forEach((g) => {
            if (g.options.length > 0) {
                initial[g.id] = g.options[0].id;
            }
        });
        return initial;
    });

    // Update selected variants if product changes
    useEffect(() => {
        const initial: Record<string, string> = {};
        variantGroups.forEach((g) => {
            if (g.options.length > 0) {
                initial[g.id] = g.options[0].id;
            }
        });
        setSelectedVariants(initial);
    }, [variantGroups]);

    // Calculate price delta from selected variants
    const variantPriceDelta = useMemo(() => {
        let delta = 0;
        variantGroups.forEach((group) => {
            const selectedId = selectedVariants[group.id];
            const opt = group.options.find((o) => o.id === selectedId);
            if (opt?.priceDelta) {
                delta += opt.priceDelta;
            }
        });
        return delta;
    }, [variantGroups, selectedVariants]);

    // Effective unit price including selected variants
    const effectivePrice = product.price + variantPriceDelta;
    const effectiveOriginalPrice = product.originalPrice ? product.originalPrice + variantPriceDelta : 0;
    const disc = discountPercent(effectivePrice, effectiveOriginalPrice);
    const maxStock = product.stock || 25;

    // Summary of chosen variants (e.g. "Matte Black • 7.1 Surround Pro")
    const selectedVariantsSummary = useMemo(() => {
        if (variantGroups.length === 0) return "";
        return variantGroups
            .map((g) => {
                const opt = g.options.find((o) => o.id === selectedVariants[g.id]);
                return opt?.label;
            })
            .filter(Boolean)
            .join(" • ");
    }, [variantGroups, selectedVariants]);

    // Interactive Quantity Drawer & Purchase Mode state
    const [isQuantityDrawerOpen, setIsQuantityDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<"buy" | "cart">("buy");

    // Description expand / collapse state
    const [isDescExpanded, setIsDescExpanded] = useState(false);

    // Toast auto dismiss
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // Keyboard navigation for image slider & modal dismiss
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" && !isQuantityDrawerOpen) {
                setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
            } else if (e.key === "ArrowRight" && !isQuantityDrawerOpen) {
                setActiveImageIndex((prev) => (prev + 1) % images.length);
            } else if (e.key === "Escape") {
                if (isQuantityDrawerOpen) {
                    setIsQuantityDrawerOpen(false);
                } else if (isLightboxOpen) {
                    setIsLightboxOpen(false);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [images.length, isLightboxOpen, isQuantityDrawerOpen]);

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

    const openQuantityDrawer = (mode: "buy" | "cart") => {
        setDrawerMode(mode);
        setIsQuantityDrawerOpen(true);
    };

    const closeQuantityDrawer = () => {
        setIsQuantityDrawerOpen(false);
    };

    const handleConfirmAction = () => {
        const variantText = selectedVariantsSummary ? ` (${selectedVariantsSummary})` : "";
        if (drawerMode === "cart") {
            setCartCount((c) => c + quantity);
            setToastMessage({
                title: "Berhasil Ditambahkan ke Keranjang",
                desc: `${quantity}x "${product.name.slice(0, 26)}..."${variantText} telah ditambahkan ke keranjang belanja. Total: ${formatRupiah(effectivePrice * quantity)}`,
            });
        } else {
            setToastMessage({
                title: "Melanjutkan Pembelian",
                desc: `Memproses pembelian ${quantity}x "${product.name.slice(0, 26)}..."${variantText} (${formatRupiah(effectivePrice * quantity)}) ke checkout pembayaran.`,
            });
        }
        setIsQuantityDrawerOpen(false);
    };

    // Rating & Sold evaluation
    // Case 1: Has ratings & reviews -> display star + average + count
    // Case 2: No ratings yet (whether sold or not) -> display "Belum ada penilaian"
    const hasRating = product.rating > 0 && product.reviewsCount > 0;
    const hasSold = product.sold > 0;

    return (
        <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 pb-32">
            {/* Top Navigation & Breadcrumbs dengan Tombol Kembali ke Page Utama */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Tombol Back ke Page Utama (Beranda) */}
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/70 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-blue-950/40 dark:hover:text-blue-400"
                        title="Kembali ke Beranda Utama"
                    >
                        <ArrowLeftIcon size={14} className="transition group-hover:-translate-x-0.5" />
                        <span>Kembali ke Beranda</span>
                    </Link>

                    <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-white/10" />

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
                        <span className="truncate max-w-[140px] sm:max-w-xs font-semibold text-slate-800 dark:text-slate-200">
                            {product.name}
                        </span>
                    </nav>
                </div>

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

            {/* 1. MAIN CARD: FOTO SLIDER + NAMA + HARGA & RATING */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
                {/* 1.1 BAGIAN PALING ATAS: FOTO-FOTO PRODUK YANG BISA DI-SLIDE */}
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

                {/* 1.2 DI BAWAH FOTO: NAMA PRODUCT */}
                <div className="mt-6 space-y-2 border-t border-slate-100 pt-5 dark:border-white/5">
                    {/* Header Store & Category Tag */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link
                            href={`/toko/${slugifyStore(product.store)}`}
                            className="inline-flex items-center gap-1 font-bold text-blue-600 transition hover:underline dark:text-blue-400"
                            title={`Kunjungi profil toko ${product.store}`}
                        >
                            <StoreIcon size={14} />
                            <span>{product.store}</span>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <LocationIcon size={13} />
                            {product.location}
                        </span>
                        {seller.isMall && (
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

                {/* 1.3 DI BAWAH NAMA: HARGA PRODUCT & DI SAMPING HARGA: TOTAL RATING + TOTAL TERJUAL */}
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

            {/* 2. DI BAWAH HARGA: AKUN TOKO / PENJUAL (DENGAN BORDER MALL & CENTANG MERAH JIKA MALL, ATAU NORMAL JIKA BELUM VERIFIKASI) */}
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Profil Penjual (Kiri) */}
                    <div className="flex items-center gap-4">
                        {/* Profile Avatar: Klik untuk masuk ke profil toko */}
                        <Link
                            href={`/toko/${slugifyStore(seller.store)}`}
                            className="relative shrink-0 group block"
                            title={`Kunjungi toko ${seller.store}`}
                        >
                            <div
                                className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl transition-all group-hover:scale-105 ${
                                    seller.isMall
                                        ? "p-[2.5px] bg-gradient-to-br from-rose-500 via-rose-600 to-red-600 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30"
                                        : "p-[1.5px] bg-slate-200 dark:bg-slate-700 shadow-sm"
                                }`}
                            >
                                <div className="h-full w-full overflow-hidden rounded-[13px] bg-white dark:bg-slate-900">
                                    <img
                                        src={seller.avatar}
                                        alt={seller.store}
                                        className="h-full w-full object-cover object-center"
                                    />
                                </div>
                            </div>

                            {/* Floating Mall Tag Badge di Pojok Kanan Bawah Avatar (Eksklusif Penjual Mall) */}
                            {seller.isMall && (
                                <span
                                    className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md ring-2 ring-white dark:ring-slate-900"
                                    title="Penjual Terverifikasi Mall"
                                >
                                    Mall
                                </span>
                            )}
                        </Link>

                        {/* Nama Toko & Status */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/toko/${slugifyStore(seller.store)}`}
                                    className="group/name flex items-center gap-1.5"
                                    title={`Kunjungi toko ${seller.store}`}
                                >
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 transition group-hover/name:text-blue-600 group-hover/name:underline dark:text-white dark:group-hover/name:text-blue-400">
                                        {seller.store}
                                    </h3>
                                </Link>

                                {/* Centang Berwarna Merah Jika Status Mall */}
                                {seller.isMall ? (
                                    <div className="flex items-center gap-1">
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm"
                                            title="Toko Resmi Terverifikasi Mall"
                                        >
                                            <CheckIcon size={12} strokeWidth={3} />
                                        </span>
                                        <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-extrabold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                            Official Store
                                        </span>
                                    </div>
                                ) : (
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                        Penjual
                                    </span>
                                )}
                            </div>

                            {/* Lokasi & Status Keaktifan */}
                            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <LocationIcon size={13} className="shrink-0 text-slate-400" />
                                <span>{seller.location}</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Online Aktif
                                </span>
                            </p>

                            {/* Info Statistik Toko */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1 font-semibold text-amber-500">
                                    <StarIcon size={12} />
                                    <span className="text-slate-700 dark:text-slate-200">
                                        {seller.rating.toFixed(1)}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-normal">Rating Toko</span>
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span>{seller.productsCount} Produk</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span>Balas Chat: {seller.responseTime}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tombol Aksi Toko (Kanan) */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        <Link
                            href={`/toko/${slugifyStore(seller.store)}`}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-blue-400"
                        >
                            <StoreIcon size={14} />
                            <span>Kunjungi Toko</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* 3. DI BAWAH AKUN: DESKRIPSI PRODUK (DAPAT DIPANJANGKAN DENGAN LIHAT LENGKAP & TUTUP) */}
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        Deskripsi Produk
                    </h2>
                    <span className="text-xs text-slate-400">Informasi & Spesifikasi</span>
                </div>

                {/* Konten Deskripsi dengan Expand / Collapse */}
                <div className="relative">
                    <div
                        className={`transition-all duration-300 ease-in-out ${
                            isDescExpanded ? "max-h-none" : "max-h-36 overflow-hidden"
                        }`}
                    >
                        <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {product.description}
                        </p>
                    </div>

                    {/* Gradient Fade Overlay Saat Bagian Tertutup */}
                    {!isDescExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 pointer-events-none" />
                    )}
                </div>

                {/* Tombol Toggle: Lihat Lengkap vs Tutup */}
                <div className="mt-4 pt-2 text-center border-t border-slate-100 dark:border-white/5">
                    <button
                        type="button"
                        onClick={() => setIsDescExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                        {isDescExpanded ? (
                            <>
                                <span>Tutup Sebagian</span>
                                <ChevronUpIcon size={15} />
                            </>
                        ) : (
                            <>
                                <span>Lihat Selengkapnya</span>
                                <ChevronDownIcon size={15} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 4. TOMBOL BUY & MASUKKAN KERANJANG DI BAGIAN KANAN BAWAH (STICKY / TETAP KELIHATAN SAAT SCROLL) */}
            <aside
                aria-label="Aksi Pembelian Produk"
                className="fixed bottom-5 right-5 z-40 hidden sm:flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-white/15 dark:bg-slate-900/95"
            >
                {/* Informasi Ringkas Harga Satuan & Stok */}
                <div className="flex flex-col pr-2 text-left">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Harga Satuan
                        </span>
                        {product.stock <= 5 && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                Sisa {product.stock}
                            </span>
                        )}
                    </div>
                    <span className="text-base font-black tracking-tight text-blue-600 dark:text-blue-400">
                        {formatRupiah(effectivePrice)}
                    </span>
                    {selectedVariantsSummary && (
                        <span className="truncate max-w-[170px] text-[10px] font-medium text-slate-500 dark:text-slate-400" title={selectedVariantsSummary}>
                            {selectedVariantsSummary}
                        </span>
                    )}
                </div>

                {/* Tombol Masukkan Keranjang (Memicu Transisi Masuk Pemilihan Varian & Jumlah) */}
                <button
                    type="button"
                    onClick={() => openQuantityDrawer("cart")}
                    className="group relative flex items-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50 hover:shadow-sm dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    title="Atur varian & jumlah, lalu simpan ke keranjang"
                >
                    <CartIcon size={16} className="transition group-hover:scale-110" />
                    <span>+ Keranjang</span>
                    {cartCount > 0 && (
                        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
                            {cartCount}
                        </span>
                    )}
                </button>

                {/* Tombol Beli Sekarang (Memicu Transisi Masuk Pemilihan Varian & Jumlah) */}
                <button
                    type="button"
                    onClick={() => openQuantityDrawer("buy")}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg active:scale-95"
                    title="Pilih varian dan beli sekarang"
                >
                    <span>Beli Sekarang</span>
                    <ArrowRightIcon size={14} />
                </button>
            </aside>

            {/* Mobile Bottom Bar (Sticky di Kanan Bawah Layar Mobile) */}
            <div className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 sm:hidden">
                <div className="flex flex-col max-w-[130px]">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Harga Satuan
                    </span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {formatRupiah(effectivePrice)}
                    </span>
                    {selectedVariantsSummary && (
                        <span className="truncate text-[9px] text-slate-500 dark:text-slate-400">
                            {selectedVariantsSummary}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => openQuantityDrawer("cart")}
                        className="flex items-center gap-1.5 rounded-xl border-2 border-blue-600 px-3.5 py-2 text-xs font-bold text-blue-600 dark:border-blue-500 dark:text-blue-400"
                    >
                        <CartIcon size={15} />
                        <span>+ Keranjang</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => openQuantityDrawer("buy")}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow"
                    >
                        <span>Beli</span>
                        <ArrowRightIcon size={13} />
                    </button>
                </div>
            </div>

            {/* 5. INTERACTIVE QUANTITY & VARIANT DRAWER / MODAL DENGAN ANIMASI & TRANSISI MASUK */}
            {/* Backdrop Blur */}
            <div
                className={`fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
                    isQuantityDrawerOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={closeQuantityDrawer}
                aria-hidden="true"
            />

            {/* Sliding Panel: Bottom Sheet di Mobile, Popover / Modal Cantik di Desktop */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={drawerMode === "buy" ? "Pilih Varian & Jumlah Pembelian" : "Pilih Varian & Keranjang"}
                className={`fixed z-50 transition-all duration-300 ease-out 
                    /* Mobile: Bottom sheet */
                    inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900
                    /* Desktop: Floating popover di kanan bawah */
                    sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[450px] sm:rounded-3xl sm:border sm:border-slate-200 dark:sm:border-white/10 sm:p-6
                    ${
                        isQuantityDrawerOpen
                            ? "translate-y-0 opacity-100 scale-100"
                            : "translate-y-full opacity-0 sm:translate-y-6 sm:scale-95 pointer-events-none"
                    }
                `}
            >
                {/* Mobile Handle Indicator */}
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

                {/* Header Panel: Preview Singkat Produk & Tombol Tutup */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <img
                            src={images[0]}
                            alt={product.name}
                            className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover object-center shadow-sm dark:border-white/10"
                        />
                        <div className="space-y-1">
                            <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                {drawerMode === "buy" ? "Beli Langsung" : "Tambah ke Keranjang"}
                            </span>
                            <h3 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">
                                {product.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                                    {formatRupiah(effectivePrice)}
                                </span>
                                {disc > 0 && (
                                    <>
                                        <span className="text-xs text-slate-400 line-through">
                                            {formatRupiah(effectiveOriginalPrice)}
                                        </span>
                                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                            Hemat {disc}%
                                        </span>
                                    </>
                                )}
                            </div>
                            {selectedVariantsSummary && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                                    Pilihan: <strong className="font-semibold text-blue-600 dark:text-blue-400">{selectedVariantsSummary}</strong>
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeQuantityDrawer}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                        title="Tutup dialog"
                    >
                        <CloseIcon size={18} />
                    </button>
                </div>

                {/* SECTION 1: PILIHAN VARIAN PEMBELIAN (WARNA, UKURAN, TIPE/EDISI, DLL) */}
                {variantGroups.length > 0 ? (
                    <div className="space-y-4 border-b border-slate-100 py-4 dark:border-white/5">
                        {variantGroups.map((group) => {
                            const currentSelectedId = selectedVariants[group.id];
                            const currentSelectedOption = group.options.find((o) => o.id === currentSelectedId);

                            return (
                                <div key={group.id} className="space-y-2">
                                    {/* Header Group: Nama Varian & Status Terpilih */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                            <span>{group.name}</span>
                                            <span className="text-[10px] font-normal text-slate-400">({group.options.length} opsi)</span>
                                        </div>
                                        {currentSelectedOption && (
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Dipilih: <strong className="font-semibold text-blue-600 dark:text-blue-400">{currentSelectedOption.label}</strong>
                                            </span>
                                        )}
                                    </div>

                                    {/* Pilihan Tombol Opsi Varian */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {group.options.map((option) => {
                                            const isSelected = currentSelectedId === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedVariants((prev) => ({
                                                            ...prev,
                                                            [group.id]: option.id,
                                                        }))
                                                    }
                                                    className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs transition ${
                                                        isSelected
                                                            ? "border-2 border-blue-600 bg-blue-50/80 font-bold text-blue-700 shadow-sm ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300"
                                                            : "border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                                                    }`}
                                                >
                                                    {/* Color Dot Swatch if colorHex is defined */}
                                                    {option.colorHex && (
                                                        <span
                                                            className="h-3.5 w-3.5 rounded-full border border-black/15 shadow-inner shrink-0"
                                                            style={{ backgroundColor: option.colorHex }}
                                                            aria-hidden="true"
                                                        />
                                                    )}

                                                    <span>{option.label}</span>

                                                    {/* Price Delta Badge if this option costs extra */}
                                                    {option.priceDelta && option.priceDelta > 0 && (
                                                        <span
                                                            className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                                                                isSelected
                                                                    ? "bg-blue-200/70 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200"
                                                                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                                                            }`}
                                                        >
                                                            +{formatRupiah(option.priceDelta)}
                                                        </span>
                                                    )}

                                                    {/* Active check icon */}
                                                    {isSelected && (
                                                        <CheckIcon size={13} strokeWidth={3} className="text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Tampilan Informasi Bila Toko Hanya Menjual 1 Pilihan / Tidak Ada Varian Tambahan */
                    <div className="border-b border-slate-100 py-3.5 dark:border-white/5">
                        <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/5">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <PackageIcon size={14} />
                            </span>
                            <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Varian Standar (1 Pilihan)
                                </h4>
                                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                    Toko menjual produk ini dalam 1 jenis spesifikasi resmi standar tanpa opsi warna atau ukuran tambahan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION 2: ATUR JUMLAH BARANG (MANUAL STEPPER ERGONOMIS) */}
                <div className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    Jumlah Pembelian
                                </span>
                                {quantity >= maxStock && (
                                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                        Maksimal Stok
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Stok tersedia: <strong className="font-semibold text-slate-700 dark:text-slate-200">{maxStock} barang</strong>
                            </p>
                        </div>

                        {/* Ergonomic Manual Stepper: - [Input] + */}
                        <div className="flex items-center self-start sm:self-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800">
                            <button
                                type="button"
                                disabled={quantity <= 1}
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10"
                                title="Kurangi 1"
                                aria-label="Kurangi jumlah barang"
                            >
                                <MinusIcon size={15} />
                            </button>
                            <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
                            <input
                                type="number"
                                min={1}
                                max={maxStock}
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isNaN(val)) setQuantity(1);
                                    else setQuantity(Math.max(1, Math.min(maxStock, val)));
                                }}
                                className="w-14 text-center text-sm font-black text-slate-900 bg-transparent focus:outline-none dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                aria-label="Ketik jumlah pesanan secara manual"
                            />
                            <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
                            <button
                                type="button"
                                disabled={quantity >= maxStock}
                                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                                className="flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10"
                                title="Tambah 1"
                                aria-label="Tambah jumlah barang"
                            >
                                <PlusIcon size={15} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subtotal & Rincian Ringkas */}
                <div className="border-t border-slate-100 pt-3.5 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        <span>Subtotal ({quantity} barang)</span>
                        <span>{formatRupiah(effectivePrice * quantity)}</span>
                    </div>
                    {disc > 0 && (
                        <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1.5">
                            <span>Hemat Diskon</span>
                            <span>- {formatRupiah((effectiveOriginalPrice - effectivePrice) * quantity)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                        <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                Total Pembayaran
                            </span>
                            {selectedVariantsSummary && (
                                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                    {selectedVariantsSummary}
                                </p>
                            )}
                        </div>
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                            {formatRupiah(effectivePrice * quantity)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons: Konfirmasi vs Batal */}
                <div className="mt-4 flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={closeQuantityDrawer}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmAction}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-lg active:scale-95"
                    >
                        {drawerMode === "buy" ? (
                            <>
                                <span>Konfirmasi Beli ({quantity})</span>
                                <ArrowRightIcon size={14} />
                            </>
                        ) : (
                            <>
                                <CartIcon size={16} />
                                <span>Masuk Keranjang ({quantity})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Toast Feedback Notification */}
            {toastMessage && (
                <div className="fixed bottom-24 right-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom duration-200 dark:border-white/10 dark:bg-slate-900">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckIcon size={16} />
                    </span>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {toastMessage.title}
                        </h4>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {toastMessage.desc}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <CloseIcon size={14} />
                    </button>
                </div>
            )}

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

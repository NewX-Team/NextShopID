"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    ActivityIcon,
    ArrowRightIcon,
    BabyIcon,
    BadgeCheckIcon,
    CarIcon,
    CartIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ClockIcon,
    CloseIcon,
    EyeIcon,
    FilterIcon,
    FlameIcon,
    GamepadIcon,
    HomeIcon,
    LaptopIcon,
    LocationIcon,
    PackageIcon,
    PillIcon,
    PlusIcon,
    SearchIcon,
    ShieldIcon,
    ShirtIcon,
    ShoppingBagIcon,
    SmartphoneIcon,
    SparklesIcon,
    StarIcon,
    StoreIcon,
    TagIcon,
    TicketIcon,
    TrendingUpIcon,
    TruckIcon,
    UtensilsIcon,
    ZapIcon,
} from "@/components/ui/icons";
import {
    FLASH_SALE_PRODUCTS,
    FOR_YOU_PRODUCTS,
    HOME_BANNERS,
    HOME_CATEGORIES,
    OFFICIAL_STORES,
    QUICK_ACTIONS,
    SIDE_BANNERS,
    discountPercent,
    formatRupiah,
    formatSold,
    type MarketplaceProduct,
} from "@/data/marketplace";

function pad(n: number) {
    return String(n).padStart(2, "0");
}

type ToastMessage = {
    id: string;
    type: "success" | "info";
    title: string;
    description: string;
};

// Render category vector SVG icon
function CategoryIcon({ icon, className = "" }: { icon: string; className?: string }) {
    switch (icon) {
        case "smartphone":
            return <SmartphoneIcon size={20} className={className} />;
        case "shirt":
            return <ShirtIcon size={20} className={className} />;
        case "sparkles":
            return <SparklesIcon size={20} className={className} />;
        case "home":
            return <HomeIcon size={20} className={className} />;
        case "utensils":
            return <UtensilsIcon size={20} className={className} />;
        case "activity":
            return <ActivityIcon size={20} className={className} />;
        case "gamepad":
            return <GamepadIcon size={20} className={className} />;
        case "car":
            return <CarIcon size={20} className={className} />;
        case "baby":
            return <BabyIcon size={20} className={className} />;
        case "pill":
            return <PillIcon size={20} className={className} />;
        case "laptop":
            return <LaptopIcon size={20} className={className} />;
        case "tag":
        default:
            return <TagIcon size={20} className={className} />;
    }
}

// Render quick action vector SVG icon
function QuickActionIcon({ icon, className = "" }: { icon: string; className?: string }) {
    switch (icon) {
        case "truck":
            return <TruckIcon size={22} className={className || "text-blue-600 dark:text-blue-400"} />;
        case "ticket":
            return <TicketIcon size={22} className={className || "text-indigo-600 dark:text-indigo-400"} />;
        case "store":
            return <StoreIcon size={22} className={className || "text-rose-600 dark:text-rose-400"} />;
        case "zap":
            return <ZapIcon size={22} className={className || "text-amber-500"} />;
        case "package":
            return <PackageIcon size={22} className={className || "text-emerald-600 dark:text-emerald-400"} />;
        case "trending":
        default:
            return <TrendingUpIcon size={22} className={className || "text-red-500"} />;
    }
}

// Product Photo Thumbnail with Real Photography and Clean Badges
function ProductPhoto({
    product,
    compact = false,
    className = "",
}: {
    product: MarketplaceProduct;
    compact?: boolean;
    className?: string;
}) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800 ${
                compact ? "h-36 sm:h-44" : "aspect-square"
            } ${className}`}
        >
            {/* Real Photography Image */}
            {!imageError ? (
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                />
            ) : (
                <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.accent} text-white`}
                >
                    <ShoppingBagIcon size={compact ? 32 : 44} className="opacity-80" />
                </div>
            )}

            {/* Loading placeholder skeleton */}
            {!imageLoaded && !imageError && (
                <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
            )}

            {/* Verified Badge */}
            {product.badge && (
                <div className="absolute left-2.5 top-2.5 z-10 flex items-center">
                    <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            product.badge === "Mall"
                                ? "bg-rose-600 text-white"
                                : product.badge === "Terlaris"
                                ? "bg-amber-500 text-slate-950"
                                : product.badge === "BPOM" || product.badge === "SNI"
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900"
                        }`}
                    >
                        {product.badge === "Mall" && <BadgeCheckIcon size={11} />}
                        {product.badge}
                    </span>
                </div>
            )}

            {/* Discount Percentage Pill */}
            {product.originalPrice > product.price && (
                <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                    -{discountPercent(product.price, product.originalPrice)}%
                </span>
            )}
        </div>
    );
}

// Quick View Modal
function QuickViewModal({
    product,
    onClose,
    onAddToCart,
}: {
    product: MarketplaceProduct;
    onClose: () => void;
    onAddToCart: (product: MarketplaceProduct, quantity: number) => void;
}) {
    const [quantity, setQuantity] = useState(1);
    const disc = discountPercent(product.price, product.originalPrice);
    const maxStock = product.stock || 25;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200/80 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
                    aria-label="Tutup preview"
                >
                    <CloseIcon size={18} />
                </button>

                <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                    {/* Visual Side */}
                    <div className="flex flex-col gap-3">
                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-inner">
                            <ProductPhoto product={product} className="h-full w-full" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 font-medium">
                                <ShieldIcon size={15} className="text-emerald-500" />
                                Garansi Original 100%
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                                <TruckIcon size={15} className="text-blue-500" />
                                Siap Kirim Hari Ini
                            </span>
                        </div>
                    </div>

                    {/* Details Side */}
                    <div className="flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    <StoreIcon size={13} />
                                    {product.store}
                                </span>
                                <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <LocationIcon size={13} />
                                    {product.location}
                                </span>
                            </div>

                            <h2 className="text-lg sm:text-xl font-bold leading-snug text-slate-900 dark:text-white">
                                {product.name}
                            </h2>

                            <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                    <StarIcon size={14} />
                                    {product.rating}
                                </span>
                                <span className="text-slate-400">({product.reviewsCount || 350} ulasan)</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {formatSold(product.sold)}
                                </span>
                            </div>

                            {/* Price */}
                            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5 space-y-1">
                                <div className="flex items-baseline gap-2.5">
                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                        {formatRupiah(product.price)}
                                    </span>
                                    {disc > 0 && (
                                        <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                            Hemat {disc}%
                                        </span>
                                    )}
                                </div>
                                {disc > 0 && (
                                    <p className="text-xs text-slate-400 line-through">
                                        {formatRupiah(product.originalPrice)}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                {product.description}
                            </p>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {product.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Interactive Quantity & Action Buttons */}
                        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Jumlah Pembelian:
                                </span>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10">
                                        <button
                                            type="button"
                                            disabled={quantity <= 1}
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10"
                                        >
                                            -
                                        </button>
                                        <span className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white">
                                            {quantity}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={quantity >= maxStock}
                                            onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-white/10"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        Tersedia {maxStock} unit
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Total Harga:</span>
                                <span className="text-base font-black text-slate-900 dark:text-white">
                                    {formatRupiah(product.price * quantity)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onAddToCart(product, quantity);
                                        onClose();
                                    }}
                                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                >
                                    <CartIcon size={16} />
                                    + Keranjang
                                </button>
                                <Link
                                    href="/katalog"
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    Beli Sekarang
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Modern Clean Product Card
function ModernProductCard({
    product,
    onQuickView,
    onAddToCart,
}: {
    product: MarketplaceProduct;
    onQuickView: (product: MarketplaceProduct) => void;
    onAddToCart: (product: MarketplaceProduct, count: number) => void;
}) {
    const disc = discountPercent(product.price, product.originalPrice);

    return (
        <Link
            href={`/produk/${product.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"
        >
            {/* Visual with Quick View Overlay Button */}
            <div className="relative">
                <ProductPhoto product={product} />

                {/* Action Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onQuickView(product);
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-slate-800 shadow-lg transition hover:scale-105 hover:bg-slate-50 dark:bg-slate-900 dark:text-white"
                        title="Lihat Detail Cepat"
                    >
                        <EyeIcon size={14} className="text-blue-600 dark:text-blue-400" />
                        <span>Detail</span>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddToCart(product, 1);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:scale-110 hover:bg-blue-700"
                        title="Tambah ke Keranjang"
                    >
                        <CartIcon size={16} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col justify-between p-3.5">
                <div>
                    {/* Store Name */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <StoreIcon size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate font-medium">{product.store}</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug text-slate-800 transition group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                        {product.name}
                    </h3>

                    {/* Price Block */}
                    <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
                        <p className="text-[15px] font-black tracking-tight text-blue-600 dark:text-blue-400">
                            {formatRupiah(product.price)}
                        </p>
                        {disc > 0 && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-extrabold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                -{disc}%
                            </span>
                        )}
                    </div>

                    {disc > 0 ? (
                        <p className="text-[11px] text-slate-400 line-through">
                            {formatRupiah(product.originalPrice)}
                        </p>
                    ) : (
                        <p className="text-[11px] text-transparent select-none">-</p>
                    )}
                </div>

                {/* Footer specs */}
                <div className="mt-3.5 border-t border-slate-100 pt-2.5 text-[11px] dark:border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                            <StarIcon size={13} />
                            <span className="text-slate-700 dark:text-slate-200">
                                {product.rating > 0 ? product.rating : "-"}
                            </span>
                        </span>
                        <span className="text-slate-400 font-medium">{formatSold(product.sold)}</span>
                    </div>
                    <p className="flex items-center gap-1 truncate text-slate-400 text-[10px]">
                        <LocationIcon size={12} className="shrink-0" />
                        {product.location}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export const BuyerHome: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [bannerIndex, setBannerIndex] = useState(0);
    const [isBannerHovered, setIsBannerHovered] = useState(false);
    const [flashEndsAt] = useState(() => Date.now() + 1000 * 60 * 60 * 7 + 1000 * 60 * 35);
    const [now, setNow] = useState(() => Date.now());

    // Interactive states
    const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({});
    const [followedStores, setFollowedStores] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("semua");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"relevan" | "terlaris" | "diskon" | "termurah" | "rating">("relevan");
    const [visibleCount, setVisibleCount] = useState(12);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [shippingCity, setShippingCity] = useState("");
    const [shippingChecked, setShippingChecked] = useState(false);
    const [flashSession, setFlashSession] = useState<"active" | "next" | "later">("active");

    const recommendationRef = useRef<HTMLDivElement>(null);

    // Auto-advance hero carousel with pause on hover
    useEffect(() => {
        if (isBannerHovered) return;
        const bannerTimer = window.setInterval(() => {
            setBannerIndex((prev) => (prev + 1) % HOME_BANNERS.length);
        }, 5500);
        return () => window.clearInterval(bannerTimer);
    }, [isBannerHovered]);

    // Live clock timer for flash sale
    useEffect(() => {
        const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(clockTimer);
    }, []);

    // Toast auto dismiss
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const showToast = (title: string, description: string, type: "success" | "info" = "success") => {
        setToast({
            id: String(Date.now()),
            title,
            description,
            type,
        });
    };

    const handleAddToCart = (product: MarketplaceProduct, count: number = 1) => {
        setCartCount((c) => c + count);
        showToast(
            "Berhasil Ditambahkan",
            `${product.name.slice(0, 36)}... (${count}x) dimasukkan ke keranjang belanja.`
        );
    };

    const handleClaimVoucher = (voucherId: string, voucherName: string) => {
        if (claimedVouchers[voucherId]) {
            showToast("Voucher Sudah Tersimpan", "Kamu sudah menyimpan voucher ini sebelumnya.", "info");
            return;
        }
        setClaimedVouchers((prev) => ({ ...prev, [voucherId]: true }));
        showToast("Voucher Berhasil Diklaim", `${voucherName} telah disimpan ke akun belanja kamu.`);
    };

    const handleToggleFollow = (storeId: string, storeName: string) => {
        const isFollowed = followedStores[storeId];
        setFollowedStores((prev) => ({ ...prev, [storeId]: !isFollowed }));
        if (!isFollowed) {
            showToast("Mengikuti Toko", `Kamu telah mengikuti official store ${storeName}.`);
        } else {
            showToast("Berhenti Mengikuti", `Batal mengikuti toko ${storeName}.`, "info");
        }
    };

    const handleCategoryClick = (catId: string) => {
        setActiveCategory(catId);
        recommendationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleLoadMore = () => {
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount((prev) => prev + 6);
            setIsLoadingMore(false);
        }, 400);
    };

    const remaining = Math.max(0, flashEndsAt - now);
    const hours = Math.floor(remaining / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat pagi";
        if (hour < 15) return "Selamat siang";
        if (hour < 18) return "Selamat sore";
        return "Selamat malam";
    }, []);

    // Filter & Sort for "Rekomendasi Spesial"
    const filteredProducts = useMemo(() => {
        return FOR_YOU_PRODUCTS.filter((product) => {
            const matchesCat =
                activeCategory === "semua" ||
                product.category?.toLowerCase() === activeCategory.toLowerCase();
            const matchesSearch =
                !searchQuery.trim() ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.location.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        }).sort((a, b) => {
            if (sortBy === "terlaris") return b.sold - a.sold;
            if (sortBy === "diskon") {
                const discA = discountPercent(a.price, a.originalPrice);
                const discB = discountPercent(b.price, b.originalPrice);
                return discB - discA;
            }
            if (sortBy === "termurah") return a.price - b.price;
            if (sortBy === "rating") return b.rating - a.rating;
            return 0;
        });
    }, [activeCategory, searchQuery, sortBy]);

    const activeBanner = HOME_BANNERS[bannerIndex];

    return (
        <main className="relative flex-1 bg-slate-50/70 pb-20 dark:bg-[#070b12] transition-colors duration-200">
            {/* Top Clean Announcement Strip */}
            <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 truncate">
                        <span className="flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
                            <ZapIcon size={12} />
                            FLASH PROMO
                        </span>
                        <p className="truncate font-semibold tracking-wide">
                            Gratis Ongkir ke Seluruh Indonesia & Jaminan 100% Produk Original.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleClaimVoucher("top-strip", "Voucher Ongkir Rp30.000")}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-sm transition hover:bg-white hover:text-blue-700"
                        >
                            <TicketIcon size={13} />
                            {claimedVouchers["top-strip"] ? "Voucher Aktif" : "Klaim Voucher"}
                        </button>
                        {cartCount > 0 && (
                            <Link
                                href="/katalog"
                                className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950 shadow transition hover:bg-amber-300"
                            >
                                <CartIcon size={14} />
                                <span>{cartCount} Barang</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* User Status / Visitor Welcome Banner */}
                {isAuthenticated && user?.role !== "admin" && user?.role !== "penjual" ? (
                    <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-lg font-black text-white shadow-md">
                                    {user?.name ? user.name[0].toUpperCase() : "P"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                            Akun Pembeli
                                        </p>
                                        <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                            Gold Member
                                        </span>
                                    </div>
                                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                        {greeting}, {user?.name?.split(" ")[0] || "Pelanggan"}
                                    </h1>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                Promo eksklusif hari ini siap digunakan untuk belanja hemat di ribuan toko resmi.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="flex flex-col justify-center border-r border-slate-100 p-4 dark:border-white/10 sm:p-5">
                                <p className="text-[11px] font-medium text-slate-400">Saldo Akun</p>
                                <p className="mt-1 text-base font-black text-slate-900 dark:text-white">Rp0</p>
                                <span className="mt-1 text-[10px] text-emerald-600 font-semibold">Tersedia</span>
                            </div>
                            <div className="flex flex-col justify-center border-r border-slate-100 p-4 dark:border-white/10 sm:p-5">
                                <p className="text-[11px] font-medium text-slate-400">Koin Reward</p>
                                <p className="mt-1 text-base font-black text-amber-600">1.250</p>
                                <span className="mt-1 text-[10px] text-slate-400">Setara Rp1.250</span>
                            </div>
                            <div className="flex flex-col justify-center p-4 dark:border-white/10 sm:p-5">
                                <p className="text-[11px] font-medium text-slate-400">Voucher Aktif</p>
                                <p className="mt-1 text-base font-black text-blue-600">12 Kupon</p>
                                <Link href="/promo" className="mt-1 text-[10px] font-bold text-blue-600 hover:underline">
                                    Gunakan
                                </Link>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                                        PLATFORM RESMI
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        NextShopID Marketplace
                                    </span>
                                </div>
                                <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                    Pusat Belanja Online Tepercaya & Bergaransi
                                </h1>
                                <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                    Jelajahi ribuan produk dari brand terverifikasi, promo diskon kilat, dan layanan bebas ongkir ke seluruh pelosok tanah air.
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                                <Link
                                    href="/login"
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    Daftar Akun Baru
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* Hero Showcase with Large Clean Image Banners */}
                <section className="grid gap-4 lg:grid-cols-[2.2fr_1fr]">
                    {/* Main Interactive Carousel Banner */}
                    <div
                        className="group relative overflow-hidden rounded-3xl shadow-md"
                        onMouseEnter={() => setIsBannerHovered(true)}
                        onMouseLeave={() => setIsBannerHovered(false)}
                    >
                        <div className="relative min-h-[240px] sm:min-h-[300px] lg:min-h-[340px] flex flex-col justify-end p-6 sm:p-10 text-white">
                            {/* Banner Background Real Photography */}
                            <img
                                src={activeBanner.image}
                                alt={activeBanner.title}
                                className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 scale-100 group-hover:scale-105"
                            />
                            {/* Professional Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent" />

                            <div className="relative z-10 space-y-2.5">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${activeBanner.pillColor}`}
                                    >
                                        {activeBanner.tag}
                                    </span>
                                    <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md">
                                        {activeBanner.badge}
                                    </span>
                                </div>
                                <h2 className="max-w-xl text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl drop-shadow leading-tight">
                                    {activeBanner.title}
                                </h2>
                                <p className="max-w-lg text-xs sm:text-sm text-slate-200 drop-shadow leading-relaxed">
                                    {activeBanner.subtitle}
                                </p>

                                <div className="mt-4 flex items-center gap-3 pt-2">
                                    <Link
                                        href={activeBanner.href}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:scale-105 hover:bg-slate-100"
                                    >
                                        {activeBanner.cta}
                                        <ArrowRightIcon size={14} />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleClaimVoucher(activeBanner.id, `Voucher Promo ${activeBanner.tag}`)}
                                        className="rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition hover:bg-white/20"
                                    >
                                        {claimedVouchers[activeBanner.id] ? "Voucher Tersimpan" : "Klaim Voucher"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Slide Jump Indicators */}
                        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-slate-950/60 px-3 py-1.5 backdrop-blur-md">
                            {HOME_BANNERS.map((banner, index) => (
                                <button
                                    key={banner.id}
                                    type="button"
                                    onClick={() => setBannerIndex(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        index === bannerIndex ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                                    }`}
                                    aria-label={`Slide ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Prev & Next Hover Arrows */}
                        <button
                            type="button"
                            onClick={() =>
                                setBannerIndex((prev) => (prev - 1 + HOME_BANNERS.length) % HOME_BANNERS.length)
                            }
                            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/50 text-white backdrop-blur-md opacity-0 transition-opacity hover:bg-slate-950/80 group-hover:opacity-100"
                            aria-label="Slide sebelumnya"
                        >
                            <ChevronLeftIcon size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setBannerIndex((prev) => (prev + 1) % HOME_BANNERS.length)}
                            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/50 text-white backdrop-blur-md opacity-0 transition-opacity hover:bg-slate-950/80 group-hover:opacity-100"
                            aria-label="Slide berikutnya"
                        >
                            <ArrowRightIcon size={18} />
                        </button>
                    </div> 
 
                    {/* Side Clean Photo Cards */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {SIDE_BANNERS.map((banner) => (
                            <Link
                                key={banner.id}
                                href={banner.href}
                                className="group relative flex min-h-[140px] flex-col justify-end overflow-hidden rounded-3xl p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            > 
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                            {banner.tag}
                                        </span>
                                        <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                                            {banner.badge}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-base font-extrabold leading-tight">{banner.title}</p>
                                    <p className="text-xs text-slate-200">{banner.subtitle}</p>
                                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-white group-hover:underline">
                                        <span>{banner.cta}</span>
                                        <ArrowRightIcon size={12} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Quick Actions Hub - Clean Vector SVG Icons */}
                <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                        {QUICK_ACTIONS.map((action) => (
                            <Link
                                key={action.id}
                                href={action.href}
                                className="group relative flex flex-col items-center rounded-2xl p-3 text-center transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                                <span className="absolute right-2 top-2 rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                    {action.badge}
                                </span>
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-50 group-hover:shadow-sm dark:bg-slate-800 dark:group-hover:bg-blue-950/50">
                                    <QuickActionIcon icon={action.icon} />
                                </span>
                                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                                    {action.label}
                                </span>
                                <span className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                                    {action.hint}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Category Explorer - Clean Vector SVG Icons with Active State */}
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    KATEGORI
                                </span>
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Jelajahi Berdasarkan Kategori
                                </h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Pilih kategori untuk menyaring produk rekomendasi secara instan.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCategoryClick("semua")}
                            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Tampilkan Semua
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 lg:grid-cols-12">
                        {HOME_CATEGORIES.map((category) => {
                            const isSelected = activeCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => handleCategoryClick(category.id)}
                                    className={`group flex flex-col items-center rounded-2xl border p-3 text-center transition-all duration-200 ${
                                        isSelected
                                            ? "border-blue-600 bg-blue-50/90 shadow-md ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40"
                                            : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 dark:border-white/5 dark:hover:border-white/20 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <span
                                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${category.color}`}
                                    >
                                        <CategoryIcon icon={category.icon} />
                                    </span>
                                    <span
                                        className={`mt-2 text-[11px] font-bold leading-tight ${
                                            isSelected
                                                ? "text-blue-700 dark:text-blue-400"
                                                : "text-slate-800 dark:text-slate-200"
                                        }`}
                                    >
                                        {category.label}
                                    </span>
                                    <span className="mt-0.5 text-[9px] text-slate-400 font-medium">
                                        {category.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* High-Impact Clean Flash Sale Section */}
                <section className="overflow-hidden rounded-3xl border border-rose-200/80 bg-white shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
                    {/* Header with live countdown & session switches */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 via-white to-orange-50 px-5 py-4 dark:border-rose-900/40 dark:from-rose-950/40 dark:via-slate-900 dark:to-orange-950/30">
                        <div className="flex flex-wrap items-center gap-3.5">
                            <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                                    <ZapIcon size={12} />
                                    FLASH SALE
                                </span>
                                <h2 className="mt-0.5 text-lg font-black text-slate-900 dark:text-white">
                                    Diskon Kilat Terbatas
                                </h2>
                            </div>

                            {/* Digital Countdown Timer */}
                            <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-1.5 text-white shadow">
                                <ClockIcon size={14} className="text-rose-400" />
                                <div className="flex items-center gap-1 font-mono text-xs font-black">
                                    <span className="rounded bg-rose-600 px-1.5 py-0.5">{pad(hours)}</span>
                                    <span>:</span>
                                    <span className="rounded bg-rose-600 px-1.5 py-0.5">{pad(minutes)}</span>
                                    <span>:</span>
                                    <span className="rounded bg-rose-600 px-1.5 py-0.5">{pad(seconds)}</span>
                                </div>
                            </div>

                            {/* Session Selector */}
                            <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/10">
                                <button
                                    type="button"
                                    onClick={() => setFlashSession("active")}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                        flashSession === "active"
                                            ? "bg-rose-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                                    }`}
                                >
                                    Sedang Aktif
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFlashSession("next")}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                        flashSession === "next"
                                            ? "bg-rose-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                                    }`}
                                >
                                    Pukul 18:00
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFlashSession("later")}
                                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                        flashSession === "later"
                                            ? "bg-rose-600 text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                                    }`}
                                >
                                    Pukul 21:00
                                </button>
                            </div>
                        </div>

                        <Link
                            href="/promo"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 transition hover:gap-2 dark:text-rose-400"
                        >
                            Lihat Semua Promo
                            <ArrowRightIcon size={14} />
                        </Link>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 gap-3.5 p-4 sm:grid-cols-3 lg:grid-cols-6">
                        {FLASH_SALE_PRODUCTS.map((product) => {
                            const disc = discountPercent(product.price, product.originalPrice);
                            const stockLeft = product.stock || 12;
                            const progressPercent = Math.min(94, Math.max(45, 100 - stockLeft * 4));

                            return (
                                <Link
                                    key={product.id}
                                    href={`/produk/${product.id}`}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/5 dark:bg-slate-950"
                                >
                                    <div className="relative overflow-hidden rounded-xl">
                                        <ProductPhoto product={product} compact />

                                        {/* Quick button */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setQuickViewProduct(product);
                                            }}
                                            className="absolute bottom-2 right-2 z-20 flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[10px] font-bold text-slate-800 shadow opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <EyeIcon size={12} className="text-rose-600" />
                                            Detail
                                        </button>
                                    </div>

                                    <div className="mt-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <p className="line-clamp-2 min-h-[2.4rem] text-[12px] font-bold text-slate-800 dark:text-slate-100">
                                                {product.name}
                                            </p>
                                            <div className="mt-1 flex items-baseline gap-1.5">
                                                <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                                                    {formatRupiah(product.price)}
                                                </p>
                                                <span className="rounded bg-rose-50 px-1.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                                                    -{disc}%
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 line-through">
                                                {formatRupiah(product.originalPrice)}
                                            </p>
                                        </div>

                                        {/* Stock Meter */}
                                        <div className="pt-2 space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                    <FlameIcon size={12} />
                                                    Tersisa {stockLeft} Unit
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950/60">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-500"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>

                                            {/* Quick Buy Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAddToCart(product, 1);
                                                }}
                                                className="mt-2 w-full flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-1.5 text-[11px] font-bold text-white transition hover:bg-rose-700 shadow-sm"
                                            >
                                                <PlusIcon size={13} />
                                                Beli Cepat
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Official Store Showcase with Real Brand Logotypes */}
                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                    NEXTSHOP MALL
                                </span>
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Brand & Official Store Terverifikasi
                                </h2>
                            </div>
                            <p className="text-xs text-slate-400">
                                Produk 100% original bergaransi resmi langsung dari prinsipal dan distributor terpercaya.
                            </p>
                        </div>
                        <Link
                            href="/katalog"
                            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Semua Toko Resmi
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                        {OFFICIAL_STORES.map((store) => {
                            const isFollowed = followedStores[store.id];
                            return (
                                <div
                                    key={store.id}
                                    className="group flex flex-col justify-between rounded-2xl border border-slate-100 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-white/5 dark:hover:border-white/20 dark:hover:bg-white/5"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        {/* Styled Brand Logo */}
                                        <div className="relative">
                                            <div
                                                className={`flex h-12 w-16 items-center justify-center rounded-xl font-black text-xs tracking-wider shadow-sm ${store.brandColor}`}
                                            >
                                                {store.brandCode}
                                            </div>
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                                                <BadgeCheckIcon size={11} />
                                            </span>
                                        </div>

                                        <h3 className="mt-3 text-xs font-bold text-slate-900 dark:text-slate-100">
                                            {store.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-400">{store.category}</p>
                                        <span className="mt-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                            {store.promo}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleToggleFollow(store.id, store.name)}
                                        className={`mt-3.5 w-full rounded-xl py-1.5 text-[11px] font-bold transition ${
                                            isFollowed
                                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200"
                                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                        }`}
                                    >
                                        {isFollowed ? "Mengikuti" : "+ Ikuti"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 3 Interactive Promo & Value Proposition Cards */}
                <section className="grid gap-4 md:grid-cols-3">
                    {/* Card 1: Voucher Claim */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 p-6 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                <TicketIcon size={24} />
                            </span>
                            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950">
                                VOUCHER
                            </span>
                        </div>
                        <h3 className="mt-4 text-lg font-black">Kupon Belanja Rp50.000</h3>
                        <p className="mt-1 text-xs text-white/80">
                            Min. belanja Rp150.000 untuk semua kategori. Berlaku hari ini.
                        </p>
                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => handleClaimVoucher("voucher-50k", "Voucher Diskon Rp50.000")}
                                className="w-full rounded-xl bg-white py-2.5 text-xs font-bold text-blue-700 shadow transition hover:bg-blue-50"
                            >
                                {claimedVouchers["voucher-50k"] ? "Voucher Tersimpan" : "Klaim Kupon Sekarang"}
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Interactive Ongkir Check */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 p-6 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                <TruckIcon size={24} />
                            </span>
                            <span className="rounded-md bg-white/25 px-2 py-0.5 text-[10px] font-bold">
                                SE-INDONESIA
                            </span>
                        </div>
                        <h3 className="mt-4 text-lg font-black">Gratis Ongkir Xtra</h3>
                        <p className="mt-1 text-xs text-white/85">
                            Cek ketersediaan jangkauan pengiriman gratis ke kota tujuanmu.
                        </p>
                        <div className="mt-4 flex gap-1.5">
                            <input
                                type="text"
                                placeholder="Ketik nama kota (mis: Surabaya)"
                                value={shippingCity}
                                onChange={(e) => {
                                    setShippingCity(e.target.value);
                                    setShippingChecked(false);
                                }}
                                className="w-full rounded-xl border-none bg-white/20 px-3 py-2 text-xs text-white placeholder-white/70 backdrop-blur-md focus:bg-white focus:text-slate-900 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (shippingCity.trim()) {
                                        setShippingChecked(true);
                                        showToast(
                                            "Pengiriman Tersedia",
                                            `Wilayah ${shippingCity} tercover layanan Gratis Ongkir Xtra.`
                                        );
                                    }
                                }}
                                className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 shadow transition hover:bg-emerald-50"
                            >
                                Cek
                            </button>
                        </div>
                        {shippingChecked && (
                            <p className="mt-2 text-[11px] font-semibold text-emerald-200 flex items-center gap-1.5">
                                <CheckCircleIcon size={14} />
                                Tercover Bebas Ongkir ke {shippingCity}
                            </p>
                        )}
                    </div>

                    {/* Card 3: Katalog Drop Baru */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                <ShoppingBagIcon size={24} />
                            </span>
                            <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold">
                                MINGGU INI
                            </span>
                        </div>
                        <h3 className="mt-4 text-lg font-black">Produk Baru Rilis</h3>
                        <p className="mt-1 text-xs text-white/80">
                            120+ koleksi pilihan brand resmi dengan garansi orisinalitas 100%.
                        </p>
                        <div className="mt-5">
                            <Link
                                href="/terbaru"
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white hover:text-slate-950"
                            >
                                Jelajahi Drop Terbaru
                                <ArrowRightIcon size={14} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Core Recommendation Feed - Interactive Category Filter, Search, Sort & Load More */}
                <section ref={recommendationRef} className="space-y-4 pt-2">
                    {/* Filter & Search Toolbar */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 space-y-4">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        REKOMENDASI
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                        Pilihan Terbaik Untuk Anda
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Disesuaikan dengan produk paling diminati, harga terjangkau, dan toko resmi terpercaya.
                                </p>
                            </div>

                            {/* Search inside recommendation */}
                            <div className="relative w-full md:w-72">
                                <SearchIcon
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Cari produk di rekomendasi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <CloseIcon size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Interactive Filter Pills */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3 dark:border-white/5">
                            {/* Category Filter Pills */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {[
                                    { id: "semua", label: "Semua Produk" },
                                    { id: "elektronik", label: "Elektronik" },
                                    { id: "fashion", label: "Fashion" },
                                    { id: "kecantikan", label: "Kecantikan" },
                                    { id: "rumah", label: "Rumah Tangga" },
                                    { id: "makanan", label: "Makanan & Minuman" },
                                    { id: "otomotif", label: "Otomotif" },
                                ].map((tab) => {
                                    const isActive = activeCategory === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveCategory(tab.id)}
                                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Sort Selector */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <FilterIcon size={13} />
                                    Urutan:
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <option value="relevan">Paling Relevan</option>
                                    <option value="terlaris">Terlaris</option>
                                    <option value="diskon">Diskon Tertinggi</option>
                                    <option value="termurah">Harga Terendah</option>
                                    <option value="rating">Rating Tertinggi (4.8+)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <ShoppingBagIcon size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-white">
                                Tidak ada produk yang sesuai
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Coba ganti kategori filter atau kata kunci pencarian.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveCategory("semua");
                                    setSearchQuery("");
                                }}
                                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                            >
                                Reset Filter
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                            {filteredProducts.slice(0, visibleCount).map((product) => (
                                <ModernProductCard
                                    key={product.id}
                                    product={product}
                                    onQuickView={(p) => setQuickViewProduct(p)}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </div>
                    )}

                    {/* Load More Interaction */}
                    {filteredProducts.length > visibleCount && (
                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                disabled={isLoadingMore}
                                onClick={handleLoadMore}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-6 py-3 text-xs font-bold text-slate-800 shadow-sm transition hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                        <span>Memuat Produk...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Muat Lebih Banyak Produk</span>
                                        <ChevronDownIcon size={14} />
                                    </>
                                )}
                            </button>
                            <p className="mt-2 text-[11px] text-slate-400 font-medium">
                                Menampilkan {Math.min(visibleCount, filteredProducts.length)} dari {filteredProducts.length} produk pilihan
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {/* Quick View Modal */}
            {quickViewProduct && (
                <QuickViewModal
                    product={quickViewProduct}
                    onClose={() => setQuickViewProduct(null)}
                    onAddToCart={handleAddToCart}
                />
            )}

            {/* Interactive Toast Notification */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom duration-300 dark:border-white/10 dark:bg-slate-900">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckIcon size={16} />
                    </span>
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{toast.title}</h4>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {toast.description}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <CloseIcon size={14} />
                    </button>
                </div>
            )}

            {/* Modern Footer */}
            <footer className="mt-16 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-base font-black text-white shadow-md">
                                    N
                                </span>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                    NextShop<span className="text-blue-600">ID</span>
                                </p>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Marketplace belanja daring tepercaya di Indonesia dengan ribuan official store resmi, penawaran kilat harian, dan jaminan 100% barang autentik.
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <ShieldIcon size={16} className="text-emerald-500" />
                                <span>Platform Belanja Terproteksi</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                Layanan Pelanggan
                            </p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                <li>
                                    <Link href="/katalog" className="hover:text-blue-600">
                                        Pusat Bantuan 24 Jam
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/promo" className="hover:text-blue-600">
                                        Panduan Klaim Voucher
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/katalog" className="hover:text-blue-600">
                                        Kebijakan Retur & Garansi
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/terbaru" className="hover:text-blue-600">
                                        Lacak Resi Pengiriman
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                Metode Pembayaran
                            </p>
                            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS, GoPay, OVO, DANA, ShopeePay, serta Bayar di Tempat (COD).
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {["BCA", "Mandiri", "BRI", "QRIS", "COD", "E-Wallet"].map((p) => (
                                    <span
                                        key={p}
                                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                Mitra Ekspedisi
                            </p>
                            <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                JNE, J&T Express, SiCepat, Anteraja, Pos Indonesia, dan layanan instan 2 jam sampai.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {["JNE", "J&T", "SiCepat", "Instan 2 Jam"].map((exp) => (
                                    <span
                                        key={exp}
                                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                    >
                                        {exp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 dark:border-white/5">
                        <p>© {new Date().getFullYear()} NextShopID. Seluruh hak cipta dilindungi.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
};

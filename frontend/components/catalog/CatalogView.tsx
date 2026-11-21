"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BadgeCheckIcon,
    CartIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CloseIcon,
    FilterIcon,
    FlameIcon,
    GridIcon,
    HeartIcon,
    ListIcon,
    LocationIcon,
    PackageIcon,
    SearchIcon,
    ShareIcon,
    StarIcon,
    StoreIcon,
    TagIcon,
    TruckIcon,
} from "@/components/ui/icons";
import {
    CATALOG_CATEGORIES,
    CATALOG_LOCATIONS,
    discountPercent,
    formatRupiah,
    formatSold,
    normalizeCategory,
    PRICE_PRESETS,
    slugifyStore,
    type MarketplaceProduct,
} from "@/data/marketplace";

interface CatalogViewProps {
    initialProducts: MarketplaceProduct[];
}

export const CatalogView: React.FC<CatalogViewProps> = ({ initialProducts }) => {
    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [mallOnly, setMallOnly] = useState(false);
    const [discountOnly, setDiscountOnly] = useState(false);
    const [freeShippingOnly, setFreeShippingOnly] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("Semua Kota");
    const [minRating, setMinRating] = useState<number>(0);
    const [priceMin, setPriceMin] = useState<string>("");
    const [priceMax, setPriceMax] = useState<string>("");
    const [activePricePreset, setActivePricePreset] = useState<number | null>(null);

    // Sorting & Display State
    const [sortBy, setSortBy] = useState<string>("popular");
    const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    // Interactive State (Wishlist & Cart Toast)
    const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
    const [cartCount, setCartCount] = useState(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Toast Timer
    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const toggleWishlist = (productId: string, productName: string) => {
        setWishlist((prev) => {
            const next = !prev[productId];
            triggerToast(
                next
                    ? `Ditambahkan ke Favorit: "${productName.slice(0, 28)}..."`
                    : `Dihapus dari Favorit: "${productName.slice(0, 28)}..."`
            );
            return { ...prev, [productId]: next };
        });
    };

    const handleQuickAddToCart = (e: React.MouseEvent, product: MarketplaceProduct) => {
        e.preventDefault();
        e.stopPropagation();
        setCartCount((c) => c + 1);
        triggerToast(`1x "${product.name.slice(0, 28)}..." berhasil ditambahkan ke keranjang.`);
    };

    // Category product counts
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: initialProducts.length };
        initialProducts.forEach((p) => {
            const norm = normalizeCategory(p.category);
            counts[norm] = (counts[norm] || 0) + 1;
        });
        return counts;
    }, [initialProducts]);

    // Handle Quick Price Preset
    const applyPricePreset = (index: number) => {
        if (activePricePreset === index) {
            // Deselect
            setActivePricePreset(null);
            setPriceMin("");
            setPriceMax("");
        } else {
            setActivePricePreset(index);
            const preset = PRICE_PRESETS[index];
            setPriceMin(preset.min ? preset.min.toString() : "");
            setPriceMax(preset.max ? preset.max.toString() : "");
        }
        setCurrentPage(1);
    };

    // Reset All Filters
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedCategory("all");
        setMallOnly(false);
        setDiscountOnly(false);
        setFreeShippingOnly(false);
        setSelectedLocation("Semua Kota");
        setMinRating(0);
        setPriceMin("");
        setPriceMax("");
        setActivePricePreset(null);
        setCurrentPage(1);
    };

    // Check if any filter is active
    const hasActiveFilters = useMemo(() => {
        return (
            searchQuery.trim() !== "" ||
            selectedCategory !== "all" ||
            mallOnly ||
            discountOnly ||
            freeShippingOnly ||
            selectedLocation !== "Semua Kota" ||
            minRating > 0 ||
            priceMin !== "" ||
            priceMax !== ""
        );
    }, [
        searchQuery,
        selectedCategory,
        mallOnly,
        discountOnly,
        freeShippingOnly,
        selectedLocation,
        minRating,
        priceMin,
        priceMax,
    ]);

    // Filtered & Sorted Product List
    const filteredProducts = useMemo(() => {
        let list = [...initialProducts];

        // 1. Text Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.store.toLowerCase().includes(q) ||
                    p.location.toLowerCase().includes(q) ||
                    p.tags.some((t) => t.toLowerCase().includes(q))
            );
        }

        // 2. Category Filter
        if (selectedCategory !== "all") {
            list = list.filter((p) => normalizeCategory(p.category) === selectedCategory);
        }

        // 3. Official Mall Only
        if (mallOnly) {
            list = list.filter((p) => p.isMall || p.badge === "Mall");
        }

        // 4. Discount Only
        if (discountOnly) {
            list = list.filter((p) => p.originalPrice > p.price);
        }

        // 5. Free Shipping (Bebas Ongkir)
        if (freeShippingOnly) {
            list = list.filter((p) => p.tags.includes("Gratis Ongkir") || p.price > 100000);
        }

        // 6. City Location Filter
        if (selectedLocation !== "Semua Kota") {
            if (selectedLocation === "Jabodetabek") {
                list = list.filter((p) =>
                    p.location.toLowerCase().includes("jakarta") ||
                    p.location.toLowerCase().includes("bogor") ||
                    p.location.toLowerCase().includes("depok") ||
                    p.location.toLowerCase().includes("tangerang") ||
                    p.location.toLowerCase().includes("bekasi")
                );
            } else {
                list = list.filter((p) =>
                    p.location.toLowerCase().includes(selectedLocation.toLowerCase())
                );
            }
        }

        // 7. Minimum Rating
        if (minRating > 0) {
            list = list.filter((p) => p.rating >= minRating);
        }

        // 8. Price Range
        const minVal = parseFloat(priceMin);
        const maxVal = parseFloat(priceMax);
        if (!isNaN(minVal) && minVal > 0) {
            list = list.filter((p) => p.price >= minVal);
        }
        if (!isNaN(maxVal) && maxVal > 0) {
            list = list.filter((p) => p.price <= maxVal);
        }

        // 9. Sorting
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
                list.reverse();
                break;
            case "relevant":
            default:
                break;
        }

        return list;
    }, [
        initialProducts,
        searchQuery,
        selectedCategory,
        mallOnly,
        discountOnly,
        freeShippingOnly,
        selectedLocation,
        minRating,
        priceMin,
        priceMax,
        sortBy,
    ]);

    // Paginated Slices
    const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage]);

    return (
        <div className="min-h-screen bg-slate-50/70 pb-28 dark:bg-[#070b12] transition-colors duration-200">
            {/* Header Hero & Breadcrumbs Section */}
            <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    {/* Top Breadcrumb & Action */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <nav className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Link
                                href="/"
                                className="font-medium transition hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                Beranda
                            </Link>
                            <span>/</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                Katalog Produk
                            </span>
                        </nav>

                        {cartCount > 0 && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <CartIcon size={14} />
                                <span>{cartCount} Produk Ditambahkan</span>
                            </div>
                        )}
                    </div>

                    {/* Hero Title & Integrated Search */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Belanja Lengkap & Terpercaya
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                Katalog Produk NextShopID
                            </h1>
                            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Temukan ribuan produk pilihan dari toko resmi Mall dan penjual terverifikasi dengan jaminan original dan promo terbaik.
                            </p>
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative w-full md:w-80 lg:w-96">
                            <SearchIcon
                                size={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Cari produk, kategori, toko..."
                                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-blue-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title="Hapus pencarian"
                                >
                                    <CloseIcon size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Filter Shortcut Pills */}
                    <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => {
                                setMallOnly(false);
                                setDiscountOnly(false);
                                setFreeShippingOnly(false);
                                setMinRating(0);
                                setCurrentPage(1);
                            }}
                            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                                !mallOnly && !discountOnly && !freeShippingOnly && minRating === 0
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-white/5"
                            }`}
                        >
                            Semua Produk
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMallOnly((prev) => !prev);
                                setCurrentPage(1);
                            }}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                                mallOnly
                                    ? "bg-rose-600 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            <BadgeCheckIcon size={13} />
                            <span>Official Mall</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDiscountOnly((prev) => !prev);
                                setCurrentPage(1);
                            }}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                                discountOnly
                                    ? "bg-rose-600 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            <TagIcon size={13} />
                            <span>Diskon Hemat</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMinRating((r) => (r === 4.8 ? 0 : 4.8));
                                setCurrentPage(1);
                            }}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                                minRating >= 4.8
                                    ? "bg-amber-500 text-slate-950"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            <StarIcon size={13} />
                            <span>Rating 4.8+</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setFreeShippingOnly((prev) => !prev);
                                setCurrentPage(1);
                            }}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                                freeShippingOnly
                                    ? "bg-emerald-600 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                            <TruckIcon size={14} />
                            <span>Bebas Ongkir</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area: Sidebar Filter + Catalog Grid */}
            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ------------------------------------------------------------- */}
                    {/* DESKTOP FILTER SIDEBAR (Kolom Kiri) */}
                    {/* ------------------------------------------------------------- */}
                    <aside className="hidden lg:block lg:col-span-3 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sticky top-24">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <FilterIcon size={16} className="text-blue-600 dark:text-blue-400" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Filter Produk
                                </h3>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Filter Kategori */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Kategori Produk
                            </h4>
                            <div className="space-y-1">
                                {CATALOG_CATEGORIES.map((cat) => {
                                    const isSelected = selectedCategory === cat.id;
                                    const count = categoryCounts[cat.id] || 0;

                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setCurrentPage(1);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                                                isSelected
                                                    ? "bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                                            }`}
                                        >
                                            <span>{cat.name}</span>
                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/5" />

                        {/* Filter Tipe Toko / Penjual */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Tipe Penjual
                            </h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={mallOnly}
                                        onChange={(e) => {
                                            setMallOnly(e.target.checked);
                                            setCurrentPage(1);
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                                            <BadgeCheckIcon size={11} />
                                            MALL
                                        </span>
                                        <span>Official Store Resmi</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={discountOnly}
                                        onChange={(e) => {
                                            setDiscountOnly(e.target.checked);
                                            setCurrentPage(1);
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Sedang Diskon Promo</span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={freeShippingOnly}
                                        onChange={(e) => {
                                            setFreeShippingOnly(e.target.checked);
                                            setCurrentPage(1);
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Bebas Biaya Pengiriman</span>
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/5" />

                        {/* Filter Rentang Harga */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Rentang Harga
                            </h4>
                            {/* Preset Buttons */}
                            <div className="grid grid-cols-2 gap-1.5">
                                {PRICE_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applyPricePreset(idx)}
                                        className={`rounded-lg px-2 py-1.5 text-center text-[10px] font-bold transition ${
                                            activePricePreset === idx
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Manual Inputs */}
                            <div className="flex items-center gap-2 pt-1">
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        value={priceMin}
                                        onChange={(e) => {
                                            setPriceMin(e.target.value);
                                            setActivePricePreset(null);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Min"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                    />
                                </div>
                                <span className="text-slate-400">-</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        value={priceMax}
                                        onChange={(e) => {
                                            setPriceMax(e.target.value);
                                            setActivePricePreset(null);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Max"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/5" />

                        {/* Filter Rating Minimal */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Rating Ulasan
                            </h4>
                            <div className="space-y-1.5">
                                {[4.5, 4.0, 3.5].map((ratingVal) => (
                                    <label
                                        key={ratingVal}
                                        className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        <input
                                            type="radio"
                                            name="rating"
                                            checked={minRating === ratingVal}
                                            onChange={() => {
                                                setMinRating(ratingVal);
                                                setCurrentPage(1);
                                            }}
                                            className="text-amber-500 focus:ring-amber-400"
                                        />
                                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                                            <StarIcon size={14} />
                                            <span>{ratingVal} ke atas</span>
                                        </div>
                                    </label>
                                ))}
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                        type="radio"
                                        name="rating"
                                        checked={minRating === 0}
                                        onChange={() => {
                                            setMinRating(0);
                                            setCurrentPage(1);
                                        }}
                                        className="text-amber-500 focus:ring-amber-400"
                                    />
                                    <span>Semua Penilaian</span>
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/5" />

                        {/* Filter Lokasi Asal Toko */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Lokasi Pengiriman
                            </h4>
                            <select
                                value={selectedLocation}
                                onChange={(e) => {
                                    setSelectedLocation(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                            >
                                {CATALOG_LOCATIONS.map((loc) => (
                                    <option key={loc} value={loc}>
                                        {loc}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </aside>

                    {/* ------------------------------------------------------------- */}
                    {/* PRODUCT CATALOG GRID & TOOLBAR (Kolom Kanan) */}
                    {/* ------------------------------------------------------------- */}
                    <main className="lg:col-span-9 space-y-4">
                        {/* Top Toolbar: Counter, Sort, Mobile Filter Toggle, View Mode */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                            {/* Counter & Mobile Filter Button */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMobileFilterOpen(true)}
                                    className="lg:hidden flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                                >
                                    <FilterIcon size={14} />
                                    <span>Filter {hasActiveFilters && "•"}</span>
                                </button>

                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Menampilkan <strong className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</strong> produk
                                </span>
                            </div>

                            {/* Sort Dropdown & Layout Mode */}
                            <div className="flex items-center gap-2">
                                <span className="hidden sm:inline text-xs text-slate-400">Urutkan:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-300"
                                    aria-label="Urutkan katalog produk"
                                >
                                    <option value="popular">Paling Banyak Dibeli</option>
                                    <option value="rating">Rating Tertinggi</option>
                                    <option value="price_asc">Harga: Terendah</option>
                                    <option value="price_desc">Harga: Tertinggi</option>
                                    <option value="newest">Produk Terbaru</option>
                                </select>

                                {/* Grid / Compact View Toggle */}
                                <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/5">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("grid")}
                                        className={`rounded-lg p-1.5 text-slate-600 transition dark:text-slate-300 ${
                                            viewMode === "grid"
                                                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                                                : "hover:bg-slate-200/50 dark:hover:bg-white/10"
                                        }`}
                                        title="Tampilan Grid Standard"
                                    >
                                        <GridIcon size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("compact")}
                                        className={`rounded-lg p-1.5 text-slate-600 transition dark:text-slate-300 ${
                                            viewMode === "compact"
                                                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                                                : "hover:bg-slate-200/50 dark:hover:bg-white/10"
                                        }`}
                                        title="Tampilan Compact"
                                    >
                                        <ListIcon size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Tags (Removable Badges) */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-slate-400 text-[11px] pr-1">Filter Aktif:</span>

                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        <span>&quot;{searchQuery}&quot;</span>
                                        <button type="button" onClick={() => setSearchQuery("")}>
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                {selectedCategory !== "all" && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        <span>Kategori: {CATALOG_CATEGORIES.find((c) => c.id === selectedCategory)?.name}</span>
                                        <button type="button" onClick={() => setSelectedCategory("all")}>
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                {mallOnly && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                        <span>Official Mall</span>
                                        <button type="button" onClick={() => setMallOnly(false)}>
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                {discountOnly && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                        <span>Sedang Diskon</span>
                                        <button type="button" onClick={() => setDiscountOnly(false)}>
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                {minRating > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                        <span>Rating {minRating}+</span>
                                        <button type="button" onClick={() => setMinRating(0)}>
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                {selectedLocation !== "Semua Kota" && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-2 py-1 font-semibold text-slate-800 dark:bg-white/10 dark:text-slate-200">
                                        <span>{selectedLocation}</span>
                                        <button type="button" onClick={() => setSelectedLocation("Semua Kota")}>
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                {(priceMin || priceMax) && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 px-2 py-1 font-semibold text-slate-800 dark:bg-white/10 dark:text-slate-200">
                                        <span>
                                            Rp {priceMin || "0"} - {priceMax ? `Rp ${priceMax}` : "Tak terhingga"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPriceMin("");
                                                setPriceMax("");
                                                setActivePricePreset(null);
                                            }}
                                        >
                                            <CloseIcon size={12} />
                                        </button>
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="font-bold text-rose-600 hover:underline dark:text-rose-400 pl-1"
                                >
                                    Reset Semua
                                </button>
                            </div>
                        )}

                        {/* PRODUCT GRID CONTAINER */}
                        {paginatedProducts.length > 0 ? (
                            <div
                                className={`grid gap-3 sm:gap-4 ${
                                    viewMode === "grid"
                                        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                                }`}
                            >
                                {paginatedProducts.map((product) => {
                                    const disc = discountPercent(product.price, product.originalPrice);
                                    const isFav = wishlist[product.id] || false;

                                    return (
                                        <div
                                            key={product.id}
                                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-500"
                                        >
                                            {/* Thumbnail Image Container */}
                                            <Link
                                                href={`/produk/${product.id}`}
                                                className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                                            >
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />

                                                {/* Top Badges */}
                                                <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1 z-10">
                                                    {(product.isMall || product.badge === "Mall") && (
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

                                                {/* Wishlist Button Top Right */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleWishlist(product.id, product.name);
                                                    }}
                                                    className={`absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition ${
                                                        isFav
                                                            ? "bg-rose-50 text-rose-600 shadow"
                                                            : "bg-white/80 text-slate-600 hover:bg-white hover:text-rose-600 dark:bg-slate-900/80 dark:text-slate-300"
                                                    }`}
                                                    title={isFav ? "Hapus dari favorit" : "Tambah ke favorit"}
                                                >
                                                    <HeartIcon
                                                        size={14}
                                                        fill={isFav ? "currentColor" : "none"}
                                                    />
                                                </button>
                                            </Link>

                                            {/* Product Info & Pricing */}
                                            <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                                                <div className="space-y-1.5">
                                                    {/* Store Name & City */}
                                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                        <Link
                                                            href={`/toko/${slugifyStore(product.store)}`}
                                                            className="flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-blue-400 truncate max-w-[140px]"
                                                            title={`Kunjungi toko ${product.store}`}
                                                        >
                                                            <StoreIcon size={12} />
                                                            <span className="truncate">{product.store}</span>
                                                        </Link>
                                                        <span className="flex items-center gap-0.5 text-slate-400 shrink-0">
                                                            <LocationIcon size={11} />
                                                            <span className="truncate">{product.location}</span>
                                                        </span>
                                                    </div>

                                                    {/* Product Title */}
                                                    <Link
                                                        href={`/produk/${product.id}`}
                                                        className="block"
                                                    >
                                                        <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-slate-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400 leading-snug">
                                                            {product.name}
                                                        </h3>
                                                    </Link>

                                                    {/* Price Section */}
                                                    <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
                                                        <span className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">
                                                            {formatRupiah(product.price)}
                                                        </span>
                                                        {disc > 0 && (
                                                            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                                                                {formatRupiah(product.originalPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bottom Row: Rating, Sold, & Quick Add to Cart */}
                                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-white/5 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="flex items-center gap-0.5 font-bold text-amber-500">
                                                            <StarIcon size={12} />
                                                            <span>{product.rating > 0 ? product.rating.toFixed(1) : "Baru"}</span>
                                                        </span>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span className="truncate">{formatSold(product.sold)}</span>
                                                    </div>

                                                    {/* Quick + Keranjang Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleQuickAddToCart(e, product)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white active:scale-95 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                                                        title="Tambah ke Keranjang"
                                                        aria-label="Tambah ke Keranjang"
                                                    >
                                                        <CartIcon size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* State Kosong Jika Filter / Pencarian Tidak Menemukan Produk */
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 mb-3">
                                    <SearchIcon size={24} />
                                </span>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Tidak Ada Produk yang Sesuai
                                </h3>
                                <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Kombinasi kata kunci pencarian atau filter yang Anda terapkan tidak menghasilkan produk apapun. Coba sesuaikan filter Anda.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700"
                                >
                                    <span>Reset Semua Filter</span>
                                </button>
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/10">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    <ChevronLeftIcon size={14} />
                                    <span>Sebelumnya</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => setCurrentPage(page)}
                                            className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                                                currentPage === page
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
                                >
                                    <span>Berikutnya</span>
                                    <ChevronRightIcon size={14} />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* MOBILE FILTER MODAL DRAWER */}
            {/* ------------------------------------------------------------- */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-900 animate-in slide-in-from-right">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Filter Katalog
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <CloseIcon size={18} />
                            </button>
                        </div>

                        {/* Mobile Filter Options */}
                        <div className="space-y-5 py-4">
                            {/* Kategori */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-slate-400">Kategori</h4>
                                <div className="space-y-1">
                                    {CATALOG_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory(cat.id);
                                                setCurrentPage(1);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium ${
                                                selectedCategory === cat.id
                                                    ? "bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                                            }`}
                                        >
                                            <span>{cat.name}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {categoryCounts[cat.id] || 0}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tipe Toko */}
                            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-white/5">
                                <h4 className="text-xs font-bold uppercase text-slate-400">Penjual & Promo</h4>
                                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={mallOnly}
                                        onChange={(e) => setMallOnly(e.target.checked)}
                                    />
                                    <span>Official Mall</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={discountOnly}
                                        onChange={(e) => setDiscountOnly(e.target.checked)}
                                    />
                                    <span>Sedang Diskon</span>
                                </label>
                            </div>
                        </div>

                        {/* Drawer Actions */}
                        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-white/5 flex gap-2">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:text-slate-300"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

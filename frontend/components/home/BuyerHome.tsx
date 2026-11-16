"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    ArrowRightIcon,
    CartIcon,
    ChevronLeftIcon,
    ClockIcon,
    LocationIcon,
    StarIcon,
    TicketIcon,
    TruckIcon,
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

function ProductThumb({ product, compact = false }: { product: MarketplaceProduct; compact?: boolean }) {
    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${product.accent} ${compact ? "h-36" : "aspect-square"
                }`}
        >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
            <span className={compact ? "text-5xl drop-shadow-sm" : "text-6xl drop-shadow-sm"} aria-hidden>
                {product.emoji}
            </span>
            {product.badge ? (
                <span className="absolute left-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 shadow-sm">
                    {product.badge}
                </span>
            ) : null}
        </div>
    );
}

function ProductCard({ product }: { product: MarketplaceProduct }) {
    const disc = discountPercent(product.price, product.originalPrice);

    return (
        <Link
            href="/katalog"
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(37,99,235,0.35)] dark:border-white/10 dark:bg-slate-900"
        >
            <ProductThumb product={product} />
            <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
                <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-slate-800 dark:text-slate-100">
                    {product.name}
                </h3>
                <div className="flex flex-wrap items-baseline gap-1.5">
                    <p className="text-[15px] font-bold tracking-tight text-blue-600 dark:text-blue-400">
                        {formatRupiah(product.price)}
                    </p>
                    {disc > 0 ? (
                        <span className="rounded bg-rose-50 px-1 py-px text-[10px] font-semibold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                            -{disc}%
                        </span>
                    ) : null}
                </div>
                {disc > 0 ? (
                    <p className="text-[11px] text-slate-400 line-through">{formatRupiah(product.originalPrice)}</p>
                ) : (
                    <p className="text-[11px] text-transparent">-</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                        <StarIcon size={11} />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{product.rating}</span>
                    </span>
                    <span>{formatSold(product.sold)}</span>
                </div>
                <p className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                    <LocationIcon size={11} />
                    {product.location}
                </p>
            </div>
        </Link>
    );
}

export const BuyerHome: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [bannerIndex, setBannerIndex] = useState(0);
    const [flashEndsAt] = useState(() => Date.now() + 1000 * 60 * 60 * 8 + 1000 * 60 * 24);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const bannerTimer = window.setInterval(() => {
            setBannerIndex((prev) => (prev + 1) % HOME_BANNERS.length);
        }, 4500);
        const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => {
            window.clearInterval(bannerTimer);
            window.clearInterval(clockTimer);
        };
    }, []);

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

    const activeBanner = HOME_BANNERS[bannerIndex];

    return (
        <main className="flex-1 bg-slate-100 dark:bg-[#080c14] transition-colors duration-200">
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-[11px] sm:px-6 sm:text-xs lg:px-8">
                    <p className="flex items-center gap-1.5 truncate">
                        <TruckIcon size={14} />
                        Gratis ongkir ke seluruh Indonesia untuk belanja pertama
                    </p>
                    <Link href="/promo" className="hidden shrink-0 font-medium underline-offset-2 hover:underline sm:inline">
                        Klaim voucher
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                {isAuthenticated && user?.role !== "admin" && user?.role !== "penjual" ? (
                    <section className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
                            <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Akun Pembeli
                            </p>
                            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                {greeting}, {user?.name?.split(" ")[0] || "Pembeli"}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Rekomendasi hari ini disesuaikan untuk belanja hemat seperti marketplace favoritmu.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
                            <div className="border-r border-slate-100 p-3 dark:border-white/10 sm:p-4">
                                <p className="text-[11px] text-slate-500">Saldo</p>
                                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Rp0</p>
                            </div>
                            <div className="border-r border-slate-100 p-3 dark:border-white/10 sm:p-4">
                                <p className="text-[11px] text-slate-500">Koin</p>
                                <p className="mt-1 text-sm font-bold text-amber-600">1.250</p>
                            </div>
                            <div className="p-3 sm:p-4">
                                <p className="text-[11px] text-slate-500">Voucher</p>
                                <p className="mt-1 text-sm font-bold text-blue-600">12</p>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-5">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                            Belanja hemat, pengiriman cepat
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                            Temukan flash sale, toko resmi, dan rekomendasi harian.{" "}
                            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                                Masuk
                            </Link>{" "}
                            untuk klaim voucher pembeli.
                        </p>
                    </section>
                )}

                <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
                    <div className="relative overflow-hidden rounded-2xl shadow-sm">
                        <Link
                            href={activeBanner.href}
                            className={`flex min-h-[190px] flex-col justify-end bg-gradient-to-br p-6 text-white sm:min-h-[240px] sm:p-8 ${activeBanner.gradient}`}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Promo unggulan</p>
                            <h2 className="mt-2 max-w-md text-2xl font-bold tracking-tight sm:text-4xl">{activeBanner.title}</h2>
                            <p className="mt-2 max-w-lg text-sm text-white/90 sm:text-base">{activeBanner.subtitle}</p>
                            <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-blue-700">
                                {activeBanner.cta}
                                <ArrowRightIcon size={14} />
                            </span>
                        </Link>
                        <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                            {HOME_BANNERS.map((banner, index) => (
                                <button
                                    key={banner.id}
                                    type="button"
                                    onClick={() => setBannerIndex(index)}
                                    className={`h-1.5 rounded-full transition-all ${index === bannerIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                                        }`}
                                    aria-label={`Banner ${index + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setBannerIndex((prev) => (prev - 1 + HOME_BANNERS.length) % HOME_BANNERS.length)}
                            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 sm:flex"
                            aria-label="Banner sebelumnya"
                        >
                            <ChevronLeftIcon size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setBannerIndex((prev) => (prev + 1) % HOME_BANNERS.length)}
                            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm hover:bg-black/40 sm:flex"
                            aria-label="Banner berikutnya"
                        >
                            <ArrowRightIcon size={16} />
                        </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {SIDE_BANNERS.map((banner) => (
                            <Link
                                key={banner.id}
                                href={banner.href}
                                className={`flex min-h-[110px] flex-col justify-end rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm sm:min-h-[114px] ${banner.gradient}`}
                            >
                                <p className="text-lg font-bold">{banner.title}</p>
                                <p className="text-sm text-white/90">{banner.subtitle}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-4">
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {QUICK_ACTIONS.map((action) => (
                            <Link
                                key={action.id}
                                href={action.href}
                                className="flex flex-col items-center rounded-xl px-1 py-2 text-center transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl dark:bg-blue-950/40">
                                    {action.emoji}
                                </span>
                                <span className="mt-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{action.label}</span>
                                <span className="hidden text-[10px] text-slate-400 sm:block">{action.hint}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Kategori</h2>
                        <Link href="/katalog" className="text-xs font-medium text-blue-600 hover:underline">
                            Lihat semua
                        </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
                        {HOME_CATEGORIES.map((category) => (
                            <Link
                                key={category.id}
                                href={category.href}
                                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 px-1 py-3 text-center transition-all hover:border-blue-200 hover:bg-blue-50/60 dark:border-white/5 dark:hover:border-blue-500/30 dark:hover:bg-blue-950/20"
                            >
                                <span className="text-2xl">{category.emoji}</span>
                                <span className="text-[11px] font-medium leading-tight text-slate-700 dark:text-slate-200">
                                    {category.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-4 py-3 dark:border-rose-900/40 dark:from-rose-950/40 dark:to-slate-900">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">Flash Sale</p>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Diskon kilat hari ini</h2>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-white">
                                <ClockIcon size={13} />
                                <span className="font-mono text-xs font-bold">
                                    {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                                </span>
                            </div>
                        </div>
                        <Link href="/promo" className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                            Lihat semua
                            <ArrowRightIcon size={13} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-6">
                        {FLASH_SALE_PRODUCTS.map((product) => {
                            const disc = discountPercent(product.price, product.originalPrice);
                            const progress = Math.min(92, Math.round((product.sold / 5000) * 100) + 18);
                            return (
                                <Link
                                    key={product.id}
                                    href="/katalog"
                                    className="overflow-hidden rounded-xl border border-slate-100 bg-white transition-shadow hover:shadow-md dark:border-white/10 dark:bg-slate-950"
                                >
                                    <ProductThumb product={product} compact />
                                    <div className="space-y-1 p-2.5">
                                        <p className="line-clamp-2 min-h-[2.4rem] text-[12px] font-medium text-slate-800 dark:text-slate-100">
                                            {product.name}
                                        </p>
                                        <p className="text-sm font-bold text-rose-600">{formatRupiah(product.price)}</p>
                                        <p className="text-[10px] text-slate-400">
                                            <span className="line-through">{formatRupiah(product.originalPrice)}</span>{" "}
                                            <span className="font-semibold text-rose-500">-{disc}%</span>
                                        </p>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-950">
                                            <div className="h-full rounded-full bg-rose-500" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-[10px] text-slate-400">{progress}% terjual</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                    <Link
                        href="/promo"
                        className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm"
                    >
                        <TicketIcon size={22} />
                        <h3 className="mt-3 text-lg font-bold">Voucher 50rb</h3>
                        <p className="text-sm text-white/85">Min. belanja Rp150.000. Klaim sebelum habis.</p>
                    </Link>
                    <Link
                        href="/katalog"
                        className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-white shadow-sm"
                    >
                        <TruckIcon size={22} />
                        <h3 className="mt-3 text-lg font-bold">Gratis Ongkir Extra</h3>
                        <p className="text-sm text-white/85">Khusus akun pembeli, berlaku ke 500+ kota.</p>
                    </Link>
                    <Link
                        href="/terbaru"
                        className="rounded-2xl bg-gradient-to-br from-slate-800 to-blue-800 p-5 text-white shadow-sm"
                    >
                        <CartIcon size={22} />
                        <h3 className="mt-3 text-lg font-bold">Produk Terbaru</h3>
                        <p className="text-sm text-white/85">Drop mingguan brand lokal & toko resmi.</p>
                    </Link>
                </section>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Official Store</p>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Toko resmi terpercaya</h2>
                        </div>
                        <Link href="/katalog" className="text-xs font-medium text-blue-600 hover:underline">
                            Semua toko
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {OFFICIAL_STORES.map((store) => (
                            <Link
                                key={store.id}
                                href="/katalog"
                                className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-3 transition-colors hover:border-blue-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
                                    {store.emoji}
                                </span>
                                <span>
                                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{store.name}</span>
                                    <span className="text-[10px] text-slate-400">{store.category}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-end justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Untukmu</p>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rekomendasi</h2>
                        </div>
                        <Link href="/katalog" className="text-xs font-medium text-blue-600 hover:underline">
                            Katalog lengkap
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {FOR_YOU_PRODUCTS.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            </div>

            <footer className="mt-4 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            NextShop<span className="text-blue-600">ID</span>
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                            Marketplace belanja online dengan flash sale, toko resmi, dan pengiriman ke seluruh Indonesia.
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Layanan</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            <li>Bantuan pembeli</li>
                            <li>Lacak pesanan</li>
                            <li>Pengembalian barang</li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pembayaran</p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Transfer bank, e-wallet, COD, cicilan 0%</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pengiriman</p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Reguler, same day, instan, dan kargo hemat</p>
                    </div>
                </div>
            </footer>
        </main>
    );
};

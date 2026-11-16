export type MarketplaceProduct = {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    sold: number;
    rating: number;
    location: string;
    store: string;
    badge?: string;
    accent: string;
    emoji: string;
};

export const HOME_BANNERS = [
    {
        id: "banner-1",
        title: "Mega Sale 12.12",
        subtitle: "Diskon hingga 80% + voucher gratis ongkir se-Indonesia",
        cta: "Belanja Sekarang",
        href: "/promo",
        gradient: "from-blue-700 via-blue-600 to-indigo-600",
    },
    {
        id: "banner-2",
        title: "NextShop Mall",
        subtitle: "Produk original dari brand resmi. Garansi 100% autentik",
        cta: "Kunjungi Mall",
        href: "/katalog",
        gradient: "from-slate-900 via-blue-800 to-blue-600",
    },
    {
        id: "banner-3",
        title: "Fashion Week",
        subtitle: "Outfit terbaru mulai Rp29.000. Cicilan 0% tersedia",
        cta: "Lihat Koleksi",
        href: "/terbaru",
        gradient: "from-indigo-700 via-blue-600 to-sky-500",
    },
] as const;

export const SIDE_BANNERS = [
    {
        id: "side-1",
        title: "Elektronik Hemat",
        subtitle: "Cashback 20%",
        href: "/katalog",
        gradient: "from-emerald-600 to-teal-500",
    },
    {
        id: "side-2",
        title: "Kebutuhan Dapur",
        subtitle: "Harga grosir",
        href: "/promo",
        gradient: "from-amber-500 to-orange-500",
    },
] as const;

export const HOME_CATEGORIES = [
    { id: "elektronik", label: "Elektronik", emoji: "📱", href: "/katalog" },
    { id: "fashion", label: "Fashion", emoji: "👕", href: "/katalog" },
    { id: "kecantikan", label: "Kecantikan", emoji: "💄", href: "/katalog" },
    { id: "rumah", label: "Rumah Tangga", emoji: "🏠", href: "/katalog" },
    { id: "makanan", label: "Makanan", emoji: "🍜", href: "/katalog" },
    { id: "olahraga", label: "Olahraga", emoji: "⚽", href: "/katalog" },
    { id: "hobi", label: "Hobi & Koleksi", emoji: "🎮", href: "/katalog" },
    { id: "otomotif", label: "Otomotif", emoji: "🚗", href: "/katalog" },
    { id: "ibu-anak", label: "Ibu & Anak", emoji: "🧸", href: "/katalog" },
    { id: "kesehatan", label: "Kesehatan", emoji: "💊", href: "/katalog" },
    { id: "komputer", label: "Komputer", emoji: "💻", href: "/katalog" },
    { id: "voucher", label: "Voucher", emoji: "🎟️", href: "/promo" },
] as const;

export const QUICK_ACTIONS = [
    { id: "ongkir", label: "Gratis Ongkir", hint: "Min. belanja 30rb", emoji: "🚚", href: "/promo" },
    { id: "voucher", label: "Voucher-ku", hint: "12 voucher aktif", emoji: "🎫", href: "/promo" },
    { id: "mall", label: "Official Mall", hint: "Brand terjamin", emoji: "🏬", href: "/katalog" },
    { id: "topup", label: "Top Up & Tagihan", hint: "Pulsa, token, e-wallet", emoji: "⚡", href: "/promo" },
    { id: "cod", label: "Bayar di Tempat", hint: "COD seluruh kota", emoji: "📦", href: "/katalog" },
    { id: "live", label: "Live Hemat", hint: "Sedang 24 toko", emoji: "🔴", href: "/terbaru" },
] as const;

export const FLASH_SALE_PRODUCTS: MarketplaceProduct[] = [
    {
        id: "fs-1",
        name: "Headset Gaming RGB 7.1 Surround",
        price: 89000,
        originalPrice: 249000,
        sold: 1820,
        rating: 4.9,
        location: "Jakarta Barat",
        store: "TechHub Official",
        badge: "Mall",
        accent: "from-blue-500 to-indigo-600",
        emoji: "🎧",
    },
    {
        id: "fs-2",
        name: "Smartwatch AMOLED 1.43\" GPS",
        price: 199000,
        originalPrice: 459000,
        sold: 940,
        rating: 4.8,
        location: "Bandung",
        store: "WearLab ID",
        badge: "Terlaris",
        accent: "from-slate-700 to-blue-700",
        emoji: "⌚",
    },
    {
        id: "fs-3",
        name: "Serum Vitamin C 20% Brightening",
        price: 45000,
        originalPrice: 129000,
        sold: 4310,
        rating: 4.9,
        location: "Surabaya",
        store: "Glow Lab",
        badge: "BPOM",
        accent: "from-amber-400 to-orange-500",
        emoji: "✨",
    },
    {
        id: "fs-4",
        name: "Rice Cooker Digital 1.8L",
        price: 159000,
        originalPrice: 329000,
        sold: 760,
        rating: 4.7,
        location: "Tangerang",
        store: "Dapur Kita",
        badge: "COD",
        accent: "from-emerald-500 to-teal-600",
        emoji: "🍚",
    },
    {
        id: "fs-5",
        name: "Keyboard Mechanical 87 Key",
        price: 175000,
        originalPrice: 389000,
        sold: 1288,
        rating: 4.8,
        location: "Jakarta Selatan",
        store: "KeyForge",
        badge: "Mall",
        accent: "from-violet-500 to-blue-600",
        emoji: "⌨️",
    },
    {
        id: "fs-6",
        name: "Sepatu Running Pria Breathable",
        price: 129000,
        originalPrice: 299000,
        sold: 2104,
        rating: 4.6,
        location: "Bekasi",
        store: "Stride Sport",
        badge: "Gratis Ongkir",
        accent: "from-sky-500 to-blue-700",
        emoji: "👟",
    },
];

export const OFFICIAL_STORES = [
    { id: "os-1", name: "Samsung Official", category: "Elektronik", emoji: "📱" },
    { id: "os-2", name: "Uniqlo ID", category: "Fashion", emoji: "🧥" },
    { id: "os-3", name: "Xiaomi Store", category: "Gadget", emoji: "🔋" },
    { id: "os-4", name: "Wardah Beauty", category: "Kecantikan", emoji: "🌸" },
    { id: "os-5", name: "Polytron", category: "Elektronik", emoji: "📺" },
    { id: "os-6", name: "Eiger Adventure", category: "Outdoor", emoji: "🏕️" },
] as const;

export const FOR_YOU_PRODUCTS: MarketplaceProduct[] = [
    {
        id: "fy-1",
        name: "Tas Ransel Laptop 15.6 Anti Air",
        price: 98000,
        originalPrice: 189000,
        sold: 1540,
        rating: 4.8,
        location: "Jakarta Pusat",
        store: "CarryOn Store",
        badge: "Mall",
        accent: "from-blue-600 to-slate-800",
        emoji: "🎒",
    },
    {
        id: "fy-2",
        name: "Kaos Oversize Cotton Combed 24s",
        price: 39000,
        originalPrice: 79000,
        sold: 8200,
        rating: 4.9,
        location: "Bandung",
        store: "Cotton Local",
        badge: "Lokal",
        accent: "from-slate-600 to-slate-900",
        emoji: "👕",
    },
    {
        id: "fy-3",
        name: "Blender Portable USB 400ml",
        price: 69000,
        originalPrice: 149000,
        sold: 990,
        rating: 4.7,
        location: "Depok",
        store: "Kitchen Mini",
        accent: "from-lime-500 to-emerald-600",
        emoji: "🥤",
    },
    {
        id: "fy-4",
        name: "Powerbank 20000mAh Fast Charge",
        price: 119000,
        originalPrice: 249000,
        sold: 2670,
        rating: 4.8,
        location: "Medan",
        store: "ChargeHub",
        badge: "Terlaris",
        accent: "from-blue-500 to-cyan-600",
        emoji: "🔋",
    },
    {
        id: "fy-5",
        name: "Set Panci Anti Lengket 5 pcs",
        price: 189000,
        originalPrice: 399000,
        sold: 430,
        rating: 4.6,
        location: "Semarang",
        store: "Dapur Pro",
        accent: "from-orange-400 to-rose-500",
        emoji: "🍳",
    },
    {
        id: "fy-6",
        name: "Lip Tint Velvet Matte Tahan Lama",
        price: 27000,
        originalPrice: 65000,
        sold: 5120,
        rating: 4.9,
        location: "Jakarta Timur",
        store: "Bloom Beauty",
        badge: "BPOM",
        accent: "from-rose-400 to-pink-600",
        emoji: "💋",
    },
    {
        id: "fy-7",
        name: "Lampu Meja LED 3 Mode USB",
        price: 49000,
        originalPrice: 99000,
        sold: 1888,
        rating: 4.7,
        location: "Yogyakarta",
        store: "LightNest",
        accent: "from-amber-300 to-yellow-500",
        emoji: "💡",
    },
    {
        id: "fy-8",
        name: "Mouse Wireless Silent Click",
        price: 59000,
        originalPrice: 129000,
        sold: 3011,
        rating: 4.8,
        location: "Malang",
        store: "Office Gear",
        badge: "Mall",
        accent: "from-indigo-500 to-blue-700",
        emoji: "🖱️",
    },
    {
        id: "fy-9",
        name: "Sprei Katun Queen 180x200",
        price: 135000,
        originalPrice: 275000,
        sold: 720,
        rating: 4.7,
        location: "Solo",
        store: "Home Linen",
        accent: "from-sky-400 to-indigo-500",
        emoji: "🛏️",
    },
    {
        id: "fy-10",
        name: "Minyak Goreng 2L + Bonus Kecap",
        price: 32000,
        originalPrice: 45000,
        sold: 9400,
        rating: 4.9,
        location: "Bekasi",
        store: "Sembako Hemat",
        badge: "Grosir",
        accent: "from-yellow-400 to-amber-600",
        emoji: "🛢️",
    },
    {
        id: "fy-11",
        name: "Helm Half Face SNI Dewasa",
        price: 145000,
        originalPrice: 289000,
        sold: 610,
        rating: 4.6,
        location: "Cirebon",
        store: "RideSafe",
        accent: "from-slate-700 to-slate-900",
        emoji: "🪖",
    },
    {
        id: "fy-12",
        name: "Mainan Edukasi Balok Kayu 100 pcs",
        price: 78000,
        originalPrice: 159000,
        sold: 1340,
        rating: 4.8,
        location: "Bogor",
        store: "Kids Play ID",
        badge: "Ibu & Anak",
        accent: "from-teal-400 to-blue-500",
        emoji: "🧩",
    },
];

export function formatRupiah(value: number): string {
    return `Rp${value.toLocaleString("id-ID")}`;
}

export function discountPercent(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatSold(sold: number): string {
    if (sold >= 1000) {
        const ribu = sold / 1000;
        return `${ribu >= 10 ? Math.round(ribu) : ribu.toFixed(1).replace(".0", "")}rb+ terjual`;
    }
    return `${sold} terjual`;
}

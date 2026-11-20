export type ProductVariantOption = {
    id: string;
    label: string;
    priceDelta?: number; // Tambahan harga bila varian tertentu lebih mahal (contoh: +Rp25.000)
    stock?: number;
    colorHex?: string; // Hex color untuk dot visual warna (contoh: #0f172a, #ffffff, #b91c1c)
    image?: string; // Foto varian khusus jika ada
};

export type ProductVariantGroup = {
    id: string; // "warna", "ukuran", "tipe", "kapasitas"
    name: string; // "Pilihan Warna", "Ukuran", "Pilihan Edisi", dll
    type?: "color" | "size" | "text";
    options: ProductVariantOption[];
};

export type MarketplaceProduct = {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    sold: number;
    rating: number;
    location: string;
    store: string;
    category: string;
    description: string;
    stock: number;
    reviewsCount: number;
    badge?: "Mall" | "Terlaris" | "BPOM" | "SNI" | "Lokal" | "Gratis Ongkir";
    accent: string;
    image: string;
    images?: string[];
    tags: string[];
    emoji?: string;
    isMall?: boolean;
    sellerAvatar?: string;
    sellerRating?: number;
    sellerProductsCount?: number;
    sellerResponseTime?: string;
    variantGroups?: ProductVariantGroup[];
};

export const HOME_BANNERS = [
    {
        id: "banner-1",
        tag: "BIG PROMO",
        title: "Festival Belanja Spesial Akhir Tahun",
        subtitle: "Potongan harga hingga 80% ditambah ekstra voucher cashback s/d Rp150.000 dan bebas ongkir ke seluruh Indonesia.",
        cta: "Belanja Sekarang",
        href: "/promo",
        gradient: "from-blue-700 via-indigo-600 to-violet-700",
        pillColor: "bg-amber-400 text-slate-900",
        badge: "Diskon 80%",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "banner-2",
        tag: "OFFICIAL STORE",
        title: "NextShop Mall: 100% Produk Original Brand Resmi",
        subtitle: "Jaminan keaslian uang kembali 2x lipat. Garansi resmi 12 bulan dan perlindungan konsumen terpercaya.",
        cta: "Kunjungi Mall",
        href: "/katalog",
        gradient: "from-slate-950 via-slate-900 to-blue-900",
        pillColor: "bg-rose-500 text-white",
        badge: "Garansi Resmi",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "banner-3",
        tag: "FASHION WEEK",
        title: "Koleksi Trendy Gaya Kekinian 2026",
        subtitle: "Drop terbaru streetwear, casual & batik premium mulai Rp39.000. Cicilan 0% hingga 12 bulan.",
        cta: "Lihat Koleksi",
        href: "/terbaru",
        gradient: "from-indigo-800 via-purple-700 to-pink-600",
        pillColor: "bg-emerald-400 text-slate-900",
        badge: "Mulai Rp39rb",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: "banner-4",
        tag: "SUPER GADGET",
        title: "Upgrade Gadget & Aksesoris Flagship",
        subtitle: "Dapatkan smartphone, TWS & smartwatch impianmu dengan potongan harga langsung s.d Rp1.500.000.",
        cta: "Cek Gadget",
        href: "/katalog",
        gradient: "from-blue-900 via-sky-700 to-cyan-600",
        pillColor: "bg-yellow-400 text-slate-900",
        badge: "Cashback Rp1.5Jt",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    },
] as const;

export const SIDE_BANNERS = [
    {
        id: "side-1",
        tag: "SUPER GADGET",
        title: "Elektronik & Gadget Hemat",
        subtitle: "Cashback hingga 20% koin belanja",
        cta: "Lihat Promo",
        href: "/katalog",
        gradient: "from-emerald-700 via-teal-600 to-cyan-700",
        badge: "Cashback 20%",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    },
    {
        id: "side-2",
        tag: "GROSIR DAPUR",
        title: "Kebutuhan Dapur & Sembako",
        subtitle: "Harga grosir langsung dari distributor",
        cta: "Serbu Sekarang",
        href: "/promo",
        gradient: "from-amber-600 via-orange-600 to-rose-600",
        badge: "Mulai Rp10rb",
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    },
] as const;

export const HOME_CATEGORIES = [
    { id: "elektronik", label: "Elektronik", icon: "smartphone", href: "/katalog", count: "2.4k+ produk", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400" },
    { id: "fashion", label: "Fashion", icon: "shirt", href: "/katalog", count: "4.1k+ produk", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400" },
    { id: "kecantikan", label: "Kecantikan", icon: "sparkles", href: "/katalog", count: "1.8k+ produk", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400" },
    { id: "rumah", label: "Rumah Tangga", icon: "home", href: "/katalog", count: "3.2k+ produk", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400" },
    { id: "makanan", label: "Makanan & Minuman", icon: "utensils", href: "/katalog", count: "2.9k+ produk", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-400" },
    { id: "olahraga", label: "Olahraga", icon: "activity", href: "/katalog", count: "950+ produk", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400" },
    { id: "hobi", label: "Hobi & Gaming", icon: "gamepad", href: "/katalog", count: "1.2k+ produk", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400" },
    { id: "otomotif", label: "Otomotif", icon: "car", href: "/katalog", count: "780+ produk", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-400" },
    { id: "ibu-anak", label: "Ibu & Anak", icon: "baby", href: "/katalog", count: "1.4k+ produk", color: "text-pink-600 bg-pink-50 dark:bg-pink-950/60 dark:text-pink-400" },
    { id: "kesehatan", label: "Kesehatan", icon: "pill", href: "/katalog", count: "1.1k+ produk", color: "text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400" },
    { id: "komputer", label: "Komputer & PC", icon: "laptop", href: "/katalog", count: "1.6k+ produk", color: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300" },
    { id: "voucher", label: "Kupon Promo", icon: "tag", href: "/promo", count: "50+ kupon", color: "text-red-600 bg-red-50 dark:bg-red-950/60 dark:text-red-400" },
] as const;

export const QUICK_ACTIONS = [
    { id: "ongkir", label: "Gratis Ongkir Xtra", hint: "Tanpa minimum belanja", icon: "truck", href: "/promo", badge: "Populer" },
    { id: "voucher", label: "Voucher Diskon", hint: "Klaim s/d Rp150rb", icon: "ticket", href: "/promo", badge: "Hemat" },
    { id: "mall", label: "Official Mall", hint: "100% brand terpercaya", icon: "store", href: "/katalog", badge: "Ori" },
    { id: "topup", label: "Top Up & Tagihan", hint: "Pulsa, PLN & e-Wallet", icon: "zap", href: "/promo", badge: "Instan" },
    { id: "cod", label: "Bayar di Tempat", hint: "COD aman se-Indonesia", icon: "package", href: "/katalog", badge: "Aman" },
    { id: "live", label: "Live Shopping", hint: "28 toko live streaming", icon: "trending", href: "/terbaru", badge: "Live" },
] as const;

export const FLASH_SALE_PRODUCTS: MarketplaceProduct[] = [
    {
        id: "fs-1",
        name: "Headset Gaming RGB 7.1 Surround Sound Pro",
        price: 89000,
        originalPrice: 249000,
        sold: 1820,
        rating: 4.9,
        location: "Jakarta Barat",
        store: "TechHub Official",
        isMall: true,
        sellerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        sellerRating: 4.9,
        sellerProductsCount: 184,
        sellerResponseTime: "Hitungan menit",
        category: "elektronik",
        description: `Headset Gaming RGB 7.1 Surround Sound Pro dirancang khusus untuk para gamer kompetitif dan penikmat audio berdefinisi tinggi. Menggunakan driver neodymium 50mm yang bertenaga, headset ini mampu menghasilkan detail suara spasial 360 derajat yang sangat presisi, memungkinkan Anda mendengar arah langkah kaki musuh, tembakan jarak jauh, dan efek ledakan secara imersif.

Fitur Unggulan Produk:
• 7.1 Virtual Surround Sound: Suara posisi 3D presisi tinggi untuk keunggulan strategi saat bermain game battle royale maupun FPS.
• Mikrofon Noise-Cancelling Ultra Jernih: Komunikasi suara jernih dengan filter peredam bising lingkungan sekitar dan tangkai mikrofon fleksibel 360 derajat.
• Bantalan Telinga Memory Foam Premium: Dilapisi kulit sintetis protein bernapas yang empuk, tidak membuat daun telinga sakit atau panas saat dipakai maraton berjam-jam.
• Efek RGB Dynamic Lighting: Pencahayaan estetik dengan 16.8 juta spektrum warna dinamis yang mempercantik setup gaming Anda.
• Kompatibilitas Luas (Multi-Platform): Mendukung PC Desktop, Laptop, PlayStation 4/5, dan Nintendo Switch melalui konektor USB audio berlapis emas anti-korosi.

Kelengkapan Paket Penjualan:
1x Headset Gaming RGB 7.1 Surround Pro
1x Kabel Ekstensi Audio Splitter
1x Busa Pelindung Mikrofon Cadangan
1x Buku Petunjuk Penggunaan & Kartu Garansi Resmi

Garansi Resmi & Layanan Purna Jual:
Produk ini bergaransi resmi distributor selama 12 bulan dengan fasilitas penggantian unit baru apabila terjadi cacat pabrik. Layanan servis terpercaya tersedia di seluruh kota besar di Indonesia.`,
        stock: 18,
        reviewsCount: 642,
        badge: "Mall",
        accent: "from-blue-600 to-indigo-800",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["Gaming", "7.1 Surround", "Official Store"],
        variantGroups: [
            {
                id: "warna",
                name: "Pilihan Warna",
                type: "color",
                options: [
                    { id: "black", label: "Matte Black", colorHex: "#0f172a", stock: 12 },
                    { id: "white", label: "Arctic White", colorHex: "#f8fafc", stock: 8 },
                    { id: "neon", label: "Cyber Red", colorHex: "#e11d48", stock: 6, priceDelta: 15000 },
                ],
            },
            {
                id: "edisi",
                name: "Paket Audio",
                type: "text",
                options: [
                    { id: "std", label: "Standard 3.5mm", stock: 15 },
                    { id: "pro", label: "7.1 Surround USB", stock: 10, priceDelta: 25000 },
                ],
            },
        ],
    },
    {
        id: "fs-2",
        name: "Smartwatch AMOLED 1.43 Inch GPS & Heart Rate",
        price: 199000,
        originalPrice: 459000,
        sold: 940,
        rating: 4.8,
        location: "Bandung",
        store: "WearLab ID",
        category: "elektronik",
        description: "Layar sentuh AMOLED selalu aktif, 100+ mode olahraga, sertifikasi tahan air 5ATM, baterai tahan hingga 14 hari pemakaian.",
        stock: 7,
        reviewsCount: 312,
        badge: "Terlaris",
        accent: "from-slate-800 to-slate-950",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["AMOLED", "Waterproof", "Garansi 1 Thn"],
    },
    {
        id: "fs-3",
        name: "Serum Vitamin C 20% Brightening Glow BPOM",
        price: 45000,
        originalPrice: 129000,
        sold: 4310,
        rating: 4.9,
        location: "Surabaya",
        store: "Glow Lab",
        category: "kecantikan",
        description: "Mencerahkan noda hitam, meratakan warna kulit dan melembapkan seharian dengan Hyaluronic Acid berkonsentrasi tinggi.",
        stock: 24,
        reviewsCount: 1890,
        badge: "BPOM",
        accent: "from-amber-500 to-orange-700",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1608248597359-00e1262d49f6?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["BPOM", "Brightening", "Halal"],
    },
    {
        id: "fs-4",
        name: "Smart Rice Cooker Digital Low Carbo 1.8L",
        price: 159000,
        originalPrice: 329000,
        sold: 760,
        rating: 4.7,
        location: "Tangerang",
        store: "Dapur Kita",
        category: "rumah",
        description: "Mengurangi kadar gula nasi hingga 45%, wadah keramik tebal anti lengket tahan lama, dilengkapi timer digital 24 jam.",
        stock: 12,
        reviewsCount: 280,
        badge: "SNI",
        accent: "from-emerald-600 to-teal-800",
        image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1584990347449-389f4124316d?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["Low Sugar", "Keramik", "Hemat Daya"],
    },
    {
        id: "fs-5",
        name: "Keyboard Mechanical 87 Key RGB Blue Switch",
        price: 175000,
        originalPrice: 389000,
        sold: 1288,
        rating: 4.8,
        location: "Jakarta Selatan",
        store: "KeyForge",
        category: "elektronik",
        description: "Hotswappable switch 3-pin & 5-pin, kabel Type-C braided detachable, 18 mode efek pencahayaan RGB dinamis.",
        stock: 15,
        reviewsCount: 520,
        badge: "Mall",
        accent: "from-violet-600 to-indigo-900",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["Hot Swap", "RGB", "Clicky"],
    },
    {
        id: "fs-6",
        name: "Sepatu Running Pria Ultra Light Breathable Sport",
        price: 129000,
        originalPrice: 299000,
        sold: 2104,
        rating: 4.6,
        location: "Bekasi",
        store: "Stride Sport",
        category: "fashion",
        description: "Outsole busa elastis peredam hentakan optimal, insole empuk antibakteri, sirkulasi udara optimal untuk lari harian.",
        stock: 9,
        reviewsCount: 840,
        badge: "Gratis Ongkir",
        accent: "from-rose-600 to-red-800",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["Ringan", "Anti Slip", "Olahraga"],
    },
];

export const OFFICIAL_STORES = [
    {
        id: "os-1",
        name: "Samsung Official",
        tagline: "Inovasi Elektronik & Gadget Terdepan",
        brandCode: "SAMSUNG",
        category: "Elektronik & Gadget",
        brandColor: "bg-blue-900 text-white",
        followers: "3.4 Juta",
        promo: "Diskon s/d 40%",
        verified: true,
    },
    {
        id: "os-2",
        name: "Uniqlo Indonesia",
        tagline: "Pakaian Esensial Lifewear",
        brandCode: "UNIQLO",
        category: "Fashion & Pakaian",
        brandColor: "bg-red-600 text-white",
        followers: "2.1 Juta",
        promo: "Koleksi Terbaru",
        verified: true,
    },
    {
        id: "os-3",
        name: "Xiaomi Authorized",
        tagline: "Teknologi Pintar untuk Semua",
        brandCode: "mi",
        category: "Smart Living",
        brandColor: "bg-orange-500 text-white",
        followers: "1.9 Juta",
        promo: "Cashback 15%",
        verified: true,
    },
    {
        id: "os-4",
        name: "Wardah Official",
        tagline: "Pelopor Kosmetik Halal Modern",
        brandCode: "WARDAH",
        category: "Kecantikan Halal",
        brandColor: "bg-teal-700 text-white",
        followers: "2.8 Juta",
        promo: "Beli 1 Gratis 1",
        verified: true,
    },
    {
        id: "os-5",
        name: "Polytron Audio & TV",
        tagline: "Rajanya Audio Berkualitas",
        brandCode: "POLYTRON",
        category: "Elektronik Rumah",
        brandColor: "bg-indigo-900 text-white",
        followers: "980 Ribu",
        promo: "Voucher Rp200rb",
        verified: true,
    },
    {
        id: "os-6",
        name: "Eiger Adventure",
        tagline: "Perlengkapan Outdoor & Petualang",
        brandCode: "EIGER",
        category: "Outdoor & Apparel",
        brandColor: "bg-stone-900 text-white",
        followers: "1.5 Juta",
        promo: "Diskon 50%",
        verified: true,
    },
] as const;

export const FOR_YOU_PRODUCTS: MarketplaceProduct[] = [
    {
        id: "fy-1",
        name: "Tas Ransel Laptop 15.6 Inch Anti Air & Port USB",
        price: 98000,
        originalPrice: 189000,
        sold: 1540,
        rating: 4.8,
        location: "Jakarta Pusat",
        store: "CarryOn Store",
        category: "fashion",
        description: "Bahan oxford polyester tahan gores dan air, kompartemen laptop berbusa tebal, port charging eksternal untuk mobilitas tinggi.",
        stock: 45,
        reviewsCount: 420,
        badge: "Mall",
        accent: "from-slate-700 to-slate-900",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        tags: ["Waterproof", "Laptop 15.6 Inch", "Port USB"],
    },
    {
        id: "fy-2",
        name: "Kaos Oversize Streetwear Cotton Combed 24s Heavyweight",
        price: 39000,
        originalPrice: 79000,
        sold: 8200,
        rating: 4.9,
        location: "Bandung",
        store: "Cotton Local",
        category: "fashion",
        description: "100% katun murni menyerap keringat dengan baik, jahitan rantai standar distro, bahan padat dan tidak melar.",
        stock: 120,
        reviewsCount: 3100,
        badge: "Lokal",
        accent: "from-zinc-700 to-zinc-950",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        tags: ["100% Katun", "Distro", "Oversize"],
    },
    {
        id: "fy-3",
        name: "Blender Portable USB 400ml 6 Mata Pisau Stainless",
        price: 69000,
        originalPrice: 149000,
        sold: 990,
        rating: 4.7,
        location: "Depok",
        store: "Kitchen Mini",
        category: "rumah",
        description: "Praktis untuk jus buah segar dan smoothies saat bepergian, kapasitas baterai 2000mAh isi ulang lewat kabel USB.",
        stock: 33,
        reviewsCount: 260,
        accent: "from-teal-600 to-emerald-800",
        image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80",
        tags: ["Rechargeable", "Stainless 304", "BPA Free"],
    },
    {
        id: "fy-4",
        name: "Powerbank 20000mAh Fast Charge 22.5W LED Digital",
        price: 119000,
        originalPrice: 249000,
        sold: 2670,
        rating: 4.8,
        location: "Medan",
        store: "ChargeHub",
        category: "elektronik",
        description: "Mendukung Quick Charge 3.0 dan Power Delivery, mampu mengisi daya 3 perangkat sekaligus secara cepat dan stabil.",
        stock: 60,
        reviewsCount: 890,
        badge: "Terlaris",
        accent: "from-blue-700 to-cyan-800",
        image: "https://images.unsplash.com/photo-1609592426896-b0767e7198bb?auto=format&fit=crop&w=600&q=80",
        tags: ["PD 22.5W", "20000mAh", "Flight Safe"],
    },
    {
        id: "fy-5",
        name: "Set Panci Anti Lengket Granit 5 Pcs Food Grade",
        price: 189000,
        originalPrice: 399000,
        sold: 430,
        rating: 4.6,
        location: "Semarang",
        store: "Dapur Pro",
        category: "rumah",
        description: "Lapisan granit Jerman 6 lapis bebas racun PFOA, cocok untuk kompor gas maupun kompor induksi modern.",
        stock: 19,
        reviewsCount: 140,
        badge: "Mall",
        accent: "from-stone-700 to-stone-900",
        image: "https://images.unsplash.com/photo-1584990347449-389f4124316d?auto=format&fit=crop&w=600&q=80",
        tags: ["Granite Coating", "Induksi", "Bebas PFOA"],
    },
    {
        id: "fy-6",
        name: "Lip Tint Velvet Matte Tahan 16 Jam Transferproof",
        price: 27000,
        originalPrice: 65000,
        sold: 5120,
        rating: 4.9,
        location: "Jakarta Timur",
        store: "Bloom Beauty",
        category: "kecantikan",
        description: "Formula ringan tidak membuat bibir kering, diperkaya Vitamin E dan Jojoba Oil untuk kelembapan ekstra alami.",
        stock: 90,
        reviewsCount: 1750,
        badge: "BPOM",
        accent: "from-rose-600 to-pink-800",
        image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
        tags: ["BPOM", "Transferproof", "Vitamin E"],
    },
    {
        id: "fy-7",
        name: "Lampu Meja Belajar LED 3 Mode Warna Touch Dimming",
        price: 49000,
        originalPrice: 99000,
        sold: 1888,
        rating: 4.7,
        location: "Yogyakarta",
        store: "LightNest",
        category: "rumah",
        description: "Leher fleksibel 360 derajat, cahaya ramah mata anti silau (flicker-free), baterai lithium 1200mAh isi ulang.",
        stock: 55,
        reviewsCount: 470,
        accent: "from-amber-600 to-stone-800",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
        tags: ["Eye Care", "Touch Dimmer", "USB"],
    },
    {
        id: "fy-8",
        name: "Mouse Wireless Ergonomis Silent Click 2.4GHz + BT 5.0",
        price: 59000,
        originalPrice: 129000,
        sold: 3011,
        rating: 4.8,
        location: "Malang",
        store: "Office Gear",
        category: "elektronik",
        description: "Dual mode koneksi Bluetooth dan USB Receiver, klik sunyi tanpa suara bising, resolusi sensor optik hingga 1600 DPI.",
        stock: 75,
        reviewsCount: 1120,
        badge: "Mall",
        accent: "from-slate-700 to-slate-900",
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        tags: ["Silent Click", "Dual Mode", "Ergonomis"],
    },
    {
        id: "fy-9",
        name: "Sprei Katun Jepang King 180x200 Tinggi 30cm Lembut",
        price: 135000,
        originalPrice: 275000,
        sold: 720,
        rating: 4.7,
        location: "Solo",
        store: "Home Linen",
        category: "rumah",
        description: "Serat katun microtex kerapatan tinggi, sangat adem dan tidak berpasir walau dicuci berkali-kali.",
        stock: 28,
        reviewsCount: 210,
        accent: "from-sky-700 to-blue-900",
        image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
        tags: ["Microtex", "Tinggi 30cm", "Adem"],
    },
    {
        id: "fy-10",
        name: "Minyak Goreng Kelapa Murni 2L + Bonus Kecap Manis",
        price: 32000,
        originalPrice: 45000,
        sold: 9400,
        rating: 4.9,
        location: "Bekasi",
        store: "Sembako Hemat",
        category: "makanan",
        description: "Minyak goreng jernih 2 kali penyaringan higienis, tahan panas dan tidak mudah gosong, sehat untuk keluarga.",
        stock: 200,
        reviewsCount: 3900,
        badge: "SNI",
        accent: "from-amber-600 to-yellow-800",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        tags: ["Penyaringan 2x", "Halal MUI", "Grosir"],
    },
    {
        id: "fy-11",
        name: "Helm Retro Bogo Half Face SNI Kaca Datar Smoke",
        price: 145000,
        originalPrice: 289000,
        sold: 610,
        rating: 4.6,
        location: "Cirebon",
        store: "RideSafe",
        category: "otomotif",
        description: "Busa tebal knock-down bisa dilepas dan dicuci, shell ABS tahan benturan bentukan presisi, kaca smoke anti UV.",
        stock: 22,
        reviewsCount: 180,
        badge: "SNI",
        accent: "from-neutral-800 to-black",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
        tags: ["Standar SNI", "Anti UV", "Busa Cuci"],
    },
    {
        id: "fy-12",
        name: "Mainan Edukasi Anak Balok Kayu Puzzle 100 Pcs",
        price: 78000,
        originalPrice: 159000,
        sold: 1340,
        rating: 4.8,
        location: "Bogor",
        store: "Kids Play ID",
        category: "rumah",
        description: "Kayu pinus halus bebas serat tajam, cat non-toxic berbahan dasar air ramah lingkungan untuk motorik anak.",
        stock: 40,
        reviewsCount: 380,
        badge: "SNI",
        accent: "from-emerald-700 to-teal-900",
        image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80",
        tags: ["Non Toxic", "Kayu Halus", "Montessori"],
    },
    {
        id: "fy-13",
        name: "Earphone Bluetooth TWS ANC Active Noise Cancelling",
        price: 139000,
        originalPrice: 299000,
        sold: 3820,
        rating: 4.9,
        location: "Jakarta Utara",
        store: "Acoustic Audio",
        category: "elektronik",
        description: "Peredam bising frekuensi rendah hingga -35dB, dentuman bass punchy dan latency rendah saat main game.",
        stock: 42,
        reviewsCount: 1420,
        badge: "Mall",
        accent: "from-slate-800 to-blue-950",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        tags: ["ANC 35dB", "Low Latency", "Bass Booster"],
    },
    {
        id: "fy-14",
        name: "Jaket Windbreaker Outdoor Waterproof & Windproof",
        price: 115000,
        originalPrice: 230000,
        sold: 1980,
        rating: 4.8,
        location: "Bandung",
        store: "Apex Apparel",
        category: "fashion",
        description: "Lapisan parasut taslan anti air dan angin kencang, furing jaring sirkulasi adem, tudung kepala tersembunyi.",
        stock: 35,
        reviewsCount: 740,
        badge: "Lokal",
        accent: "from-zinc-800 to-black",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        tags: ["Taslan Waterproof", "Windproof", "Hoodie"],
    },
    {
        id: "fy-15",
        name: "Sunscreen Serum SPF 50+ PA++++ No Whitecast 50ml",
        price: 52000,
        originalPrice: 110000,
        sold: 6740,
        rating: 4.9,
        location: "Jakarta Barat",
        store: "SunCare ID",
        category: "kecantikan",
        description: "Tekstur watery gel seringan air, cepat meresap tanpa meninggalkan lapisan putih ataupun rasa lengket.",
        stock: 85,
        reviewsCount: 2400,
        badge: "BPOM",
        accent: "from-amber-500 to-orange-700",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        tags: ["SPF 50+", "PA++++", "Watery Gel"],
    },
    {
        id: "fy-16",
        name: "Kopi Arabika Gayo Single Origin Roasted Beans 250g",
        price: 48000,
        originalPrice: 85000,
        sold: 2310,
        rating: 4.9,
        location: "Aceh / Medan",
        store: "Gayo Roastery",
        category: "makanan",
        description: "100% biji kopi Arabika pilihan dataran tinggi Gayo, profil sangrai medium to dark dengan aroma floral dan karamel.",
        stock: 65,
        reviewsCount: 910,
        badge: "Lokal",
        accent: "from-amber-800 to-stone-950",
        image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80",
        tags: ["Single Origin", "Fresh Roast", "Aroma Mantap"],
    },
    {
        id: "fy-17",
        name: "Kemeja Flanel Katun Pria Lengan Panjang Motif Kotak Klasik",
        price: 89000,
        originalPrice: 145000,
        sold: 28,
        rating: 0,
        location: "Surakarta",
        store: "Flannel House",
        isMall: false,
        sellerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        sellerRating: 4.8,
        sellerProductsCount: 38,
        sellerResponseTime: "1 jam",
        category: "fashion",
        description: `Kemeja Flanel Katun Pria Lengan Panjang Motif Kotak Klasik dirancang untuk Anda yang mengutamakan kenyamanan dan gaya kasual autentik. Dibuat menggunakan bahan katun flanel 100% pilihan yang telah melalui proses double brushing, menghasilkan tekstur kain yang lembut di kulit dan memberikan kehangatan ideal di cuaca sejuk.

Karakteristik & Detail Bahan:
• 100% Katun Flanel Pilihan: Lembut, tidak kaku, dan memiliki sirkulasi udara yang baik sehingga tetap nyaman dipakai seharian.
• Pola Regular-Fit Ergonomis: Potongan proporsional yang pas di tubuh, cocok dipakai berkancing rapi maupun sebagai outer santai.
• Kancing Jahitan Kuat: Kancing berkualitas dengan jahitan silang dobel yang tidak mudah copot saat dicuci berulang kali.
• Saku Depan Fungsional: Dilengkapi saku dada kiri dengan potongan motif presisi untuk menyimpan kartu atau kacamata.

Panduan Perawatan:
Dapat dicuci menggunakan mesin cuci putaran normal dengan air dingin atau suhu ruang. Hindari pemutih klorin agar kepekatan warna motif kotak tetap tahan lama. Setrika dengan temperatur sedang pada bagian dalam kain.`,
        stock: 50,
        reviewsCount: 0,
        badge: "Lokal",
        accent: "from-red-800 to-stone-900",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["Katun Flanel", "Casual", "Lokal"],
        variantGroups: [
            {
                id: "warna",
                name: "Pilihan Warna / Motif",
                type: "color",
                options: [
                    { id: "red-black", label: "Merah Kotak", colorHex: "#881337", stock: 18 },
                    { id: "navy", label: "Navy Tartan", colorHex: "#1e3a8a", stock: 15 },
                    { id: "emerald", label: "Forest Green", colorHex: "#064e3b", stock: 17 },
                ],
            },
            {
                id: "ukuran",
                name: "Pilihan Ukuran",
                type: "size",
                options: [
                    { id: "m", label: "M", stock: 15 },
                    { id: "l", label: "L", stock: 20 },
                    { id: "xl", label: "XL", stock: 10 },
                    { id: "xxl", label: "XXL", stock: 5, priceDelta: 10000 },
                ],
            },
        ],
    },
    {
        id: "fy-18",
        name: "Speaker Bluetooth Mini Portable Bass Booster Tahan Air IPX5",
        price: 110000,
        originalPrice: 199000,
        sold: 0,
        rating: 0,
        location: "Jakarta Utara",
        store: "SoundWave ID",
        category: "elektronik",
        description: "Suara jernih 360 derajat, baterai tahan 10 jam, sertifikasi tahan cipratan air IPX5.",
        stock: 100,
        reviewsCount: 0,
        accent: "from-cyan-700 to-blue-900",
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80",
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80",
        ],
        tags: ["Bluetooth 5.3", "IPX5", "Baru"],
        variantGroups: [], // Produk ini tidak memiliki varian tambahan (toko hanya menjual 1 varian standar)
    },
];

export const ALL_PRODUCTS: MarketplaceProduct[] = [
    ...FLASH_SALE_PRODUCTS,
    ...FOR_YOU_PRODUCTS,
];

export function getProductById(id: string): MarketplaceProduct | undefined {
    return ALL_PRODUCTS.find((p) => p.id === id);
}

export function getProductImages(product: MarketplaceProduct): string[] {
    if (product.images && product.images.length > 0) {
        return product.images;
    }
    return [
        product.image,
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80",
    ];
}

export function formatRupiah(value: number): string {
    return `Rp${value.toLocaleString("id-ID")}`;
}

export function discountPercent(price: number, originalPrice: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatSold(sold: number): string {
    if (sold === 0) {
        return "Belum ada penjualan";
    }
    if (sold >= 1000) {
        const ribu = sold / 1000;
        return `${ribu >= 10 ? Math.round(ribu) : ribu.toFixed(1).replace(".0", "")}rb+ terjual`;
    }
    return `${sold} terjual`;
}

export function getSellerInfo(product: MarketplaceProduct) {
    const isMall = product.isMall !== undefined ? product.isMall : (product.badge === "Mall");
    return {
        store: product.store,
        isMall,
        location: product.location,
        avatar: product.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        rating: product.sellerRating || 4.9,
        productsCount: product.sellerProductsCount || 124,
        responseTime: product.sellerResponseTime || "Hitungan menit",
    };
}

export function getProductVariantGroups(product: MarketplaceProduct): ProductVariantGroup[] {
    // 1. Jika toko eksplisit mengatur variantGroups (termasuk [] bila tidak ada varian sama sekali)
    if (product.variantGroups !== undefined) {
        return product.variantGroups;
    }

    // 2. Default fallback cerdas berdasarkan kategori produk jika belum ditentukan di mock data
    if (product.category === "fashion") {
        return [
            {
                id: "warna",
                name: "Pilihan Warna",
                type: "color",
                options: [
                    { id: "hitam", label: "Hitam", colorHex: "#0f172a", stock: 15 },
                    { id: "putih", label: "Putih", colorHex: "#f8fafc", stock: 12 },
                    { id: "navy", label: "Navy", colorHex: "#1e3a8a", stock: 10 },
                ],
            },
            {
                id: "ukuran",
                name: "Pilihan Ukuran",
                type: "size",
                options: [
                    { id: "s", label: "S", stock: 8 },
                    { id: "m", label: "M", stock: 15 },
                    { id: "l", label: "L", stock: 12 },
                    { id: "xl", label: "XL", stock: 6, priceDelta: 10000 },
                ],
            },
        ];
    }

    if (product.category === "elektronik") {
        return [
            {
                id: "warna",
                name: "Pilihan Warna",
                type: "color",
                options: [
                    { id: "black", label: "Black", colorHex: "#0f172a", stock: 10 },
                    { id: "silver", label: "Silver", colorHex: "#cbd5e1", stock: 8 },
                ],
            },
        ];
    }

    // Kategori umum secara default tidak memiliki varian tambahan (1 varian standar)
    return [];
}

// ---------------------------------------------------------------------------
// Store / Toko Profiles & Product Catalog Helpers
// ---------------------------------------------------------------------------

export function slugifyStore(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export type StoreProfile = {
    slug: string;
    name: string;
    isMall: boolean;
    avatar: string;
    banner: string;
    description: string;
    rating: number;
    reviewsCount: number;
    productsCount: number;
    location: string;
    joinedDate: string;
    responseTime: string;
    followersCount: number;
    customCategories: string[];
};

export const STORE_PROFILES: Record<string, StoreProfile> = {
    "techhub-official": {
        slug: "techhub-official",
        name: "TechHub Official",
        isMall: true,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80",
        description: "Official Flagship Store distributor resmi perlengkapan audio, gaming gear, dan aksesoris teknologi premium bersertifikasi di Indonesia. Jaminan 100% Produk Original Mall dengan garansi distributor 12 bulan.",
        rating: 4.9,
        reviewsCount: 3820,
        productsCount: 184,
        location: "Jakarta Barat",
        joinedDate: "Bergabung Maret 2022",
        responseTime: "Hitungan menit",
        followersCount: 48200,
        customCategories: ["Semua Produk", "Audio & Headset", "Aksesoris Gaming", "Keyboard & Mouse", "Promo Toko"],
    },
    "flannel-house": {
        slug: "flannel-house",
        name: "Flannel House",
        isMall: false,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        banner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80",
        description: "Brand apparel kasual lokal asal Surakarta yang memproduksi kemeja flanel katun 100% lembut, outer hangat, dan pakaian harian berkualitas dengan jahitan dobel presisi.",
        rating: 4.8,
        reviewsCount: 412,
        productsCount: 38,
        location: "Surakarta",
        joinedDate: "Bergabung Agustus 2023",
        responseTime: "1 jam",
        followersCount: 9350,
        customCategories: ["Semua Produk", "Kemeja Flanel", "Outer & Jaket", "Kaos Polos & Motif", "Diskon Cuci Gudang"],
    },
    "soundwave-id": {
        slug: "soundwave-id",
        name: "SoundWave ID",
        isMall: false,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80",
        description: "Pusat speaker bluetooth portable, TWS nirkabel, dan perangkat audio bass booster bersertifikasi tahan air untuk menemani aktivitas harian, outdoor, dan olahraga.",
        rating: 4.7,
        reviewsCount: 890,
        productsCount: 64,
        location: "Jakarta Utara",
        joinedDate: "Bergabung November 2022",
        responseTime: "15 menit",
        followersCount: 15200,
        customCategories: ["Semua Produk", "Speaker Bluetooth", "TWS Earphone", "Aksesoris Audio", "Paket Bundling"],
    },
};

export function getStoreProfile(slugOrName: string): StoreProfile {
    const slug = slugifyStore(slugOrName);
    if (STORE_PROFILES[slug]) {
        return STORE_PROFILES[slug];
    }

    // Cari dari ALL_PRODUCTS jika belum terdaftar statis
    const matchedProduct = ALL_PRODUCTS.find(
        (p) => slugifyStore(p.store) === slug || p.store.toLowerCase() === slugOrName.toLowerCase()
    );

    const isMall = matchedProduct?.isMall || matchedProduct?.badge === "Mall" || false;
    const name = matchedProduct?.store || slugOrName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return {
        slug,
        name,
        isMall,
        avatar: matchedProduct?.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
        banner: isMall
            ? "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80"
            : "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80",
        description: `${name} adalah toko terpercaya di NextShopID yang menyediakan berbagai produk berkualitas dengan harga bersaing dan jaminan pelayanan terbaik.`,
        rating: matchedProduct?.sellerRating || 4.8,
        reviewsCount: 520,
        productsCount: matchedProduct?.sellerProductsCount || 45,
        location: matchedProduct?.location || "Jakarta",
        joinedDate: "Bergabung 2023",
        responseTime: matchedProduct?.sellerResponseTime || "Hitungan menit",
        followersCount: isMall ? 32000 : 8500,
        customCategories: ["Semua Produk", "Produk Unggulan", "Koleksi Terbaru", "Diskon Toko"],
    };
}

export function getStoreProducts(storeSlugOrName: string): MarketplaceProduct[] {
    const profile = getStoreProfile(storeSlugOrName);
    const storeSlug = profile.slug;

    // Filter produk yang ada di ALL_PRODUCTS yang tokonya cocok
    const directProducts = ALL_PRODUCTS.filter((p) => slugifyStore(p.store) === storeSlug);

    // Jika toko memiliki produk tambahan spesifik toko untuk mengisi customCategories
    if (storeSlug === "techhub-official") {
        const extraTechHub: MarketplaceProduct[] = [
            {
                id: "th-1",
                name: "Keyboard Mechanical RGB Blue Switch Tenkeyless",
                price: 249000,
                originalPrice: 499000,
                sold: 840,
                rating: 4.9,
                location: "Jakarta Barat",
                store: "TechHub Official",
                isMall: true,
                category: "elektronik",
                description: "Keyboard mechanical RGB tenkeyless dengan switch biru responsif dan keycaps anti-fading.",
                stock: 45,
                reviewsCount: 310,
                badge: "Mall",
                accent: "from-blue-600 to-indigo-800",
                image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
                tags: ["Keyboard", "Mechanical", "RGB"],
            },
            {
                id: "th-2",
                name: "Mouse Gaming Wireless 16000 DPI Ultra Lightweight 68g",
                price: 179000,
                originalPrice: 320000,
                sold: 1200,
                rating: 4.8,
                location: "Jakarta Barat",
                store: "TechHub Official",
                isMall: true,
                category: "elektronik",
                description: "Mouse gaming nirkabel sensor optik presisi tinggi 16000 DPI dengan bobot ringan hanya 68 gram.",
                stock: 30,
                reviewsCount: 520,
                badge: "Mall",
                accent: "from-purple-600 to-indigo-900",
                image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
                tags: ["Mouse Gaming", "Wireless", "RGB"],
            },
            {
                id: "th-3",
                name: "TWS Earbuds ANC Active Noise Cancelling Low Latency",
                price: 189000,
                originalPrice: 389000,
                sold: 650,
                rating: 4.8,
                location: "Jakarta Barat",
                store: "TechHub Official",
                isMall: true,
                category: "elektronik",
                description: "Earphone nirkabel TWS dengan peredam bising aktif ANC dan mode low latency gaming 40ms.",
                stock: 25,
                reviewsCount: 240,
                badge: "Mall",
                accent: "from-sky-600 to-blue-800",
                image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
                tags: ["TWS", "ANC", "Wireless"],
            },
            {
                id: "th-4",
                name: "Mousepad Gaming Deskmat Speed 90x40cm Jahit Tepi",
                price: 49000,
                originalPrice: 99000,
                sold: 2100,
                rating: 4.9,
                location: "Jakarta Barat",
                store: "TechHub Official",
                isMall: true,
                category: "elektronik",
                description: "Deskmat jumbo 90x40cm bahan micro-woven cloth halus dengan jahit tepi anti-koyak.",
                stock: 80,
                reviewsCount: 880,
                badge: "Mall",
                accent: "from-slate-700 to-slate-900",
                image: "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=800&q=80",
                tags: ["Deskmat", "Gaming", "Aksesoris"],
            },
            {
                id: "th-5",
                name: "Headphone Stand RGB dengan Dual USB Fast Hub",
                price: 79000,
                originalPrice: 159000,
                sold: 430,
                rating: 4.7,
                location: "Jakarta Barat",
                store: "TechHub Official",
                isMall: true,
                category: "elektronik",
                description: "Penyangga headphone estetik dengan lampu RGB dinamis dan 2 port USB hub.",
                stock: 20,
                reviewsCount: 160,
                badge: "Mall",
                accent: "from-blue-600 to-violet-800",
                image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
                tags: ["Stand", "RGB", "USB Hub"],
            },
        ];

        return [...directProducts, ...extraTechHub];
    }

    if (storeSlug === "flannel-house") {
        const extraFlannel: MarketplaceProduct[] = [
            {
                id: "fh-1",
                name: "Kemeja Flanel Katun Pria Lengan Pendek Kasual Modern",
                price: 79000,
                originalPrice: 129000,
                sold: 62,
                rating: 4.8,
                location: "Surakarta",
                store: "Flannel House",
                isMall: false,
                category: "fashion",
                description: "Kemeja flanel lengan pendek cocok untuk iklim tropis dengan motif tartan modern.",
                stock: 35,
                reviewsCount: 42,
                badge: "Lokal",
                accent: "from-amber-700 to-stone-900",
                image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
                tags: ["Flanel Pendek", "Katun", "Lokal"],
            },
            {
                id: "fh-2",
                name: "Jaket Trucker Canvas Flanel Warm Fleece Lining",
                price: 189000,
                originalPrice: 299000,
                sold: 48,
                rating: 4.9,
                location: "Surakarta",
                store: "Flannel House",
                isMall: false,
                category: "fashion",
                description: "Jaket canvas tebal dengan lapisan dalam bulu fleece motif flanel yang hangat dan maskulin.",
                stock: 20,
                reviewsCount: 30,
                badge: "Lokal",
                accent: "from-amber-800 to-stone-900",
                image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
                tags: ["Jaket", "Fleece", "Lokal"],
            },
            {
                id: "fh-3",
                name: "Kaos Polos Heavyweight Cotton 24s Regular Fit",
                price: 49000,
                originalPrice: 85000,
                sold: 140,
                rating: 4.8,
                location: "Surakarta",
                store: "Flannel House",
                isMall: false,
                category: "fashion",
                description: "Kaos oblong katun combed 24s heavyweight tebal, tidak nerawang, dan nyaman untuk inner flanel.",
                stock: 50,
                reviewsCount: 88,
                badge: "Lokal",
                accent: "from-slate-700 to-stone-900",
                image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
                tags: ["Kaos Polos", "Cotton 24s", "Lokal"],
            },
        ];
        return [...directProducts, ...extraFlannel];
    }

    if (directProducts.length > 0) {
        return directProducts;
    }

    return ALL_PRODUCTS.slice(0, 6);
}

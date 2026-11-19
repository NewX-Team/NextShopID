import type { Metadata } from "next";
import Link from "next/link";
import { ProductDetailTopView } from "@/components/product/ProductDetailTopView";
import { ALL_PRODUCTS, getProductById } from "@/data/marketplace";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const product = getProductById(id);
    if (!product) {
        return {
            title: "Produk Tidak Ditemukan - NextShopID",
        };
    }
    return {
        title: `${product.name} - NextShopID`,
        description: product.description,
    };
}

export async function generateStaticParams() {
    return ALL_PRODUCTS.map((product) => ({
        id: product.id,
    }));
}

export default async function ProductDetailPage({ params }: PageProps) {
    const { id } = await params;
    const product = getProductById(id);

    if (!product) {
        return (
            <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
                <div className="max-w-md space-y-3">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        Produk Tidak Ditemukan
                    </h1>
                    <p className="text-xs text-slate-500">
                        Produk dengan ID &quot;{id}&quot; mungkin telah dihapus atau tautan tidak valid.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                        Kembali ke Beranda
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 dark:bg-[#070b12] transition-colors duration-200">
            <ProductDetailTopView product={product} />
        </main>
    );
}

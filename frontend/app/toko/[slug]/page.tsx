import type { Metadata } from "next";
import Link from "next/link";
import { StorefrontView } from "@/components/store/StorefrontView";
import {
    ALL_PRODUCTS,
    getStoreProfile,
    getStoreProducts,
    slugifyStore,
    STORE_PROFILES,
} from "@/data/marketplace";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const store = getStoreProfile(slug);
    return {
        title: `${store.name} - Toko Resmi NextShopID`,
        description: store.description,
    };
}

export async function generateStaticParams() {
    const slugsFromProfiles = Object.keys(STORE_PROFILES);
    const slugsFromProducts = ALL_PRODUCTS.map((p) => slugifyStore(p.store));
    const uniqueSlugs = Array.from(new Set([...slugsFromProfiles, ...slugsFromProducts]));

    return uniqueSlugs.map((slug) => ({
        slug,
    }));
}

export default async function StorePage({ params }: PageProps) {
    const { slug } = await params;
    const store = getStoreProfile(slug);
    const products = getStoreProducts(slug);

    return (
        <main>
            <StorefrontView store={store} initialProducts={products} />
        </main>
    );
}

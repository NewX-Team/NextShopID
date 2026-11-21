import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { ALL_PRODUCTS } from "@/data/marketplace";

export const metadata: Metadata = {
  title: "Katalog Produk - NextShopID",
  description:
    "Jelajahi ribuan produk terbaik dari toko resmi dan penjual terverifikasi di NextShopID.",
};

export default function KatalogPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] transition-colors duration-200">
      <CatalogView initialProducts={ALL_PRODUCTS} />
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorite - NextShopID",
  description: "Produk favorit Anda di NextShopID",
};

export default function FavoritePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20 bg-white">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        ini favorite page
      </h1>
    </main>
  );
}

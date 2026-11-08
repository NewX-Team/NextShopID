import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promo - NextShopID",
  description: "Promo spesial NextShopID",
};

export default function PromoPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20 bg-white">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        ini promo page
      </h1>
    </main>
  );
}

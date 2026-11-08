import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terbaru - NextShopID",
  description: "Produk terbaru NextShopID",
};

export default function TerbaruPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20 bg-white dark:bg-[#0b0f19] transition-colors duration-200">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl transition-colors duration-200">
        ini terbaru page
      </h1>
    </main>
  );
}

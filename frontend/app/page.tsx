import type { Metadata } from "next";
import { BuyerHome } from "@/components/home/BuyerHome";

export const metadata: Metadata = {
  title: "Beranda Pembeli - NextShopID",
  description: "Belanja online seperti marketplace: flash sale, kategori, toko resmi, dan rekomendasi harian.",
};

export default function HomePage() {
  return <BuyerHome />;
}

import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductRedirectPage({ params }: PageProps) {
    const { id } = await params;
    redirect(`/produk/${id}`);
}

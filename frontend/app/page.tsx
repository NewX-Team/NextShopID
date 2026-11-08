import { Navbar } from "@/components/layout/Navbar";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* Navbar Modern dengan Referensi Industri Kelas Dunia */}
      <Navbar />

      {/* Main Content: Template Kosongan Bersih dengan Teks Hitam di Tengah */}
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            ini home page
          </h1>
        </div>
      </main>
    </div>
  );
}

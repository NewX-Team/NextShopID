import Link from "next/link";

// Halaman utama (Home / Landing page awal)
export default function Home() {
  return (
    // Box utama di tengah dengan gaya hitam-putih simpel
    <div
      style={{
        maxWidth: "600px",
        margin: "60px auto",
        padding: "24px",
        fontFamily: "sans-serif",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Judul & deskripsi singkat */}
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>
        NextShopID
      </h1>
      <p style={{ fontSize: "16px", marginBottom: "24px" }}>
        Platform E-Commerce NextShopID (Frontend)
      </p>

      {/* Tombol pintas navigasi ke Login dan Register */}
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Tombol ke Login: warna hitam teks putih */}
        <Link
          href="/login"
          style={{
            padding: "10px 20px",
            backgroundColor: "#000",
            color: "#fff",
            textDecoration: "none",
            fontWeight: "bold",
            border: "1px solid #000",
          }}
        >
          Ke Halaman Login
        </Link>

        {/* Tombol ke Register: warna putih teks hitam */}
        <Link
          href="/register"
          style={{
            padding: "10px 20px",
            backgroundColor: "#fff",
            color: "#000",
            textDecoration: "none",
            fontWeight: "bold",
            border: "1px solid #000",
          }}
        >
          Ke Halaman Register
        </Link>
      </div>
    </div>
  );
}

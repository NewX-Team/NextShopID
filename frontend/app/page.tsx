import Link from "next/link";

// Entry point route (/) - portal navigasi sementara selama fase prototyping
export default function Home() {
  return (
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
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>
        NextShopID
      </h1>
      <p style={{ fontSize: "16px", marginBottom: "24px" }}>
        Platform E-Commerce NextShopID (Frontend)
      </p>

      <div style={{ display: "flex", gap: "12px" }}>
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

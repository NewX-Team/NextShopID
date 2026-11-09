import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  // Fallback secret key untuk fase development
  JWT_SECRET: process.env.JWT_SECRET || "nextshopid_super_secret_jwt_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Direktori penyimpanan file SQLite
  DATA_DIR: path.resolve(__dirname, "../../data"),
  DB_NAME: "app.sqlite",

  // URL aplikasi frontend untuk membentuk tautan aksi di email (mis. reset password)
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Driver pengiriman email: 'log' (catat ke file/terminal) atau 'smtp' (kirim nyata)
  MAIL_MAILER: (process.env.MAIL_MAILER || "log") as "log" | "smtp",
  MAIL_LOG_PATH: path.resolve(__dirname, "../../", process.env.MAIL_LOG_PATH || "logs/mail.log"),

  // Konfigurasi transport SMTP
  MAIL_HOST: process.env.MAIL_HOST || "smtp.gmail.com",
  MAIL_PORT: parseInt(process.env.MAIL_PORT || "587", 10),
  MAIL_USER: process.env.MAIL_USER || "",
  MAIL_PASS: process.env.MAIL_PASS || "",
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "NextShopID",
  MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS || "no-reply@nextshopid.com",
};

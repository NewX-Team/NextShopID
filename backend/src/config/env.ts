import dotenv from "dotenv";
import path from "node:path";

// Load file .env jika ada di root backend
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  // Fallback secret key untuk fase development
  JWT_SECRET: process.env.JWT_SECRET || "nextshopid_super_secret_jwt_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Lokasi direktori penyimpanan file SQLite
  DATA_DIR: path.resolve(__dirname, "../../data"),
  DB_NAME: "app.sqlite",
};

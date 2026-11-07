import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Komponen Input dasar dengan dukungan label dan error text.
 * Menggunakan styling minimal hitam-putih untuk kebutuhan prototype.
 * Jika mau migrasi ke Tailwind v4 utility class,
 * perubahannya cukup di file ini tanpa mengubah kode di level form.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  name,
  style,
  ...restProps
}) => {
  // Bind ID input ke label untuk accessibility (A11y)
  const inputId = id || name;

  return (
    <div style={{ marginBottom: "16px", width: "100%" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: "500",
            fontSize: "14px",
            color: "#000",
          }}
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "14px",
          boxSizing: "border-box",
          border: error ? "2px solid #000" : "1px solid #000",
          backgroundColor: "#fff",
          color: "#000",
          borderRadius: "0",
          outline: "none",
          ...style,
        }}
        {...restProps}
      />

      {helperText && !error && (
        <p style={{ marginTop: "4px", fontSize: "12px", color: "#555" }}>
          {helperText}
        </p>
      )}

      {error && (
        <p style={{ marginTop: "4px", fontSize: "12px", fontWeight: "bold", color: "#000" }}>
          * {error}
        </p>
      )}
    </div>
  );
};

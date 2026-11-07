import React from "react";

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Kontainer modular untuk form auth.
 * Max-width 420px diatur agar tetap simetris saat diakses lewat mobile maupun desktop.
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  style,
}) => {
  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "50px auto",
        padding: "28px",
        backgroundColor: "#fff",
        color: "#000",
        border: "1px solid #000",
        fontFamily: "sans-serif",
        ...style,
      }}
    >
      {title && (
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: subtitle ? "4px" : "20px" }}>
          {title}
        </h1>
      )}
      {subtitle && (
        <p style={{ fontSize: "14px", color: "#444", marginBottom: "20px" }}>
          {subtitle}
        </p>
      )}

      <div>{children}</div>

      {footer && (
        <div style={{ marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
          {footer}
        </div>
      )}
    </div>
  );
};

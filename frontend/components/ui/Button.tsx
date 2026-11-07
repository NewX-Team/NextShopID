import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

/**
 * Reusable button.
 * Default disable otomatis ketika `isLoading` bernilai true untuk mencegah double submit.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  style,
  ...restProps
}) => {
  const isPrimary = variant === "primary";
  const baseBackgroundColor = isPrimary ? "#000" : "#fff";
  const baseTextColor = isPrimary ? "#fff" : "#000";

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        width: "100%",
        padding: "10px 16px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        backgroundColor: disabled ? "#ccc" : baseBackgroundColor,
        color: baseTextColor,
        border: "1px solid #000",
        borderRadius: "0",
        transition: "opacity 0.2s ease",
        opacity: isLoading ? 0.7 : 1,
        ...style,
      }}
      {...restProps}
    >
      {isLoading ? "Memproses..." : children}
    </button>
  );
};

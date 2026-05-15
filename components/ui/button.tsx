import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "ghost" | "peligro";
  tamaño?: "sm" | "md" | "lg" | "xl";
  cargando?: boolean;
  icono?: React.ReactNode;
  ancho_completo?: boolean;
}

export function Button({
  children,
  variante = "primario",
  tamaño = "md",
  cargando = false,
  icono,
  ancho_completo = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-outfit font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantes = {
    primario:
      "bg-coral text-white hover:bg-coral-light focus:ring-coral shadow-md hover:shadow-lg active:scale-[0.98]",
    secundario:
      "border-2 border-navy text-navy hover:bg-navy hover:text-white focus:ring-navy",
    ghost:
      "text-navy hover:bg-navy/5 focus:ring-navy/20",
    peligro:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const tamaños = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-btn",
    lg: "px-6 py-3 text-base rounded-btn",
    xl: "px-8 py-4 text-lg rounded-btn",
  };

  return (
    <button
      className={`${base} ${variantes[variante]} ${tamaños[tamaño]} ${
        ancho_completo ? "w-full" : ""
      } ${className}`}
      disabled={disabled || cargando}
      {...props}
    >
      {cargando ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icono ? (
        <span className="w-5 h-5 flex items-center justify-center">{icono}</span>
      ) : null}
      {children}
    </button>
  );
}

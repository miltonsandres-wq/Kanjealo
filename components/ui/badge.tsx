import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variante?: "navy" | "coral" | "verde" | "gris" | "amarillo";
  tamaño?: "sm" | "md";
}

export function Badge({
  children,
  variante = "navy",
  tamaño = "sm",
}: BadgeProps) {
  const variantes = {
    navy: "bg-navy text-white",
    coral: "bg-coral text-white",
    verde: "bg-emerald-500 text-white",
    gris: "bg-gray-100 text-navy/60",
    amarillo: "bg-amber-100 text-amber-800",
  };

  const tamaños = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-outfit font-medium rounded-full ${variantes[variante]} ${tamaños[tamaño]}`}
    >
      {children}
    </span>
  );
}

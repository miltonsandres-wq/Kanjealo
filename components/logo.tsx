import React from "react";

interface LogoProps {
  variante?: "completo" | "icono" | "blanco";
  tamaño?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function KanjealoLogo({
  variante = "completo",
  tamaño = "md",
  className = "",
}: LogoProps) {
  const tamaños = {
    sm: { icono: 28, texto: "text-lg", gap: "gap-2" },
    md: { icono: 36, texto: "text-xl", gap: "gap-2.5" },
    lg: { icono: 44, texto: "text-2xl", gap: "gap-3" },
    xl: { icono: 56, texto: "text-3xl", gap: "gap-3.5" },
  };

  const t = tamaños[tamaño];

  const Icono = () => (
    <div
      className="relative flex items-center justify-center bg-coral shrink-0"
      style={{
        width: t.icono,
        height: t.icono,
        borderRadius: "44%",
      }}
    >
      {/* Wallet SVG */}
      <svg
        width={t.icono * 0.5}
        height={t.icono * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M16 10h.01" />
        <path d="M2 10h20" />
      </svg>
      {/* NFC Waves */}
      <svg
        className="absolute -top-1 -right-1"
        width={t.icono * 0.35}
        height={t.icono * 0.35}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M8 12C10.21 12 12 10.21 12 8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M8 16C12.42 16 16 12.42 16 8"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    </div>
  );

  if (variante === "icono") {
    return (
      <div className={className}>
        <Icono />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${t.gap} ${className}`}>
      <Icono />
      <span className={`${t.texto} font-outfit tracking-tight`}>
        <span
          className={`font-extrabold ${
            variante === "blanco" ? "text-white" : "text-navy"
          }`}
        >
          Kanje
        </span>
        <span className="font-medium text-coral">alo</span>
      </span>
    </div>
  );
}

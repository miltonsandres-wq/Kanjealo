"use client";

import React from "react";

interface StampGridProps {
  sellosActuales: number;
  sellosRequeridos: number;
  colorMarca?: string;
  tamaño?: "sm" | "md" | "lg";
}

export function StampGrid({
  sellosActuales,
  sellosRequeridos,
  colorMarca = "#FF5C3A",
  tamaño = "md",
}: StampGridProps) {
  const tamañoCirculo = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const tamañoIcono = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: sellosRequeridos }).map((_, i) => {
        const estaSellado = i < sellosActuales;
        return (
          <div
            key={i}
            className={`${tamañoCirculo[tamaño]} rounded-full flex items-center justify-center transition-all duration-300 ${
              estaSellado
                ? "shadow-md"
                : "border-2 border-dashed border-navy/15"
            } ${estaSellado ? "animate-stamp" : ""}`}
            style={{
              backgroundColor: estaSellado ? colorMarca : "transparent",
              animationDelay: estaSellado ? `${i * 50}ms` : undefined,
            }}
          >
            {estaSellado ? (
              <svg
                width={tamañoIcono[tamaño]}
                height={tamañoIcono[tamaño]}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <span className="text-navy/15 text-xs font-mono">
                {i + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

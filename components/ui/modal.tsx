"use client";

import React, { useEffect, useRef } from "react";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
  ancho?: "sm" | "md" | "lg";
}

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = "md",
}: ModalProps) {
  const refOverlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    if (abierto) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const anchos = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div
      ref={refOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === refOverlay.current) onCerrar();
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-navy/60 glass" />

      {/* Content */}
      <div
        className={`relative w-full ${anchos[ancho]} bg-white rounded-card shadow-xl animate-scale-in`}
      >
        {/* Header */}
        {titulo && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-outfit font-bold text-navy">
              {titulo}
            </h3>
            <button
              onClick={onCerrar}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-navy/40"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

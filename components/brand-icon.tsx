import React from "react";

interface BrandIconProps {
  tamaño?: number;
  className?: string;
}

export function BrandIcon({ tamaño = 48, className = "" }: BrandIconProps) {
  return (
    <div
      className={`relative flex items-center justify-center bg-coral ${className}`}
      style={{
        width: tamaño,
        height: tamaño,
        borderRadius: "44%",
      }}
    >
      <svg
        width={tamaño * 0.5}
        height={tamaño * 0.5}
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
        className="absolute -top-0.5 -right-0.5"
        width={tamaño * 0.3}
        height={tamaño * 0.3}
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
}

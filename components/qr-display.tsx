"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRDisplayProps {
  url: string;
  tamaño?: number;
  colorFondo?: string;
  colorFrente?: string;
}

export function QRDisplay({
  url,
  tamaño = 256,
  colorFondo = "#FFFFFF",
  colorFrente = "#0F2044",
}: QRDisplayProps) {
  const descargarQR = () => {
    const svg = document.querySelector("#qr-kanjealo svg") as SVGElement;
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = tamaño * 2;
    canvas.height = tamaño * 2;

    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = colorFondo;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const link = document.createElement("a");
      link.download = "kanjealo-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(data);
  };

  const imprimirQR = () => {
    const contenido = document.querySelector("#qr-kanjealo")?.innerHTML;
    if (!contenido) return;

    const ventana = window.open("", "_blank");
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head><title>QR Kanjealo</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            ${contenido}
            <p style="font-family:sans-serif;color:#0F2044;margin-top:16px;">${url}</p>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        id="qr-kanjealo"
        className="p-6 bg-white rounded-2xl shadow-card"
      >
        <QRCodeSVG
          value={url}
          size={tamaño}
          bgColor={colorFondo}
          fgColor={colorFrente}
          level="H"
          includeMargin={false}
        />
      </div>

      <p className="text-sm text-navy/50 font-mono">{url}</p>

      <div className="flex gap-3">
        <button
          onClick={descargarQR}
          className="px-4 py-2 bg-coral text-white text-sm font-outfit font-semibold rounded-btn
            hover:bg-coral-light transition-colors flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar PNG
        </button>

        <button
          onClick={imprimirQR}
          className="px-4 py-2 border-2 border-navy text-navy text-sm font-outfit font-semibold rounded-btn
            hover:bg-navy hover:text-white transition-colors flex items-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimir
        </button>
      </div>
    </div>
  );
}

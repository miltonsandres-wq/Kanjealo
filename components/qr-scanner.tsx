"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, FlipHorizontal } from "lucide-react";

interface QrScannerProps {
  onResult: (text: string) => void;
  onClose: () => void;
  color?: string;
}

export function QrScanner({ onResult, onClose, color = "#FF5C3A" }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [camaraFrontal, setCamaraFrontal] = useState(false);
  const scannerRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const iniciarScanner = async (frontal: boolean) => {
    // Detener escáner previo si existe
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: frontal ? "user" : "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (text: string) => {
          if (mountedRef.current) onResult(text);
        },
        undefined
      );
    } catch (err: any) {
      if (mountedRef.current) {
        setError(
          err?.message?.includes("Permission")
            ? "Permiso de cámara denegado. Permite el acceso en tu navegador."
            : "No se pudo acceder a la cámara."
        );
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    iniciarScanner(false);

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const cambiarCamara = async () => {
    const nueva = !camaraFrontal;
    setCamaraFrontal(nueva);
    await iniciarScanner(nueva);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-navy rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-coral" />
            <span className="font-bold text-white text-sm">Escanear tarjeta del cliente</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor */}
        <div className="relative bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <Camera className="w-10 h-10 text-white/20" />
              <p className="text-white/60 text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Contenedor del escáner - html5-qrcode monta aquí */}
              <div id="qr-reader-container" className="w-full" />

              {/* Marco guía */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 relative">
                  {/* Esquinas */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 rounded-tl-lg" style={{ borderColor: color, borderWidth: "3px" }} />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 rounded-tr-lg" style={{ borderColor: color, borderWidth: "3px", borderLeft: "none", borderBottom: "none" }} />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 rounded-bl-lg" style={{ borderColor: color, borderWidth: "3px", borderTop: "none", borderRight: "none" }} />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 rounded-br-lg" style={{ borderColor: color, borderWidth: "3px", borderTop: "none", borderLeft: "none" }} />

                  {/* Línea animada */}
                  <div className="absolute inset-x-2 h-0.5 animate-scan" style={{ backgroundColor: color }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-white/40 text-xs text-center">
            Apunta la cámara al código QR de la tarjeta del cliente
          </p>
          {!error && (
            <button
              onClick={cambiarCamara}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-white/70 text-sm font-medium"
            >
              <FlipHorizontal className="w-4 h-4" />
              {camaraFrontal ? "Cámara trasera" : "Cámara frontal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Utilidad: parsear el texto del QR y extraer telefono o client_id
export function parsearQr(texto: string): { telefono?: string; clientId?: string } {
  const t = texto.trim();

  // Formato Kanjealo explícito: "kj:phone:98444382" o "kj:id:uuid"
  if (t.startsWith("kj:phone:")) return { telefono: t.replace("kj:phone:", "") };
  if (t.startsWith("kj:id:"))    return { clientId: t.replace("kj:id:", "") };

  // Solo dígitos → teléfono
  if (/^\d{7,12}$/.test(t)) return { telefono: t };

  // JSON: {"telefono":"...", "id":"..."}
  try {
    const obj = JSON.parse(t);
    if (obj.telefono) return { telefono: obj.telefono };
    if (obj.id)       return { clientId: obj.id };
  } catch {}

  // URL con parámetros
  try {
    const url = new URL(t);
    const tel = url.searchParams.get("telefono") ?? url.searchParams.get("phone");
    const id  = url.searchParams.get("client")   ?? url.searchParams.get("id");
    if (tel) return { telefono: tel };
    if (id)  return { clientId: id };
  } catch {}

  return {};
}

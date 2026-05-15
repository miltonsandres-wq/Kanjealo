"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { KanjealoLogo } from "@/components/logo";
import { PinKeypad } from "@/components/pin-keypad";
import { Store, Lock } from "lucide-react";

export default function CajeroLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [negocioNombre, setNegocioNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar nombre del negocio para mostrar en pantalla
  useEffect(() => {
    fetch(`/api/cajero/login?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => { if (d.nombre) setNegocioNombre(d.nombre); })
      .catch(() => {});
  }, [slug]);

  const handlePinComplete = async (pin: string) => {
    setCargando(true);
    setError(null);

    try {
      const res = await fetch("/api/cajero/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "PIN incorrecto");
        setCargando(false);
        return;
      }

      // Guardar sesión en sessionStorage
      sessionStorage.setItem("cajero_session", JSON.stringify({
        cajeroId: data.cajero.id,
        cajeroNombre: data.cajero.nombre,
        businessId: data.negocio.id,
        businessNombre: data.negocio.nombre,
        businessSlug: data.negocio.slug,
        sellosRequeridos: data.negocio.sellos_requeridos,
        colorMarca: data.negocio.color_marca,
        model: data.model,
        loyalty: data.loyalty,
      }));

      router.push(`/cajero/${slug}/panel`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12 text-center">
        {/* Logo */}
        <div className="space-y-6">
          <KanjealoLogo tamaño="lg" variante="blanco" className="mx-auto" />
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Store className="w-4 h-4 text-coral" />
            <span className="text-sm font-bold text-white/70">
              {negocioNombre || slug}
            </span>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-white/40 mb-2">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Acceso de Cajero</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Ingresa tu PIN</h1>
          <p className="text-white/40 text-sm">Digita tus 4 números de seguridad para entrar.</p>
        </div>

        {/* Keypad */}
        <div className="flex flex-col items-center">
          <PinKeypad
            onComplete={handlePinComplete}
            cargando={cargando}
            error={error}
          />
        </div>

        <p className="text-[10px] text-white/20 font-medium">
          Sistema de Fidelización Kanjealo &copy; 2026
        </p>
      </div>
    </div>
  );
}

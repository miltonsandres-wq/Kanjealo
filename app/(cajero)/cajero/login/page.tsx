"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KanjealoLogo } from "@/components/logo";
import { PinKeypad } from "@/components/pin-keypad";
import { Badge } from "@/components/ui/badge";
import { Store, Lock } from "lucide-react";

export default function CajeroLoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handlePinComplete = (pinFinal: string) => {
    // PIN de prueba: 1234
    if (pinFinal === "1234") {
      router.push("/cajero");
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12 text-center">
        {/* Logo y Tienda */}
        <div className="space-y-6">
          <KanjealoLogo tamaño="lg" variante="blanco" className="mx-auto" />
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Store className="w-4 h-4 text-coral" />
            <span className="text-sm font-bold text-white/70">Sucursal: Principal</span>
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
            error={error ? "PIN incorrecto. Intenta de nuevo." : null}
          />
          
          {error && (
            <p className="mt-4 text-coral text-sm font-bold animate-bounce">
              PIN incorrecto. Intenta de nuevo.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-[10px] text-white/20 font-medium">
          Sistema de Fidelización Kanjealo &copy; 2026
        </p>
      </div>
    </div>
  );
}

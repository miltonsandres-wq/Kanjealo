"use client";

import React, { useState, useCallback } from "react";

interface PinKeypadProps {
  onComplete: (pin: string) => void;
  longitud?: number;
  cargando?: boolean;
  error?: string | null;
}

export function PinKeypad({
  onComplete,
  longitud = 4,
  cargando = false,
  error = null,
}: PinKeypadProps) {
  const [pin, setPin] = useState("");

  const agregarDigito = useCallback(
    (digito: string) => {
      if (pin.length >= longitud || cargando) return;
      const nuevoPin = pin + digito;
      setPin(nuevoPin);
      if (nuevoPin.length === longitud) {
        onComplete(nuevoPin);
      }
    },
    [pin, longitud, cargando, onComplete]
  );

  const borrarDigito = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const limpiar = useCallback(() => {
    setPin("");
  }, []);

  const teclas = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["clear", "0", "delete"],
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Indicadores de PIN */}
      <div className="flex gap-4">
        {Array.from({ length: longitud }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length
                ? "bg-coral scale-110"
                : "bg-white/20 border border-white/30"
            } ${error && pin.length === longitud ? "bg-red-500 animate-shake" : ""}`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm font-outfit animate-slide-down">
          {error}
        </p>
      )}

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {teclas.flat().map((tecla) => {
          if (tecla === "clear") {
            return (
              <button
                key="clear"
                onClick={limpiar}
                disabled={cargando}
                className="h-16 rounded-2xl text-white/40 text-sm font-outfit
                  hover:bg-white/5 active:bg-white/10 transition-all duration-150
                  disabled:opacity-30"
              >
                Borrar
              </button>
            );
          }
          if (tecla === "delete") {
            return (
              <button
                key="delete"
                onClick={borrarDigito}
                disabled={cargando}
                className="h-16 rounded-2xl text-white flex items-center justify-center
                  hover:bg-white/5 active:bg-white/10 transition-all duration-150
                  disabled:opacity-30"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            );
          }
          return (
            <button
              key={tecla}
              onClick={() => agregarDigito(tecla)}
              disabled={cargando}
              className="h-16 rounded-2xl bg-white/10 text-white text-2xl font-outfit font-medium
                hover:bg-white/15 active:bg-white/20 active:scale-95
                transition-all duration-150 disabled:opacity-30"
            >
              {tecla}
            </button>
          );
        })}
      </div>
    </div>
  );
}

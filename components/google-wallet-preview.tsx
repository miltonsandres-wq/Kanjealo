"use client";

import React from "react";
import {
  type WalletCardConfig,
  SelloIcono,
  getCardBackground,
} from "./wallet-preview";

function qrCell(row: number, col: number): boolean {
  if (row <= 6 && col <= 6) {
    if (row === 0 || row === 6 || col === 0 || col === 6) return true;
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
    return false;
  }
  if (row <= 6 && col >= 8) {
    const c = col - 8;
    if (row === 0 || row === 6 || c === 0 || c === 4) return true;
    if (row >= 2 && row <= 4 && c >= 1 && c <= 3) return true;
    return false;
  }
  if (row === 6 || col === 6) return (row + col) % 2 === 0;
  return ((row * 13 + col * 7 + row * col) % 11) < 5;
}

const QR_SIZE = 13;

export function GoogleWalletPreview({
  nombrePrograma,
  colorMarca = '#FF5C3A',
  sellosActuales = 4,
  sellosRequeridos = 10,
  descripcionPremio = 'Premio al completar',
  logoUrl,
  iconoSello = 'star',
  gradiente = 'none',
  nombreNegocio = 'Mi Negocio',
  model = 'stamps',
  cashbackBalance = 0,
  puntosBalance = 0,
  tierNombre = 'Bronce',
}: WalletCardConfig) {
  const heroStyle = getCardBackground(colorMarca, gradiente);

  return (
    <div className="w-full max-w-[290px] mx-auto select-none">
      <div className="bg-[#1A1A1A] rounded-[32px] p-[10px] shadow-2xl ring-1 ring-white/5">
        <div className="bg-white rounded-[24px] overflow-hidden">
          {/* Android Status Bar */}
          <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5 bg-white">
            <span className="text-[11px] font-semibold text-gray-800">9:41</span>
            <div className="w-[10px] h-[10px] bg-[#1A1A1A] rounded-full" />
            <div className="flex items-center gap-1.5">
              <svg width="12" height="10" viewBox="0 0 12 10" fill="#333" opacity="0.7">
                <rect x="0" y="3" width="2" height="7" rx="0.5"/>
                <rect x="3" y="2" width="2" height="8" rx="0.5"/>
                <rect x="6" y="1" width="2" height="9" rx="0.5"/>
                <rect x="9" y="0" width="2" height="10" rx="0.5" opacity="0.3"/>
              </svg>
              <div className="w-[16px] h-[8px] border border-gray-500 rounded-[2px] p-[1px]">
                <div className="w-4/5 h-full bg-gray-700 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Google Wallet App Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: 'conic-gradient(#4285F4 0% 25%, #34A853 25% 50%, #FBBC04 50% 75%, #EA4335 75% 100%)' }}>
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
              <span className="text-[13px] font-semibold text-gray-800">Google Wallet</span>
            </div>
            <div className="flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-[5px] h-[5px] bg-gray-300 rounded-full" />)}
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="mx-3.5 my-3.5 rounded-[16px] overflow-hidden shadow-md border border-gray-100">
            {/* Hero strip */}
            <div className="px-4 py-3.5 flex items-center justify-between" style={heroStyle}>
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-[10px] object-cover bg-white/20" />
                ) : (
                  <div className="w-9 h-9 rounded-[10px] bg-white/25 flex items-center justify-center text-[18px]">☕</div>
                )}
                <div>
                  <p className="text-white font-bold text-[13px] leading-tight">{nombreNegocio || nombrePrograma}</p>
                  <p className="text-white/60 text-[10px]">{nombrePrograma}</p>
                </div>
              </div>
              <div className="px-2 py-0.5 bg-white/20 rounded-full">
                <span className="text-white text-[8px] font-bold tracking-wider">LEALTAD</span>
              </div>
            </div>

            {/* Card body — model-aware */}
            <div className="bg-white px-4 py-3.5 space-y-3.5">

              {model === 'stamps' && (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Sellos</p>
                      <p className="text-[24px] font-bold text-gray-900 leading-none">
                        {sellosActuales}
                        <span className="text-[14px] text-gray-400 font-medium ml-1">/ {sellosRequeridos}</span>
                      </p>
                    </div>
                    {sellosActuales >= sellosRequeridos && (
                      <div className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: colorMarca }}>
                        ¡LISTO!
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-[6px]">
                    {Array.from({ length: sellosRequeridos }).map((_, i) => {
                      const sellado = i < sellosActuales;
                      return (
                        <div key={i} className="w-[24px] h-[24px] rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: sellado ? colorMarca : 'transparent',
                            border: sellado ? 'none' : `1.5px solid ${colorMarca}40`,
                          }}
                        >
                          {sellado
                            ? <SelloIcono icono={iconoSello} tamaño={12} color="white" />
                            : <span className="text-[7px] font-bold" style={{ color: `${colorMarca}60` }}>{i + 1}</span>
                          }
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Premio</p>
                    <p className="text-[12px] text-gray-800 font-medium">{descripcionPremio}</p>
                  </div>
                </>
              )}

              {model === 'cashback' && (
                <div className="py-2 space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Saldo Cashback</p>
                  <p className="text-[28px] font-extrabold leading-none" style={{ color: colorMarca }}>
                    L. {cashbackBalance.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-gray-400">Disponible para canjear</p>
                </div>
              )}

              {(model === 'points' || model === 'tiers' || model === 'mixed') && (
                <div className="py-2 space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Puntos acumulados</p>
                  <p className="text-[28px] font-extrabold leading-none" style={{ color: colorMarca }}>
                    {puntosBalance.toLocaleString()}
                    <span className="text-[14px] font-medium text-gray-400 ml-1">pts</span>
                  </p>
                  {(model === 'tiers' || model === 'mixed') && (
                    <p className="text-[11px] text-gray-500 font-medium">Nivel: {tierNombre}</p>
                  )}
                </div>
              )}

              {model === 'referrals' && (
                <div className="py-2 space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Programa de Referidos</p>
                  <p className="text-[14px] font-bold text-gray-800 mt-1">Comparte y gana puntos</p>
                  <p className="text-[11px] text-gray-400">por cada amigo que refieras</p>
                </div>
              )}

              {/* QR Code */}
              <div className="pt-2 border-t border-gray-100 flex flex-col items-center gap-1.5">
                <div className="p-1.5 bg-white border border-gray-100 rounded-lg"
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)`, gap: 1.5, width: 72, height: 72 }}
                >
                  {Array.from({ length: QR_SIZE }).flatMap((_, r) =>
                    Array.from({ length: QR_SIZE }).map((_, c) => (
                      <div key={`${r}-${c}`} className="rounded-[1px]"
                        style={{ backgroundColor: qrCell(r, c) ? '#1C1C1E' : 'transparent' }} />
                    ))
                  )}
                </div>
                <p className="text-[8px] text-gray-400 font-mono">KANJ-2026-0001</p>
              </div>
            </div>
          </div>

          {/* Android Nav Bar */}
          <div className="flex items-center justify-around px-8 py-2.5 border-t border-gray-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="1.8" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <div className="w-11 h-[4px] bg-gray-200 rounded-full" />
            <div className="w-[15px] h-[15px] border-[1.8px] border-gray-400 rounded-[3px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

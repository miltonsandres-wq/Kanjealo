"use client";

import React from "react";

export type IconoSello = 'star' | 'check' | 'heart' | 'bolt' | 'diamond' | 'crown' | 'fire';
export type GradienteCard = 'none' | 'warm' | 'dark' | 'ocean' | 'sunset';

export const ICON_PATHS: Record<IconoSello, { fill: boolean; path: string; label: string }> = {
  star:    { fill: true,  label: 'Estrella', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  check:   { fill: false, label: 'Check',    path: 'M20 6L9 17l-5-5' },
  heart:   { fill: true,  label: 'Corazón',  path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  bolt:    { fill: true,  label: 'Rayo',     path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  diamond: { fill: true,  label: 'Diamante', path: 'M12 2l10 10-10 10L2 12 12 2z' },
  crown:   { fill: false, label: 'Corona',   path: 'M2 20h20M5 20l2-8 5 4 5-4 2 8' },
  fire:    { fill: false, label: 'Fuego',    path: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' },
};

export function getCardBackground(color: string, gradiente: GradienteCard): React.CSSProperties {
  switch (gradiente) {
    case 'warm':   return { background: `linear-gradient(135deg, ${color} 0%, #FF9C6B 100%)` };
    case 'dark':   return { background: `linear-gradient(135deg, ${color} 0%, #0a1628 100%)` };
    case 'ocean':  return { background: `linear-gradient(135deg, #0F2044 0%, ${color} 100%)` };
    case 'sunset': return { background: 'linear-gradient(135deg, #FF5C3A 0%, #FF8042 55%, #FFBE8A 100%)' };
    default:       return { backgroundColor: color };
  }
}

export function SelloIcono({
  icono,
  tamaño = 10,
  color = 'white',
}: {
  icono: IconoSello;
  tamaño?: number;
  color?: string;
}) {
  const def = ICON_PATHS[icono];
  return (
    <svg
      width={tamaño}
      height={tamaño}
      viewBox="0 0 24 24"
      fill={def.fill ? color : 'none'}
      stroke={def.fill ? 'none' : color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={def.path} />
    </svg>
  );
}

export type LoyaltyModel = 'stamps' | 'cashback' | 'points' | 'tiers' | 'referrals' | 'mixed';

export interface WalletCardConfig {
  nombrePrograma: string;
  colorMarca: string;
  sellosActuales?: number;
  sellosRequeridos?: number;
  descripcionPremio?: string;
  logoUrl?: string | null;
  iconoSello?: IconoSello;
  gradiente?: GradienteCard;
  nombreNegocio?: string;
  model?: LoyaltyModel;
  cashbackBalance?: number;
  puntosBalance?: number;
  tierNombre?: string;
}

export function WalletPreview({
  nombrePrograma,
  colorMarca = '#FF5C3A',
  sellosActuales = 4,
  sellosRequeridos = 10,
  descripcionPremio = 'Premio al completar',
  logoUrl,
  iconoSello = 'star',
  gradiente = 'none',
  model = 'stamps',
  cashbackBalance = 0,
  puntosBalance = 0,
  tierNombre = 'Bronce',
}: WalletCardConfig) {
  const cardStyle = getCardBackground(colorMarca, gradiente);

  return (
    <div className="w-full max-w-[290px] mx-auto select-none">
      {/* iPhone frame */}
      <div className="bg-[#1C1C1E] rounded-[44px] p-[10px] shadow-2xl ring-1 ring-white/5">
        {/* Dynamic Island */}
        <div className="flex justify-center mt-0.5 mb-2">
          <div className="w-24 h-[26px] bg-black rounded-full" />
        </div>

        {/* Screen */}
        <div className="bg-[#F2F2F7] rounded-[36px] overflow-hidden">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1.5">
            <span className="text-[12px] font-semibold text-[#1C1C1E]">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="12" viewBox="0 0 16 12" fill="#1C1C1E" opacity="0.6">
                <rect x="0" y="4" width="2.5" height="8" rx="0.8"/>
                <rect x="3.5" y="2.5" width="2.5" height="9.5" rx="0.8"/>
                <rect x="7" y="1" width="2.5" height="11" rx="0.8"/>
                <rect x="10.5" y="0" width="2.5" height="12" rx="0.8" opacity="0.3"/>
              </svg>
              <div className="w-[22px] h-[11px] border-[1.5px] border-[#1C1C1E]/50 rounded-[3px] flex items-center px-[2px]">
                <div className="w-full h-[6px] bg-[#1C1C1E] rounded-[1.5px]" />
              </div>
            </div>
          </div>

          {/* Wallet Header */}
          <div className="flex items-center justify-between px-5 py-1.5">
            <div className="flex items-center gap-1.5 text-[#007AFF] text-[14px] font-medium">
              <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
                <path d="M7 1L1 6.5L7 12" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Wallet
            </div>
            <span className="text-[13px] font-semibold text-[#1C1C1E]">Lealtad</span>
          </div>

          {/* Loyalty Card */}
          <div className="mx-4 mb-4 rounded-[20px] overflow-hidden shadow-xl" style={cardStyle}>
            {/* Card Header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-[10px] object-cover bg-white/20" />
                ) : (
                  <div className="w-9 h-9 rounded-[10px] bg-white/25 flex items-center justify-center text-[18px]">
                    ☕
                  </div>
                )}
                <div>
                  <p className="text-white font-bold text-[12px] leading-tight">{nombrePrograma}</p>
                  <p className="text-white/50 text-[9px] mt-0.5">Tarjeta de Fidelización</p>
                </div>
              </div>
              {/* NFC waves */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1" fill="rgba(255,255,255,0.35)" stroke="none" />
              </svg>
            </div>

            {/* Middle section — model-aware */}
            <div className="px-4 py-3 bg-black/[0.12]">
              {(model === 'stamps') && (
                <>
                  <div className="flex flex-wrap gap-[7px]">
                    {Array.from({ length: sellosRequeridos }).map((_, i) => {
                      const sellado = i < sellosActuales;
                      return (
                        <div
                          key={i}
                          className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: sellado ? 'rgba(255,255,255,0.95)' : 'transparent',
                            border: sellado ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                          }}
                        >
                          {sellado ? (
                            <SelloIcono icono={iconoSello} tamaño={13} color={colorMarca} />
                          ) : (
                            <span className="text-[8px] text-white/25 font-bold font-mono">{i + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-white/40 text-[10px] mt-2">
                    {sellosActuales} de {sellosRequeridos} sellos completados
                  </p>
                </>
              )}

              {model === 'cashback' && (
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-bold">Saldo Cashback</p>
                  <p className="text-white text-[22px] font-extrabold leading-tight">
                    L. {cashbackBalance.toFixed(2)}
                  </p>
                  <p className="text-white/40 text-[10px]">Disponible para canjear</p>
                </div>
              )}

              {(model === 'points' || model === 'tiers' || model === 'mixed') && (
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-bold">Puntos acumulados</p>
                  <p className="text-white text-[22px] font-extrabold leading-tight">
                    {puntosBalance.toLocaleString()} pts
                  </p>
                  {(model === 'tiers' || model === 'mixed') && (
                    <p className="text-white/50 text-[10px]">Nivel: {tierNombre}</p>
                  )}
                </div>
              )}

              {model === 'referrals' && (
                <div className="space-y-1">
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-bold">Programa de Referidos</p>
                  <p className="text-white text-[13px] font-semibold leading-tight mt-1">
                    Comparte y gana puntos
                  </p>
                  <p className="text-white/40 text-[10px]">por cada amigo que refieras</p>
                </div>
              )}
            </div>

            {/* Prize — only for stamps */}
            {model === 'stamps' && (
            <div className="px-4 py-3 flex items-start justify-between">
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-bold">Premio</p>
                <p className="text-white text-[12px] font-medium mt-0.5">{descripcionPremio}</p>
              </div>
              {sellosActuales >= sellosRequeridos && (
                <div className="bg-white/20 px-2 py-1 rounded-full">
                  <span className="text-white text-[9px] font-bold">¡CANJEAR!</span>
                </div>
              )}
            </div>
            )}

            {/* Barcode */}
            <div className="px-4 pb-4">
              <div className="bg-white rounded-[10px] py-2.5 px-3 flex flex-col items-center gap-1">
                <div className="flex gap-[1.5px] h-[28px] items-stretch">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-900 rounded-[0.5px]"
                      style={{ width: i % 3 === 0 || i % 7 === 0 ? 2.5 : 1 }}
                    />
                  ))}
                </div>
                <span className="text-[8px] text-gray-400 font-mono tracking-widest">KANJ-2026-0001</span>
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="flex justify-center pb-4">
            <div className="w-[100px] h-[4px] bg-[#1C1C1E]/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

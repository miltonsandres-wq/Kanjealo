"use client";

import React, { useState } from "react";
import { Palette, Star, Settings2, Save, Undo2, Smartphone, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  WalletPreview,
  type IconoSello,
  type GradienteCard,
  ICON_PATHS,
  SelloIcono,
  getCardBackground,
} from "@/components/wallet-preview";
import { GoogleWalletPreview } from "@/components/google-wallet-preview";
import { useNegocio, useLoyaltyConfig } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";

// ── Constantes de diseño ─────────────────────────────────────

const COLORES_PRESET = [
  { hex: '#FF5C3A', label: 'Coral' },
  { hex: '#0F2044', label: 'Navy' },
  { hex: '#22C55E', label: 'Verde' },
  { hex: '#8B5CF6', label: 'Violeta' },
  { hex: '#EC4899', label: 'Rosa' },
  { hex: '#06B6D4', label: 'Cian' },
  { hex: '#F97316', label: 'Naranja' },
  { hex: '#6366F1', label: 'Índigo' },
];

const GRADIENTES: { id: GradienteCard; label: string }[] = [
  { id: 'none',   label: 'Sólido' },
  { id: 'warm',   label: 'Cálido' },
  { id: 'dark',   label: 'Profundo' },
  { id: 'ocean',  label: 'Océano' },
  { id: 'sunset', label: 'Atardecer' },
];

const ICONOS_SELLO = Object.entries(ICON_PATHS).map(([id, def]) => ({
  id: id as IconoSello,
  label: def.label,
}));

type TabEditor = 'tarjeta' | 'sellos' | 'programa';
type VistaWallet = 'apple' | 'google';

// ── Página ───────────────────────────────────────────────────

export default function TarjetaEditorPage() {
  const { negocio, cargando: cargandoNegocio, refetch } = useNegocio();
  const { config, cargando: cargandoConfig } = useLoyaltyConfig(negocio?.id);
  const model = config?.model ?? "stamps";

  // Config del programa
  const [nombrePrograma, setNombrePrograma] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [descripcionPremio, setDescripcionPremio] = useState("");
  const [sellosRequeridos, setSellosRequeridos] = useState(10);

  // Config visual
  const [colorMarca, setColorMarca] = useState("#FF5C3A");
  const [gradiente, setGradiente] = useState<GradienteCard>('none');

  // Config de sellos
  const [iconoSello, setIconoSello] = useState<IconoSello>('star');

  // UI state
  const [tabActivo, setTabActivo] = useState<TabEditor>('tarjeta');
  const [vistaWallet, setVistaWallet] = useState<VistaWallet>('apple');
  const [cargando, setCargando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Inicializar con datos reales del negocio
  React.useEffect(() => {
    if (!negocio) return;
    setNombrePrograma(negocio.nombre_programa);
    setNombreNegocio(negocio.nombre);
    setDescripcionPremio(negocio.descripcion_premio);
    setSellosRequeridos(negocio.sellos_requeridos);
    setColorMarca(negocio.color_marca);
  }, [negocio]);

  const cardConfig = {
    nombrePrograma,
    nombreNegocio,
    colorMarca,
    sellosActuales: 4,
    sellosRequeridos,
    descripcionPremio,
    iconoSello,
    gradiente,
    model,
  };

  const guardarCambios = async () => {
    if (!negocio) return;
    setCargando(true);
    await supabase
      .from("negocios")
      .update({
        nombre_programa: nombrePrograma,
        nombre: nombreNegocio,
        descripcion_premio: descripcionPremio,
        sellos_requeridos: sellosRequeridos,
        color_marca: colorMarca,
      })
      .eq("id", negocio.id);

    await refetch();
    setCargando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  if (cargandoNegocio || cargandoConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: TabEditor; label: string; icon: React.ReactNode }[] = [
    { id: 'tarjeta', label: 'Tarjeta', icon: <Palette className="w-4 h-4" /> },
    ...(model === 'stamps' ? [
      { id: 'sellos' as TabEditor,  label: 'Sellos',  icon: <Star className="w-4 h-4" /> },
      { id: 'programa' as TabEditor, label: 'Programa', icon: <Settings2 className="w-4 h-4" /> },
    ] : [
      { id: 'programa' as TabEditor, label: 'Programa', icon: <Settings2 className="w-4 h-4" /> },
    ]),
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Mi Tarjeta</h1>
          <p className="text-navy/50">Diseña la experiencia de fidelización de tus clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variante="ghost" icono={<Undo2 className="w-4 h-4" />}>
            Restablecer
          </Button>
          <Button
            variante="primario"
            icono={guardado ? undefined : <Save className="w-4 h-4" />}
            cargando={cargando}
            onClick={guardarCambios}
          >
            {guardado ? '¡Guardado!' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

        {/* ── Panel izquierdo: Editor ── */}
        <div className="space-y-6">
          {/* Tabs de sección */}
          <div className="flex bg-cream rounded-2xl p-1.5 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  tabActivo === tab.id
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-navy/40 hover:text-navy'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Tarjeta ── */}
          {tabActivo === 'tarjeta' && (
            <div className="space-y-6">
              <Card className="p-7 border-none shadow-sm bg-white space-y-7">
                {/* Color de fondo */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-navy">Color de la Tarjeta</label>
                  <div className="grid grid-cols-8 gap-2.5">
                    {COLORES_PRESET.map(({ hex, label }) => (
                      <button
                        key={hex}
                        title={label}
                        onClick={() => setColorMarca(hex)}
                        className={`w-9 h-9 rounded-full border-4 transition-all duration-200 ${
                          colorMarca === hex
                            ? 'border-navy/20 scale-110 shadow-lg'
                            : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 overflow-hidden shrink-0">
                      <input
                        type="color"
                        value={colorMarca}
                        onChange={e => setColorMarca(e.target.value)}
                        className="w-10 h-10 -translate-x-1 -translate-y-1 cursor-pointer border-none outline-none"
                      />
                    </div>
                    <Input
                      value={colorMarca}
                      onChange={e => setColorMarca(e.target.value)}
                      className="max-w-[140px] font-mono text-sm"
                      placeholder="#FF5C3A"
                    />
                  </div>
                </div>

                {/* Estilo de fondo / gradiente */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-navy">Estilo de Fondo</label>
                  <div className="grid grid-cols-5 gap-2">
                    {GRADIENTES.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setGradiente(id)}
                        className={`relative flex flex-col items-center gap-2 group`}
                      >
                        <div
                          className={`w-full aspect-[3/2] rounded-xl border-[2.5px] transition-all duration-200 ${
                            gradiente === id
                              ? 'border-navy/30 scale-105 shadow-md'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          style={getCardBackground(colorMarca, id)}
                        />
                        <span className={`text-[10px] font-bold transition-colors ${gradiente === id ? 'text-navy' : 'text-navy/40'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Logo del negocio */}
              <Card className="p-7 border-none shadow-sm bg-white space-y-4">
                <label className="text-sm font-bold text-navy">Logo del Negocio</label>
                <div className="border-2 border-dashed border-navy/10 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-coral/30 transition-colors cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-3xl">
                    ☕
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-navy">Subir logo</p>
                    <p className="text-xs text-navy/40">PNG, JPG — mínimo 200×200 px</p>
                  </div>
                  <Badge variante="navy" tamaño="sm">Próximamente</Badge>
                </div>
              </Card>
            </div>
          )}

          {/* ── Tab: Sellos ── */}
          {tabActivo === 'sellos' && (
            <div className="space-y-6">
              <Card className="p-7 border-none shadow-sm bg-white space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-navy">Ícono del Sello</label>
                  <div className="grid grid-cols-4 gap-3">
                    {ICONOS_SELLO.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setIconoSello(id)}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                          iconoSello === id
                            ? 'border-coral bg-coral/5'
                            : 'border-transparent bg-cream hover:bg-navy/5'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: iconoSello === id ? colorMarca : '#e5e1db' }}
                        >
                          <SelloIcono
                            icono={id}
                            tamaño={20}
                            color={iconoSello === id ? 'white' : '#0F2044'}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${iconoSello === id ? 'text-coral' : 'text-navy/40'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mini preview de sellos */}
                <div className="pt-2">
                  <label className="text-sm font-bold text-navy mb-4 block">Vista previa de sellos</label>
                  <div className="p-5 bg-cream rounded-2xl space-y-3">
                    <p className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">Sellados</p>
                    <div className="flex flex-wrap gap-2.5">
                      {Array.from({ length: Math.min(sellosRequeridos, 10) }).map((_, i) => {
                        const sellado = i < 4;
                        return (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: sellado ? colorMarca : 'transparent',
                              border: sellado ? 'none' : `2px dashed ${colorMarca}40`,
                            }}
                          >
                            {sellado ? (
                              <SelloIcono icono={iconoSello} tamaño={20} color="white" />
                            ) : (
                              <span className="text-[10px] font-bold" style={{ color: `${colorMarca}50` }}>
                                {i + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-navy/40">4 de {sellosRequeridos} sellos completados</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-coral/5 border border-coral/10 flex gap-3">
                <Info className="w-5 h-5 text-coral shrink-0 mt-0.5" />
                <p className="text-[12px] text-navy/70 leading-relaxed">
                  El ícono aparece dentro de cada círculo sellado. Los círculos vacíos muestran el número del sello pendiente.
                </p>
              </Card>
            </div>
          )}

          {/* ── Tab: Programa ── */}
          {tabActivo === 'programa' && (
            <div className="space-y-6">
              <Card className="p-7 border-none shadow-sm bg-white space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    etiqueta="Nombre del Negocio"
                    value={nombreNegocio}
                    onChange={e => setNombreNegocio(e.target.value)}
                    placeholder="Café Mirna"
                  />
                  <Input
                    etiqueta="Nombre del Programa"
                    value={nombrePrograma}
                    onChange={e => setNombrePrograma(e.target.value)}
                    placeholder="Café Mirna - Lealtad"
                    ayuda="Este nombre aparece en la tarjeta del cliente."
                  />
                  {model === 'stamps' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-navy">Sellos para completar la tarjeta</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={5} max={20} step={1}
                            value={sellosRequeridos}
                            onChange={e => setSellosRequeridos(parseInt(e.target.value))}
                            className="flex-grow accent-coral h-2 rounded-full"
                          />
                          <div className="w-14 h-11 bg-cream rounded-xl flex items-center justify-center font-bold text-navy text-xl shrink-0">
                            {sellosRequeridos}
                          </div>
                        </div>
                        <p className="text-xs text-navy/40">Recomendamos entre 8 y 12 sellos.</p>
                      </div>
                      <Input
                        etiqueta="Descripción del Premio"
                        value={descripcionPremio}
                        onChange={e => setDescripcionPremio(e.target.value)}
                        placeholder="Un café gratis de cualquier tamaño"
                        ayuda="El cliente lo ve en su tarjeta del Wallet."
                      />
                    </>
                  )}
                </div>
              </Card>

              <Card className="p-5 bg-cream border border-navy/10 flex items-center gap-3">
                <div className="text-xl">
                  {model === 'stamps' ? '🎯' : model === 'cashback' ? '💰' : model === 'points' ? '⭐' : model === 'tiers' ? '🏆' : model === 'referrals' ? '👥' : '🔥'}
                </div>
                <div>
                  <p className="text-sm font-bold text-navy capitalize">
                    Modelo activo: {model === 'stamps' ? 'Sellos' : model === 'cashback' ? 'Cashback' : model === 'points' ? 'Puntos' : model === 'tiers' ? 'Niveles' : model === 'referrals' ? 'Referidos' : 'Mixto'}
                  </p>
                  <p className="text-xs text-navy/40">Cambia el modelo en Configuración → Modelo de Fidelización.</p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* ── Panel derecho: Preview ── */}
        <div className="lg:sticky lg:top-28 space-y-6">
          {/* Toggle Apple / Google */}
          <div className="flex items-center justify-between">
            <Badge variante="navy">VISTA PREVIA EN VIVO</Badge>
            <div className="flex bg-cream rounded-xl p-1 gap-1">
              <button
                onClick={() => setVistaWallet('apple')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vistaWallet === 'apple'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-navy/40 hover:text-navy'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Apple
              </button>
              <button
                onClick={() => setVistaWallet('google')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  vistaWallet === 'google'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-navy/40 hover:text-navy'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064 5.963 5.963 0 0 1 4.123 1.632l2.873-2.874A9.985 9.985 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
                Google
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center transition-all duration-500">
            {vistaWallet === 'apple' ? (
              <WalletPreview {...cardConfig} />
            ) : (
              <GoogleWalletPreview {...cardConfig} />
            )}
          </div>

          {/* Nota wallet */}
          <div className="p-4 bg-cream rounded-2xl text-center space-y-1">
            <p className="text-[11px] font-bold text-navy/60">
              {vistaWallet === 'apple' ? '🍎 Apple Wallet' : '🤖 Google Wallet'}
            </p>
            <p className="text-[11px] text-navy/40">
              La tarjeta real se genera automáticamente con tus configuraciones al activar el plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

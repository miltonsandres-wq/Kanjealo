"use client";

import React, { useState, useEffect } from "react";
import {
  User, Store, CreditCard, ShieldCheck, Users,
  ChevronRight, Plus, Save, ExternalLink, Copy, Check,
  Trash2, KeyRound, Zap, MapPin, Navigation, Pencil, X,
  Wifi, Bell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { useNegocio, useLoyaltyConfig } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import type { LoyaltyModel } from "@/lib/types";
import type { Cajero } from "@/lib/types";

type Seccion = "perfil" | "negocio" | "modelo" | "facturacion" | "seguridad" | "cajeros" | "sucursales";

const SECCIONES = [
  { id: "perfil" as Seccion,      icon: User,        label: "Perfil del Dueño" },
  { id: "negocio" as Seccion,     icon: Store,       label: "Detalles del Negocio" },
  { id: "modelo" as Seccion,      icon: Zap,         label: "Modelo de Fidelización" },
  { id: "sucursales" as Seccion,  icon: MapPin,      label: "Sucursales y Ubicación" },
  { id: "facturacion" as Seccion, icon: CreditCard,  label: "Facturación y Plan" },
  { id: "seguridad" as Seccion,   icon: ShieldCheck, label: "Seguridad" },
  { id: "cajeros" as Seccion,     icon: Users,       label: "Cajeros y Equipo" },
];

interface Sucursal {
  id: string;
  business_id: string;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  mensaje_notificacion: string;
  activa: boolean;
}

const MODELOS: { id: LoyaltyModel; icon: string; label: string; desc: string; pro: boolean }[] = [
  { id: "stamps",   icon: "🎯", label: "Sellos",   desc: "Cada visita = 1 sello hacia un premio",          pro: false },
  { id: "cashback", icon: "💰", label: "Cashback", desc: "% de cada compra se acumula como saldo",          pro: true  },
  { id: "points",   icon: "⭐", label: "Puntos",   desc: "Puntos por lempira gastado, canjea premios",      pro: true  },
  { id: "tiers",    icon: "🏆", label: "Niveles",  desc: "Bronce → Plata → Oro → VIP con beneficios",       pro: true  },
  { id: "referrals",icon: "👥", label: "Referidos","desc": "Gana puntos al recomendar amigos",               pro: true  },
  { id: "mixed",    icon: "🔥", label: "Mixto",    desc: "Puntos + Niveles combinados (máximo engagement)", pro: true  },
];

export default function ConfiguracionPage() {
  const { user } = useUser();
  const { negocio, cargando, refetch } = useNegocio();
  const { config: loyaltyConfig, refetch: refetchLoyalty } = useLoyaltyConfig(negocio?.id);
  const [seccion, setSeccion] = useState<Seccion>("perfil");

  // Loyalty model state
  const [modeloSeleccionado, setModeloSeleccionado] = useState<LoyaltyModel>("stamps");
  const [cashbackPercent, setCashbackPercent] = useState(5);
  const [pointsPerLempira, setPointsPerLempira] = useState(1);
  const [pointsValue, setPointsValue] = useState(0.01);
  const [referralReferrer, setReferralReferrer] = useState(50);
  const [referralNew, setReferralNew] = useState(25);
  const [guardandoModelo, setGuardandoModelo] = useState(false);
  const [guardadoModelo, setGuardadoModelo] = useState(false);

  // Negocio editable
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [slug, setSlug] = useState("");
  const [guardandoNegocio, setGuardandoNegocio] = useState(false);
  const [guardadoNegocio, setGuardadoNegocio] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [modalSucursal, setModalSucursal] = useState<"nueva" | Sucursal | null>(null);
  // Form sucursal
  const [formNombre, setFormNombre] = useState("Sucursal Principal");
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [formDireccion, setFormDireccion] = useState("");
  const [formMensaje, setFormMensaje] = useState("¡Estás cerca! Muéstranos tu tarjeta para ganar tu recompensa.");
  const [detectandoGps, setDetectandoGps] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [guardandoSucursal, setGuardandoSucursal] = useState(false);

  // Cajeros
  const [cajeros, setCajeros] = useState<Cajero[]>([]);
  const [cargandoCajeros, setCargandoCajeros] = useState(false);
  const [nuevoCajeroNombre, setNuevoCajeroNombre] = useState("");
  const [nuevoCajeroPin, setNuevoCajeroPin] = useState("");
  const [agregandoCajero, setAgregandoCajero] = useState(false);
  const [mostrarFormCajero, setMostrarFormCajero] = useState(false);

  // Inicializar campos editables
  useEffect(() => {
    if (!negocio) return;
    setNombreNegocio(negocio.nombre);
    setSlug(negocio.slug);
  }, [negocio]);

  useEffect(() => {
    if (!loyaltyConfig) return;
    setModeloSeleccionado(loyaltyConfig.model ?? "stamps");
    setCashbackPercent(loyaltyConfig.cashback_percent ?? 5);
    setPointsPerLempira(loyaltyConfig.points_per_lempira ?? 1);
    setPointsValue(loyaltyConfig.points_value ?? 0.01);
    setReferralReferrer(loyaltyConfig.referral_reward_referrer ?? 50);
    setReferralNew(loyaltyConfig.referral_reward_new ?? 25);
  }, [loyaltyConfig]);

  // Cargar sucursales cuando se abre esa sección
  useEffect(() => {
    if (seccion !== "sucursales" || !negocio) return;
    setCargandoSucursales(true);
    fetch(`/api/sucursales?business_id=${negocio.id}`)
      .then(r => r.json())
      .then(d => setSucursales(d.sucursales ?? []))
      .finally(() => setCargandoSucursales(false));
  }, [seccion, negocio]);

  // Cargar cajeros cuando se abre esa sección
  useEffect(() => {
    if (seccion !== "cajeros" || !negocio) return;
    setCargandoCajeros(true);
    supabase
      .from("cajeros")
      .select("*")
      .eq("business_id", negocio.id)
      .eq("esta_activo", true)
      .order("created_at")
      .then(({ data }) => {
        setCajeros(data ?? []);
        setCargandoCajeros(false);
      });
  }, [seccion, negocio]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const iniciales = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.firstName?.[0]?.toUpperCase() ?? "?";
  const nombreCompleto = user?.fullName ?? user?.firstName ?? "Usuario";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const abrirModalNueva = () => {
    setFormNombre("Sucursal Principal");
    setFormLat(null); setFormLng(null); setFormDireccion(""); setGpsError("");
    setFormMensaje("¡Estás cerca! Muéstranos tu tarjeta para ganar tu recompensa.");
    setModalSucursal("nueva");
  };

  const abrirModalEditar = (s: Sucursal) => {
    setFormNombre(s.nombre);
    setFormLat(s.latitud); setFormLng(s.longitud);
    setFormDireccion(s.direccion ?? ""); setGpsError("");
    setFormMensaje(s.mensaje_notificacion ?? "");
    setModalSucursal(s);
  };

  const detectarUbicacion = () => {
    if (!navigator.geolocation) { setGpsError("Tu navegador no soporta geolocalización."); return; }
    setDetectandoGps(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setFormLat(lat); setFormLng(lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          setFormDireccion(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setFormDireccion(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setDetectandoGps(false);
      },
      () => { setGpsError("No se pudo obtener la ubicación. Verifica los permisos del navegador."); setDetectandoGps(false); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const guardarSucursal = async () => {
    if (!negocio || !formNombre) return;
    setGuardandoSucursal(true);
    const payload = { nombre: formNombre, latitud: formLat, longitud: formLng, direccion: formDireccion, mensaje_notificacion: formMensaje };
    if (modalSucursal === "nueva") {
      const res = await fetch("/api/sucursales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, business_id: negocio.id }),
      });
      const data = await res.json();
      if (data.sucursal) setSucursales(prev => [...prev, data.sucursal]);
    } else if (modalSucursal && modalSucursal !== "nueva") {
      const res = await fetch("/api/sucursales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: (modalSucursal as Sucursal).id }),
      });
      const data = await res.json();
      if (data.sucursal) setSucursales(prev => prev.map(s => s.id === data.sucursal.id ? data.sucursal : s));
    }
    setGuardandoSucursal(false);
    setModalSucursal(null);
  };

  const eliminarSucursal = async (id: string) => {
    await fetch(`/api/sucursales?id=${id}`, { method: "DELETE" });
    setSucursales(prev => prev.filter(s => s.id !== id));
  };

  const guardarNegocio = async () => {
    if (!negocio) return;
    setGuardandoNegocio(true);
    await supabase
      .from("negocios")
      .update({ nombre: nombreNegocio, slug })
      .eq("id", negocio.id);
    await refetch();
    setGuardandoNegocio(false);
    setGuardadoNegocio(true);
    setTimeout(() => setGuardadoNegocio(false), 2000);
  };

  const guardarModelo = async () => {
    if (!negocio) return;
    setGuardandoModelo(true);
    const payload = {
      business_id: negocio.id,
      model: modeloSeleccionado,
      cashback_percent: cashbackPercent,
      points_per_lempira: pointsPerLempira,
      points_value: pointsValue,
      referral_reward_referrer: referralReferrer,
      referral_reward_new: referralNew,
      updated_at: new Date().toISOString(),
    };
    if (loyaltyConfig) {
      await supabase.from("loyalty_config").update(payload).eq("business_id", negocio.id);
    } else {
      await supabase.from("loyalty_config").insert(payload);
    }
    await refetchLoyalty();
    setGuardandoModelo(false);
    setGuardadoModelo(true);
    setTimeout(() => setGuardadoModelo(false), 2000);
  };

  const copiarUrl = () => {
    navigator.clipboard.writeText(`https://kanjealo.hn/c/${negocio?.slug}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const agregarCajero = async () => {
    if (!negocio || !nuevoCajeroNombre || !nuevoCajeroPin) return;
    setAgregandoCajero(true);
    const { data } = await supabase
      .from("cajeros")
      .insert({
        business_id: negocio.id,
        nombre: nuevoCajeroNombre,
        pin_hash: nuevoCajeroPin,
        esta_activo: true,
      })
      .select()
      .single();
    if (data) setCajeros(prev => [...prev, data]);
    setNuevoCajeroNombre("");
    setNuevoCajeroPin("");
    setMostrarFormCajero(false);
    setAgregandoCajero(false);
  };

  const desactivarCajero = async (id: string) => {
    await supabase.from("cajeros").update({ esta_activo: false }).eq("id", id);
    setCajeros(prev => prev.filter(c => c.id !== id));
  };

  const actualizarPlan = async (plan: "basic" | "pro") => {
    if (!negocio) return;
    await supabase.from("negocios").update({ plan }).eq("id", negocio.id);
    await refetch();
  };

  // ── Contenido por sección ──────────────────────────────────

  const contenido: Record<Seccion, React.ReactNode> = {

    perfil: (
      <Card className="p-8 border-none shadow-xl bg-white space-y-8">
        <div className="flex items-center gap-6">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={nombreCompleto}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center font-bold text-navy text-2xl border-4 border-white shadow-sm">
              {iniciales}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-navy">{nombreCompleto}</h3>
            <p className="text-sm text-navy/40">
              {negocio ? `Propietario de ${negocio.nombre}` : "Sin negocio"}
            </p>
            <div className="mt-2"><Badge variante="coral">Dueño</Badge></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">Email</label>
            <p className="text-sm font-medium text-navy">{email || "—"}</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">Plan</label>
            <p className="text-sm font-medium text-navy capitalize">{negocio?.plan ?? "—"}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-navy/5">
          <p className="text-xs text-navy/40 mb-4">
            Tu nombre, foto y contraseña se gestionan desde Clerk.
          </p>
          <Button
            variante="secundario"
            icono={<ExternalLink className="w-4 h-4" />}
            onClick={() => window.open("https://accounts.clerk.com/user", "_blank")}
          >
            Editar perfil en Clerk
          </Button>
        </div>
      </Card>
    ),

    negocio: (
      <Card className="p-8 border-none shadow-xl bg-white space-y-6">
        <div>
          <h3 className="text-lg font-bold text-navy mb-1">Detalles del Negocio</h3>
          <p className="text-sm text-navy/40">Esta información aparece en tu programa de fidelización.</p>
        </div>

        <div className="space-y-5">
          <Input
            etiqueta="Nombre del Negocio"
            value={nombreNegocio}
            onChange={e => setNombreNegocio(e.target.value)}
            placeholder="Mi Negocio"
          />

          <div className="space-y-2">
            <Input
              etiqueta="Slug (URL personalizada)"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="mi-negocio"
              ayuda={`kanjealo.hn/c/${slug || "..."}`}
            />
            <button
              onClick={copiarUrl}
              className="flex items-center gap-2 text-xs text-coral hover:text-coral/70 transition-colors font-medium"
            >
              {copiado ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiado ? "¡Copiado!" : "Copiar URL del programa"}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-navy/5">
          <Button
            variante="primario"
            cargando={guardandoNegocio}
            icono={guardadoNegocio ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            onClick={guardarNegocio}
          >
            {guardadoNegocio ? "¡Guardado!" : "Guardar cambios"}
          </Button>
        </div>
      </Card>
    ),

    modelo: (
      <div className="space-y-6">
        <Card className="p-8 border-none shadow-xl bg-white space-y-6">
          <div>
            <h3 className="text-lg font-bold text-navy">Modelo de Fidelización</h3>
            <p className="text-sm text-navy/40 mt-0.5">Elige cómo recompensar la lealtad de tus clientes.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MODELOS.map(m => {
              const isActive = modeloSeleccionado === m.id;
              const locked = m.pro && negocio?.plan === "basic";
              return (
                <button
                  key={m.id}
                  onClick={() => !locked && setModeloSeleccionado(m.id)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isActive
                      ? "border-coral bg-coral/5"
                      : locked
                      ? "border-navy/5 bg-navy/[0.02] opacity-60 cursor-not-allowed"
                      : "border-navy/10 bg-white hover:border-coral/30 hover:bg-coral/[0.02]"
                  }`}
                >
                  {locked && (
                    <span className="absolute top-2 right-2">
                      <Badge variante="navy" tamaño="sm">Pro</Badge>
                    </span>
                  )}
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <p className={`text-sm font-bold ${isActive ? "text-coral" : "text-navy"}`}>{m.label}</p>
                  <p className="text-[11px] text-navy/40 mt-0.5 leading-snug">{m.desc}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 rounded-full bg-coral flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Parámetros según modelo */}
          {modeloSeleccionado === "cashback" && (
            <div className="p-5 bg-cream rounded-2xl space-y-4 border border-navy/5">
              <p className="text-sm font-bold text-navy">Configuración de Cashback</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy/60">Porcentaje de cashback</label>
                  <span className="text-sm font-extrabold text-coral">{cashbackPercent}%</span>
                </div>
                <input type="range" min={1} max={20} step={0.5} value={cashbackPercent}
                  onChange={e => setCashbackPercent(parseFloat(e.target.value))}
                  className="w-full accent-coral" />
                <p className="text-[11px] text-navy/40">Por cada L.100, el cliente gana L.{cashbackPercent}.</p>
              </div>
            </div>
          )}

          {(modeloSeleccionado === "points" || modeloSeleccionado === "tiers" || modeloSeleccionado === "mixed") && (
            <div className="p-5 bg-cream rounded-2xl space-y-4 border border-navy/5">
              <p className="text-sm font-bold text-navy">Configuración de Puntos</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy/60">Puntos por L.1 gastado</label>
                  <input type="number" min={0.1} max={10} step={0.1} value={pointsPerLempira}
                    onChange={e => setPointsPerLempira(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-navy/10 text-sm text-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy/60">Valor de 1 punto (L.)</label>
                  <input type="number" min={0.001} max={0.1} step={0.001} value={pointsValue}
                    onChange={e => setPointsValue(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-navy/10 text-sm text-navy" />
                </div>
              </div>
              <p className="text-[11px] text-navy/40">
                Por cada L.100, el cliente gana {Math.floor(100 * pointsPerLempira)} pts = L.{(Math.floor(100 * pointsPerLempira) * pointsValue).toFixed(2)} de valor.
              </p>
            </div>
          )}

          {(modeloSeleccionado === "referrals" || modeloSeleccionado === "mixed") && (
            <div className="p-5 bg-cream rounded-2xl space-y-4 border border-navy/5">
              <p className="text-sm font-bold text-navy">Configuración de Referidos</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy/60">Puntos al referidor</label>
                  <input type="number" min={0} max={500} step={5} value={referralReferrer}
                    onChange={e => setReferralReferrer(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-navy/10 text-sm text-navy" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy/60">Puntos al nuevo cliente</label>
                  <input type="number" min={0} max={500} step={5} value={referralNew}
                    onChange={e => setReferralNew(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-navy/10 text-sm text-navy" />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-navy/5">
            <Button
              variante="primario"
              cargando={guardandoModelo}
              icono={guardadoModelo ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              onClick={guardarModelo}
            >
              {guardadoModelo ? "¡Guardado!" : "Guardar modelo"}
            </Button>
          </div>
        </Card>
      </div>
    ),

    sucursales: (
      <div className="space-y-6">
        {/* Info: notificaciones por proximidad */}
        <Card className="p-6 border-none shadow-xl bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-coral rounded-l-2xl" />
          <div className="pl-4 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center shrink-0">
              <Wifi className="w-6 h-6 text-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-navy">Notificaciones por proximidad</p>
              <p className="text-xs text-navy/40 mt-0.5">
                Cuando el cliente esté cerca del local, su Google Wallet mostrará una notificación automática.
              </p>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="text-[10px] font-bold text-navy/30 uppercase tracking-widest">Sucursales</p>
              <p className="text-2xl font-extrabold text-coral leading-none mt-1">
                {sucursales.length}
                <span className="text-base font-normal text-navy/30"> / {negocio?.plan === "pro" ? "∞" : "1"}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Lista */}
        <Card className="p-8 border-none shadow-xl bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-navy">Tus Sucursales</h3>
              <p className="text-sm text-navy/40 mt-0.5">Agrega la ubicación GPS de tus locales para activar las notificaciones.</p>
            </div>
            <button
              onClick={abrirModalNueva}
              disabled={negocio?.plan === "basic" && sucursales.length >= 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#FF5C3A" }}
            >
              <Plus className="w-4 h-4" /> Nueva Sucursal
            </button>
          </div>

          {negocio?.plan === "basic" && sucursales.length >= 1 && (
            <div className="p-4 rounded-2xl bg-navy/5 border border-navy/10 text-center">
              <p className="text-sm text-navy/60 font-medium">El Plan Basic incluye 1 sucursal.</p>
              <p className="text-xs text-navy/40 mt-1">Actualiza a Pro para agregar sucursales ilimitadas.</p>
            </div>
          )}

          {cargandoSucursales ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-coral border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sucursales.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <MapPin className="w-10 h-10 mx-auto text-navy/15" />
              <p className="text-sm font-bold text-navy/30">Sin sucursales registradas</p>
              <p className="text-xs text-navy/20">Agrega tu primera sucursal para activar las notificaciones de proximidad.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sucursales.map(s => (
                <div key={s.id} className="p-5 rounded-2xl border border-navy/10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.activa ? "bg-coral/10" : "bg-navy/5"}`}>
                        <MapPin className={`w-5 h-5 ${s.activa ? "text-coral" : "text-navy/30"}`} />
                      </div>
                      <div>
                        <p className="font-bold text-navy text-sm">{s.nombre}</p>
                        <p className="text-xs text-navy/40 mt-0.5 max-w-xs truncate">
                          {s.direccion ?? "Sin dirección registrada"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => abrirModalEditar(s)} className="p-2 text-navy/30 hover:text-coral transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => eliminarSucursal(s.id)} className="p-2 text-navy/20 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {s.latitud && s.longitud && (
                    <div className="flex items-center gap-2 text-xs text-navy/40 pl-13">
                      <Navigation className="w-3 h-3" />
                      <span>{s.latitud.toFixed(5)}, {s.longitud.toFixed(5)}</span>
                    </div>
                  )}

                  {s.mensaje_notificacion && (
                    <div className="flex items-start gap-2 p-3 bg-navy/3 rounded-xl border border-navy/5">
                      <Bell className="w-3.5 h-3.5 text-navy/30 mt-0.5 shrink-0" />
                      <p className="text-xs text-navy/50 italic">"{s.mensaje_notificacion}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Modal add/edit */}
        {modalSucursal !== null && (
          <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy text-lg">
                  {modalSucursal === "nueva" ? "Nueva Sucursal" : "Editar Sucursal"}
                </h3>
                <button onClick={() => setModalSucursal(null)} className="text-navy/30 hover:text-navy">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy/40 uppercase tracking-widest">Nombre de la sucursal</label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={e => setFormNombre(e.target.value)}
                    placeholder="Ej: Local Centro, Sucursal Norte..."
                    className="w-full px-4 py-3 bg-[#F4F4F8] rounded-xl text-sm text-navy outline-none focus:ring-2 ring-coral/20"
                  />
                </div>

                {/* GPS */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy/40 uppercase tracking-widest">Ubicación GPS</label>
                  <button
                    onClick={detectarUbicacion}
                    disabled={detectandoGps}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-coral/30 hover:border-coral/60 hover:bg-coral/5 transition-all text-coral font-bold text-sm disabled:opacity-60"
                  >
                    {detectandoGps ? (
                      <><div className="w-4 h-4 border-2 border-coral border-t-transparent rounded-full animate-spin" /> Detectando...</>
                    ) : (
                      <><Navigation className="w-4 h-4" /> Detectar mi ubicación con GPS</>
                    )}
                  </button>

                  {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}

                  {formLat && formLng && (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100 space-y-1">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <p className="text-xs font-bold text-green-700">Ubicación detectada</p>
                      </div>
                      <p className="text-xs text-navy/60 pl-6 leading-relaxed">{formDireccion}</p>
                      <p className="text-[10px] text-navy/30 pl-6">{formLat.toFixed(5)}, {formLng.toFixed(5)}</p>
                    </div>
                  )}
                </div>

                {/* Mensaje de notificación */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-navy/40 uppercase tracking-widest">
                    Mensaje de notificación en wallet
                  </label>
                  <textarea
                    value={formMensaje}
                    onChange={e => setFormMensaje(e.target.value)}
                    placeholder="¡Estás cerca! Muéstranos tu tarjeta para ganar tu recompensa."
                    rows={3}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-[#F4F4F8] rounded-xl text-sm text-navy outline-none focus:ring-2 ring-coral/20 resize-none"
                  />
                  <p className="text-[10px] text-navy/30 text-right">{formMensaje.length}/100 — aparece en la pantalla de bloqueo del cliente</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={guardarSucursal}
                  disabled={guardandoSucursal || !formNombre || !formLat}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#FF5C3A" }}
                >
                  {guardandoSucursal ? "Guardando…" : "Guardar sucursal"}
                </button>
                <button onClick={() => setModalSucursal(null)} className="px-4 py-3 rounded-xl text-navy/40 font-bold text-sm hover:bg-navy/5">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ),

    facturacion: (
      <Card className="p-8 border-none shadow-xl bg-white space-y-6">
        <div>
          <h3 className="text-lg font-bold text-navy mb-1">Facturación y Plan</h3>
          <p className="text-sm text-navy/40">Gestiona tu suscripción y método de pago.</p>
        </div>

        <div className="p-6 rounded-2xl bg-navy text-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Plan actual</p>
              <p className="text-2xl font-extrabold capitalize mt-1">{negocio?.plan ?? "Basic"}</p>
            </div>
            <Badge variante="coral">{negocio?.esta_activo ? "Activo" : "Inactivo"}</Badge>
          </div>
          <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40">Clientes</p>
              <p className="font-bold">{negocio?.plan === "pro" ? "Ilimitados" : "Hasta 500"}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Wallet digital</p>
              <p className="font-bold">Apple + Google</p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-navy/10 bg-cream space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-navy text-sm">Plan Pro</p>
            <p className="font-extrabold text-navy">L. 499<span className="text-xs font-normal text-navy/40">/mes</span></p>
          </div>
          <ul className="space-y-1.5">
            {["Clientes ilimitados", "Cajeros ilimitados", "Reportes avanzados", "Soporte prioritario", "Apple & Google Wallet"].map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-navy/70">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {negocio?.plan === "pro" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-xl">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-sm font-bold text-green-700">Ya tienes el Plan Pro activo</span>
              </div>
              <button
                onClick={() => actualizarPlan("basic")}
                className="text-xs text-navy/30 hover:text-navy/60 transition-colors w-full text-center"
              >
                Bajar a Basic
              </button>
            </div>
          ) : (
            <Button variante="primario" className="w-full mt-2" onClick={() => actualizarPlan("pro")}>
              Actualizar a Pro
            </Button>
          )}
        </div>
      </Card>
    ),

    seguridad: (
      <Card className="p-8 border-none shadow-xl bg-white space-y-6">
        <div>
          <h3 className="text-lg font-bold text-navy mb-1">Seguridad</h3>
          <p className="text-sm text-navy/40">Tu contraseña y acceso se gestionan desde Clerk.</p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-navy/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-navy/40" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Contraseña</p>
                <p className="text-xs text-navy/40">Última actualización desconocida</p>
              </div>
            </div>
            <Button
              variante="secundario"
              tamaño="sm"
              onClick={() => window.open("https://accounts.clerk.com/user/security", "_blank")}
            >
              Cambiar
            </Button>
          </div>

          <div className="p-5 rounded-2xl border border-navy/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-navy/40" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Verificación en dos pasos</p>
                <p className="text-xs text-navy/40">Protege tu cuenta con 2FA</p>
              </div>
            </div>
            <Button
              variante="secundario"
              tamaño="sm"
              onClick={() => window.open("https://accounts.clerk.com/user/security", "_blank")}
            >
              Configurar
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-navy/30">
            La gestión de sesiones activas también está disponible en tu perfil de Clerk.
          </p>
        </div>
      </Card>
    ),

    cajeros: (
      <div className="space-y-6">
        {/* Enlace al panel del cajero */}
        {negocio && (
          <Card className="p-6 border-none shadow-xl bg-white overflow-hidden relative">
            {/* Acento decorativo */}
            <div className="absolute top-0 left-0 w-1.5 h-full bg-coral rounded-l-2xl" />

            <div className="pl-4 flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Ícono */}
              <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-coral" />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-navy">Panel de Cajero</p>
                <p className="text-xs text-navy/40 mt-0.5">
                  Tus cajeros inician sesión aquí con su PIN para registrar sellos y atender clientes.
                </p>
                <div className="flex items-center gap-2 mt-2 bg-[#F4F4F8] rounded-xl px-3 py-2 w-fit max-w-full">
                  <span className="text-xs font-mono text-navy/60 truncate">
                    {typeof window !== "undefined" ? window.location.origin : "https://kanjealo.hn"}/cajero/{negocio.slug}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/cajero/${negocio.slug}`;
                    navigator.clipboard.writeText(url);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-navy/10 hover:border-coral/30 text-navy/50 hover:text-coral text-sm font-bold transition-all"
                >
                  {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copiado ? "Copiado" : "Copiar"}</span>
                </button>
                <button
                  onClick={() => window.open(`/cajero/${negocio.slug}`, "_blank")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral text-white text-sm font-bold hover:bg-coral/90 transition-all shadow-md shadow-coral/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir panel
                </button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-8 border-none shadow-xl bg-white space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-navy">Cajeros Autorizados</h3>
              <p className="text-sm text-navy/40 mt-0.5">Cada cajero tiene un PIN único para registrar sellos.</p>
            </div>
            <Button
              variante="primario"
              tamaño="sm"
              icono={<Plus className="w-4 h-4" />}
              onClick={() => setMostrarFormCajero(v => !v)}
            >
              Añadir Cajero
            </Button>
          </div>

          {mostrarFormCajero && (
            <div className="p-5 rounded-2xl bg-cream space-y-4 border border-navy/10">
              <p className="text-sm font-bold text-navy">Nuevo cajero</p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  etiqueta="Nombre"
                  value={nuevoCajeroNombre}
                  onChange={e => setNuevoCajeroNombre(e.target.value)}
                  placeholder="Ej: María López"
                />
                <Input
                  etiqueta="PIN (4 dígitos)"
                  type="password"
                  value={nuevoCajeroPin}
                  onChange={e => setNuevoCajeroPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variante="primario"
                  tamaño="sm"
                  cargando={agregandoCajero}
                  disabled={!nuevoCajeroNombre || nuevoCajeroPin.length < 4}
                  onClick={agregarCajero}
                >
                  Guardar Cajero
                </Button>
                <Button variante="ghost" tamaño="sm" onClick={() => setMostrarFormCajero(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {cargandoCajeros ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-coral border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cajeros.length === 0 ? (
            <div className="py-10 text-center text-navy/30">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No tienes cajeros registrados.</p>
              <p className="text-xs mt-1">Añade un cajero para que pueda registrar sellos sin acceso al dashboard.</p>
            </div>
          ) : (
            <div className="divide-y divide-navy/5 -mx-8 px-8">
              {cajeros.map(cajero => (
                <div key={cajero.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold">
                      {cajero.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy">{cajero.nombre}</p>
                      <p className="text-xs text-navy/40">PIN: ••••</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variante="verde" tamaño="sm">Activo</Badge>
                    <button
                      onClick={() => desactivarCajero(cajero.id)}
                      className="p-2 text-navy/20 hover:text-red-400 transition-colors"
                      title="Desactivar cajero"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    ),
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold text-navy">Configuración</h1>
        <p className="text-navy/50">Administra los detalles de tu cuenta y negocio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menú lateral */}
        <div className="lg:col-span-1 space-y-1">
          {SECCIONES.map(item => (
            <button
              key={item.id}
              onClick={() => setSeccion(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                seccion === item.id
                  ? "bg-white shadow-md text-navy font-bold"
                  : "text-navy/40 hover:bg-white/50 hover:text-navy"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${seccion === item.id ? "text-coral" : "text-navy/20"}`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-opacity ${seccion === item.id ? "opacity-100" : "opacity-0"}`} />
            </button>
          ))}
        </div>

        {/* Panel activo */}
        <div className="lg:col-span-2">
          {contenido[seccion]}
        </div>
      </div>
    </div>
  );
}

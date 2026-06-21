"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search, LogOut, User, Phone, Gift, Star,
  CheckCircle2, XCircle, Plus, Banknote, Trophy, X,
  RefreshCw, ChevronRight, QrCode, Wallet,
} from "lucide-react";
import { KanjealoLogo } from "@/components/logo";
import { QrScanner, parsearQr } from "@/components/qr-scanner";

// ── Tipos ─────────────────────────────────────────────────────
interface CajeroSession {
  cajeroId: string;
  cajeroNombre: string;
  businessId: string;
  businessNombre: string;
  businessSlug: string;
  sellosRequeridos: number;
  colorMarca: string;
  model: string;
  loyalty: { cashback_percent: number; points_per_lempira: number } | null;
}

interface ClienteResumen {
  id: string;
  nombre: string;
  telefono: string;
  total_sellos: number;
  total_canjes: number;
  ultima_visita: string | null;
}

interface ClienteData {
  cliente: ClienteResumen & { created_at: string };
  cashback: { balance: number; total_earned: number } | null;
  puntos: { balance: number; total_earned: number; tier: string } | null;
  historial: {
    sellos: { id: string; created_at: string }[];
    canjes: { id: string; created_at: string }[];
    puntos: { id: string; type: string; points: number; description: string; created_at: string }[];
    cashback: { id: string; type: string; amount: number; purchase_amount: number; created_at: string }[];
  };
}

type Toast = { tipo: "ok" | "error" | "premio"; mensaje: string } | null;

// ── Helpers ───────────────────────────────────────────────────
const MODELO_LABEL: Record<string, string> = {
  stamps: "Sellos", cashback: "Cashback", points: "Puntos",
  tiers: "Niveles", referrals: "Referidos", mixed: "Mixto",
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-HN", { day: "numeric", month: "short" });
}

function iniciales(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Toast ─────────────────────────────────────────────────────
function ToastAlert({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const styles = { ok: "bg-green-500", error: "bg-red-500", premio: "bg-coral" };
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${styles[toast.tipo]}`}>
      {toast.tipo === "ok" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
      {toast.tipo === "error" && <XCircle className="w-5 h-5 shrink-0" />}
      {toast.tipo === "premio" && <Gift className="w-5 h-5 shrink-0" />}
      {toast.mensaje}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ── Panel Principal ───────────────────────────────────────────
export default function CajeroPanelPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [session, setSession] = useState<CajeroSession | null>(null);
  const [listaClientes, setListaClientes] = useState<ClienteResumen[]>([]);
  const [filtro, setFiltro] = useState("");
  const [cargandoLista, setCargandoLista] = useState(false);
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [cargandoCliente, setCargandoCliente] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [operando, setOperando] = useState(false);

  // Modal nuevo cliente
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [registrando, setRegistrando] = useState(false);

  // Modal monto
  const [modalMonto, setModalMonto] = useState<"earn" | "redeem" | null>(null);
  const [monto, setMonto] = useState("");

  // Escáner QR
  const [modalScanner, setModalScanner] = useState(false);

  const mostrarToast = (tipo: "ok" | "error" | "premio", mensaje: string) =>
    setToast({ tipo, mensaje });

  // ── Cargar lista de clientes ──
  const cargarLista = useCallback(async (businessId: string) => {
    setCargandoLista(true);
    try {
      const res = await fetch(`/api/cajero/cliente?business_id=${businessId}`);
      const data = await res.json();
      setListaClientes(data.clientes ?? []);
    } finally {
      setCargandoLista(false);
    }
  }, []);

  // ── Cargar sesión ──
  useEffect(() => {
    const raw = sessionStorage.getItem("cajero_session");
    if (!raw) { router.replace(`/cajero/${slug}`); return; }
    const stored: CajeroSession = JSON.parse(raw);
    setSession(stored);
    cargarLista(stored.businessId);

    // Refrescar modelo desde el servidor
    fetch(`/api/cajero/modelo?business_id=${stored.businessId}`)
      .then(r => r.json())
      .then(d => setSession(prev => prev ? { ...prev, model: d.model, loyalty: d.loyalty } : prev))
      .catch(() => {});
  }, [router, slug, cargarLista]);

  // ── Seleccionar cliente de la lista ──
  const seleccionarCliente = useCallback(async (telefono: string, businessId: string) => {
    setCargandoCliente(true);
    setClienteData(null);
    try {
      const res = await fetch(
        `/api/cajero/cliente?telefono=${encodeURIComponent(telefono)}&business_id=${businessId}`
      );
      const data = await res.json();
      if (data.cliente) setClienteData(data);
      return data.cliente ?? null;
    } finally {
      setCargandoCliente(false);
    }
  }, []);

  // ── Seleccionar cliente por id (QR de la tarjeta) — consulta el servidor,
  // no depende de la lista cacheada en el navegador ──
  const seleccionarClientePorId = useCallback(async (clientId: string, businessId: string) => {
    setCargandoCliente(true);
    setClienteData(null);
    try {
      const res = await fetch(
        `/api/cajero/cliente?id=${encodeURIComponent(clientId)}&business_id=${businessId}`
      );
      const data = await res.json();
      if (data.cliente) setClienteData(data);
      return data.cliente ?? null;
    } finally {
      setCargandoCliente(false);
    }
  }, []);

  const recargarCliente = useCallback(async () => {
    if (!clienteData || !session) return;
    const res = await fetch(
      `/api/cajero/cliente?telefono=${encodeURIComponent(clienteData.cliente.telefono)}&business_id=${session.businessId}`
    );
    const data = await res.json();
    if (data.cliente) setClienteData(data);
  }, [clienteData, session]);

  // ── Acciones ──
  const darSello = async () => {
    if (!clienteData || !session || operando) return;
    setOperando(true);
    try {
      const res = await fetch("/api/cajero/sello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: clienteData.cliente.id,
          business_id: session.businessId,
          cajero_id: session.cajeroId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { mostrarToast("error", data.error); return; }
      if (data.premio) {
        mostrarToast("premio", `¡Premio desbloqueado! ${clienteData.cliente.nombre} completó su tarjeta 🎉`);
      } else {
        mostrarToast("ok", `Sello dado — ${data.nuevos_sellos} / ${data.sellos_requeridos}`);
      }
      await recargarCliente();
      cargarLista(session.businessId);
    } finally {
      setOperando(false);
    }
  };

  const registrarCompra = async () => {
    if (!clienteData || !session || !monto || operando) return;
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) { mostrarToast("error", "Monto inválido"); return; }
    setOperando(true);
    try {
      const res = await fetch("/api/loyalty/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: clienteData.cliente.id,
          business_id: session.businessId,
          purchase_amount: montoNum,
          model: session.model,
        }),
      });
      const data = await res.json();
      if (!res.ok) { mostrarToast("error", data.error); return; }
      const msg = session.model === "cashback"
        ? `Compra registrada — ganó L. ${data.earned?.toFixed(2)}`
        : `Compra registrada — ganó ${data.earned} pts${data.tier_up ? ` 🏆 Subió a ${data.tier}` : ""}`;
      mostrarToast(data.tier_up ? "premio" : "ok", msg);
      setModalMonto(null); setMonto("");
      await recargarCliente();
    } finally {
      setOperando(false);
    }
  };

  const canjear = async () => {
    if (!clienteData || !session || !monto || operando) return;
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) { mostrarToast("error", "Monto inválido"); return; }
    setOperando(true);
    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: clienteData.cliente.id,
          business_id: session.businessId,
          amount: montoNum,
          model: session.model,
        }),
      });
      const data = await res.json();
      if (!res.ok) { mostrarToast("error", data.error); return; }
      const msg = session.model === "cashback"
        ? `Canjeado L. ${montoNum.toFixed(2)} — saldo: L. ${data.new_balance?.toFixed(2)}`
        : `Canjeados ${montoNum} pts — saldo: ${data.new_balance}`;
      mostrarToast("ok", msg);
      setModalMonto(null); setMonto("");
      await recargarCliente();
    } finally {
      setOperando(false);
    }
  };

  const registrarNuevoCliente = async () => {
    if (!session || !nuevoNombre || !nuevoTelefono || registrando) return;
    setRegistrando(true);
    try {
      const res = await fetch("/api/cajero/cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre, telefono: nuevoTelefono, business_id: session.businessId }),
      });
      const data = await res.json();
      if (!res.ok) { mostrarToast("error", data.error); return; }
      mostrarToast("ok", `¡${data.cliente.nombre} registrado!`);
      setModalNuevo(false); setNuevoNombre(""); setNuevoTelefono("");
      await cargarLista(session.businessId);
      await seleccionarCliente(data.cliente.telefono, session.businessId);
    } finally {
      setRegistrando(false);
    }
  };

  const handleQrResult = async (texto: string) => {
    setModalScanner(false);
    if (!session) return;

    const { telefono, clientId } = parsearQr(texto);

    if (telefono) {
      await seleccionarCliente(telefono, session.businessId);
      return;
    }

    if (clientId) {
      const encontrado = await seleccionarClientePorId(clientId, session.businessId);
      if (!encontrado) mostrarToast("error", "Cliente no encontrado");
      return;
    }

    mostrarToast("error", "QR no reconocido. Pídele al cliente que muestre su tarjeta.");
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("cajero_session");
    router.push(`/cajero/${slug}`);
  };

  if (!session) return null;

  const { cliente, cashback, puntos } = clienteData ?? {};
  const model = session.model;
  const color = session.colorMarca;

  // Filtro client-side
  const terminoBusqueda = filtro.toLowerCase().trim();
  const clientesFiltrados = terminoBusqueda
    ? listaClientes.filter(c =>
        c.nombre.toLowerCase().includes(terminoBusqueda) ||
        c.telefono.replace(/\D/g, "").includes(terminoBusqueda.replace(/\D/g, ""))
      )
    : listaClientes;

  return (
    <div className="min-h-screen bg-[#F4F4F8] flex flex-col">
      <ToastAlert toast={toast} onClose={() => setToast(null)} />

      {/* ── Header ── */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <KanjealoLogo tamaño="sm" variante="blanco" />
          <div className="w-px h-6 bg-white/10" />
          <div>
            <p className="text-xs text-white/40 font-medium">{session.businessNombre}</p>
            <p className="text-sm font-bold">{MODELO_LABEL[model] ?? model}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white/40">Cajero</p>
            <p className="text-sm font-bold">{session.cajeroNombre}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">

          {/* ── Columna izquierda: Lista de clientes ── */}
          <div className="lg:col-span-2 flex flex-col gap-3">

            {/* Buscador + acciones */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-navy/40 uppercase tracking-widest">
                  Clientes{listaClientes.length > 0 ? ` (${listaClientes.length})` : ""}
                </p>
                <button
                  onClick={() => cargarLista(session.businessId)}
                  disabled={cargandoLista}
                  className="text-navy/30 hover:text-coral transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cargandoLista ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o teléfono…"
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F4F4F8] rounded-xl text-sm text-navy outline-none focus:ring-2 ring-coral/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModalScanner(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl justify-center transition-all border-2"
                  style={{ borderColor: color, color }}
                >
                  <QrCode className="w-3.5 h-3.5" /> Escanear QR
                </button>
                <button
                  onClick={() => { setModalNuevo(true); setNuevoNombre(""); setNuevoTelefono(""); }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl justify-center transition-all text-white"
                  style={{ backgroundColor: color }}
                >
                  <Plus className="w-3.5 h-3.5" /> Nuevo cliente
                </button>
              </div>
            </div>

            {/* Lista scrollable */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex-1">
              {cargandoLista ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin" />
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <User className="w-8 h-8 text-navy/15 mb-2" />
                  <p className="text-sm font-bold text-navy/30">
                    {filtro ? "Sin resultados" : "Sin clientes aún"}
                  </p>
                  {!filtro && (
                    <p className="text-xs text-navy/20 mt-1">Registra el primer cliente</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-navy/5 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {clientesFiltrados.map(c => {
                    const esSeleccionado = clienteData?.cliente.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => seleccionarCliente(c.telefono, session.businessId)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-navy/3 ${
                          esSeleccionado ? "bg-navy/5 border-l-2" : ""
                        }`}
                        style={esSeleccionado ? { borderLeftColor: color } : {}}
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: esSeleccionado ? color : color + "60" }}
                        >
                          {iniciales(c.nombre)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${esSeleccionado ? "text-navy" : "text-navy/80"}`}>
                            {c.nombre}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-navy/40">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            <span>{c.telefono}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right shrink-0">
                          {model === "stamps" && (
                            <p className="text-xs font-bold" style={{ color }}>
                              {c.total_sellos}/{session.sellosRequeridos}
                            </p>
                          )}
                          <p className="text-[10px] text-navy/30">
                            {c.ultima_visita ? formatFecha(c.ultima_visita) : "Nuevo"}
                          </p>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-navy/20 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: Perfil + Acciones ── */}
          <div className="lg:col-span-3 space-y-4">
            {cargandoCliente ? (
              <div className="bg-white rounded-2xl p-16 shadow-sm flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin" />
              </div>
            ) : cliente ? (
              <>
                {/* Perfil compacto */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 flex items-center gap-4" style={{ backgroundColor: color + "12" }}>
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {iniciales(cliente.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy text-lg leading-tight">{cliente.nombre}</p>
                      <p className="text-sm text-navy/50 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{cliente.telefono}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-extrabold text-navy">{cliente.total_canjes}</p>
                      <p className="text-[10px] text-navy/40 font-bold uppercase tracking-wider">Canjes</p>
                    </div>
                  </div>
                  <div className="px-5 pb-4 pt-1">
                    <a
                      href={`/api/wallet/google?client_id=${cliente.id}&business_id=${session.businessId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
                      style={{ backgroundColor: "#1a1a2e" }}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      Google Wallet
                    </a>
                  </div>
                </div>

                {/* ── SELLOS ── */}
                {model === "stamps" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-navy text-lg">Programa de Sellos</p>
                      <span className="text-2xl font-extrabold" style={{ color }}>
                        {cliente.total_sellos} / {session.sellosRequeridos}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="h-3 bg-navy/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min((cliente.total_sellos / session.sellosRequeridos) * 100, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center py-2">
                        {Array.from({ length: session.sellosRequeridos }).map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                            style={{
                              backgroundColor: i < cliente.total_sellos ? color : "transparent",
                              border: i < cliente.total_sellos ? "none" : `2px solid ${color}30`,
                            }}
                          >
                            {i < cliente.total_sellos && <Star className="w-4 h-4 text-white" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={darSello}
                      disabled={operando}
                      className="w-full py-5 rounded-2xl text-white text-xl font-extrabold tracking-wide transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                      style={{ backgroundColor: color }}
                    >
                      {operando ? "Procesando…" : "DAR SELLO"}
                    </button>

                    {cliente.total_sellos >= session.sellosRequeridos && (
                      <div className="flex items-center gap-3 p-4 bg-coral/10 rounded-2xl border border-coral/20">
                        <Gift className="w-6 h-6 text-coral shrink-0" />
                        <div>
                          <p className="font-bold text-coral text-sm">¡Tarjeta completada!</p>
                          <p className="text-xs text-coral/70">El siguiente sello canjeará el premio automáticamente.</p>
                        </div>
                      </div>
                    )}

                    {/* Historial */}
                    {clienteData!.historial.sellos.length > 0 && (
                      <div className="border-t border-navy/5 pt-4">
                        <p className="text-[10px] font-bold text-navy/30 uppercase tracking-widest mb-2">Historial reciente</p>
                        <div className="space-y-1.5">
                          {clienteData!.historial.sellos.slice(0, 4).map(s => (
                            <div key={s.id} className="flex items-center gap-2 text-xs text-navy/50">
                              <Star className="w-3 h-3 shrink-0" style={{ color }} />
                              <span>Sello — {formatFecha(s.created_at)}</span>
                            </div>
                          ))}
                          {clienteData!.historial.canjes.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-xs">
                              <Gift className="w-3 h-3 text-coral shrink-0" />
                              <span className="font-bold text-coral">Premio — {formatFecha(c.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PUNTOS / TIERS / MIXED ── */}
                {(model === "points" || model === "tiers" || model === "mixed") && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                    <p className="font-bold text-navy text-lg">Puntos de Lealtad</p>
                    <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: color + "10" }}>
                      <Star className="w-8 h-8 shrink-0" style={{ color }} />
                      <div>
                        <p className="text-3xl font-extrabold" style={{ color }}>
                          {(puntos?.balance ?? 0).toLocaleString()}
                          <span className="text-base font-normal text-navy/40 ml-1">pts</span>
                        </p>
                        {puntos?.tier && (
                          <div className="flex items-center gap-1 text-xs text-navy/50 mt-0.5">
                            <Trophy className="w-3 h-3" /><span>Nivel {puntos.tier}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-auto text-right text-xs text-navy/40">
                        <p>Total ganado</p>
                        <p className="font-bold text-navy">{(puntos?.total_earned ?? 0).toLocaleString()} pts</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setModalMonto("earn"); setMonto(""); }}
                        className="py-4 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 shadow-md"
                        style={{ backgroundColor: color }}>
                        Registrar Compra
                      </button>
                      <button onClick={() => { setModalMonto("redeem"); setMonto(""); }}
                        disabled={!puntos || puntos.balance <= 0}
                        className="py-4 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 disabled:opacity-30"
                        style={{ borderColor: color, color }}>
                        Canjear Puntos
                      </button>
                    </div>
                    {session.loyalty && (
                      <p className="text-[11px] text-navy/30 text-center">
                        {session.loyalty.points_per_lempira} pts por cada L.1 gastado
                      </p>
                    )}
                  </div>
                )}

                {/* ── CASHBACK ── */}
                {model === "cashback" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                    <p className="font-bold text-navy text-lg">Cashback</p>
                    <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: color + "10" }}>
                      <Banknote className="w-8 h-8 shrink-0" style={{ color }} />
                      <div>
                        <p className="text-3xl font-extrabold" style={{ color }}>
                          L. {(cashback?.balance ?? 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-navy/40 mt-0.5">Saldo disponible</p>
                      </div>
                      <div className="ml-auto text-right text-xs text-navy/40">
                        <p>Total ganado</p>
                        <p className="font-bold text-navy">L. {(cashback?.total_earned ?? 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => { setModalMonto("earn"); setMonto(""); }}
                        className="py-4 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 shadow-md"
                        style={{ backgroundColor: color }}>
                        Registrar Compra
                      </button>
                      <button onClick={() => { setModalMonto("redeem"); setMonto(""); }}
                        disabled={!cashback || cashback.balance <= 0}
                        className="py-4 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 disabled:opacity-30"
                        style={{ borderColor: color, color }}>
                        Canjear Cashback
                      </button>
                    </div>
                    {session.loyalty && (
                      <p className="text-[11px] text-navy/30 text-center">
                        {session.loyalty.cashback_percent}% de devolución por compra
                      </p>
                    )}
                  </div>
                )}

                {/* ── REFERIDOS ── */}
                {model === "referrals" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 text-center">
                    <User className="w-10 h-10 mx-auto" style={{ color }} />
                    <p className="font-bold text-navy">Programa de Referidos</p>
                    <p className="text-sm text-navy/40">Los clientes comparten su enlace para ganar puntos cuando un amigo se registra.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl p-16 shadow-sm flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                  <User className="w-9 h-9" style={{ color }} />
                </div>
                <div>
                  <p className="font-bold text-navy text-lg">Selecciona un cliente</p>
                  <p className="text-sm text-navy/40 mt-1">Elige de la lista o registra uno nuevo.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Escáner QR ── */}
      {modalScanner && (
        <QrScanner
          color={color}
          onResult={handleQrResult}
          onClose={() => setModalScanner(false)}
        />
      )}

      {/* ── Modal: Nuevo Cliente ── */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy text-lg">Nuevo Cliente</h3>
              <button onClick={() => setModalNuevo(false)} className="text-navy/30 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nombre completo" value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F4F8] rounded-xl text-sm text-navy outline-none focus:ring-2 ring-coral/20" />
              <input type="tel" placeholder="Teléfono" value={nuevoTelefono}
                onChange={e => setNuevoTelefono(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F4F8] rounded-xl text-sm text-navy outline-none focus:ring-2 ring-coral/20" />
            </div>
            <div className="flex gap-3">
              <button onClick={registrarNuevoCliente}
                disabled={registrando || !nuevoNombre || !nuevoTelefono}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40"
                style={{ backgroundColor: color }}>
                {registrando ? "Registrando…" : "Registrar"}
              </button>
              <button onClick={() => setModalNuevo(false)}
                className="px-4 py-3 rounded-xl text-navy/40 font-bold text-sm hover:bg-navy/5 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Monto ── */}
      {modalMonto && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy text-lg">
                {modalMonto === "earn" ? "Registrar Compra" : model === "cashback" ? "Canjear Cashback" : "Canjear Puntos"}
              </h3>
              <button onClick={() => setModalMonto(null)} className="text-navy/30 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-navy/40 uppercase tracking-widest">
                {modalMonto === "earn" ? "Monto de compra (L.)" : model === "cashback" ? "Cashback a canjear (L.)" : "Puntos a canjear"}
              </label>
              <input type="number" placeholder="0.00" value={monto}
                onChange={e => setMonto(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (modalMonto === "earn" ? registrarCompra() : canjear())}
                autoFocus
                className="w-full px-4 py-3 bg-[#F4F4F8] rounded-xl text-lg font-bold text-navy outline-none focus:ring-2 ring-coral/20" />
              {modalMonto === "earn" && session.loyalty && monto && !isNaN(parseFloat(monto)) && (
                <p className="text-xs text-navy/40">
                  {model === "cashback"
                    ? `Ganará L. ${((parseFloat(monto) * session.loyalty.cashback_percent) / 100).toFixed(2)}`
                    : `Ganará ${Math.floor(parseFloat(monto) * session.loyalty.points_per_lempira)} pts`}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={modalMonto === "earn" ? registrarCompra : canjear}
                disabled={operando || !monto}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40"
                style={{ backgroundColor: color }}>
                {operando ? "Procesando…" : "Confirmar"}
              </button>
              <button onClick={() => setModalMonto(null)}
                className="px-4 py-3 rounded-xl text-navy/40 font-bold text-sm hover:bg-navy/5 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

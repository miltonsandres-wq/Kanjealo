"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Phone, User, Gift, Star } from "lucide-react";
import { KanjealoLogo } from "@/components/logo";

interface Negocio {
  id: string;
  nombre: string;
  nombre_programa: string;
  color_marca: string;
  descripcion_premio: string;
  sellos_requeridos: number;
}

export default function RegistroClientePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/cajero/login?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(d => { if (d.nombre) setNegocio({ ...d, slug } as Negocio); })
      .finally(() => setCargando(false));
  }, [slug]);

  const registrarse = async () => {
    if (!nombre.trim() || !telefono.trim() || !negocio || registrando) return;
    setRegistrando(true);
    setError("");
    try {
      const res = await fetch("/api/cajero/cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono, business_id: negocio.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError("Ya tienes una cuenta en este programa. ¡Visita el negocio para acumular!");
        } else {
          setError(data.error ?? "Error al registrarse");
        }
        return;
      }
      setClienteId(data.cliente?.id ?? null);
      setRegistrado(true);
    } finally {
      setRegistrando(false);
    }
  };

  const color = negocio?.color_marca ?? "#FF5C3A";

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: color }}>
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (registrado && negocio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ backgroundColor: color }}>
        <div className="max-w-sm w-full space-y-8">
          <KanjealoLogo tamaño="md" variante="blanco" className="mx-auto" />

          <div className="bg-white rounded-3xl p-8 space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-navy">¡Bienvenido!</h2>
              <p className="text-navy/50 text-sm mt-1">
                Te registraste en <strong>{negocio.nombre_programa}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: color + "10" }}>
              <div className="flex items-center gap-3 text-sm text-navy/70">
                <Star className="w-4 h-4 shrink-0" style={{ color }} />
                <span>Acumula sellos en cada visita</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-navy/70">
                <Gift className="w-4 h-4 shrink-0" style={{ color }} />
                <span>Al completar {negocio.sellos_requeridos} sellos: <strong>{negocio.descripcion_premio}</strong></span>
              </div>
            </div>

            {clienteId && negocio && (
              <a
                href={`/api/wallet/google?client_id=${clienteId}&business_id=${negocio.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-all active:scale-95 shadow-md"
                style={{ backgroundColor: "#1a1a2e" }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                Guardar en Google Wallet
              </a>
            )}

            <p className="text-xs text-navy/30">
              Muestra tu número de teléfono al cajero en cada visita para acumular tu sello.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: color }}>
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 text-center text-white space-y-4">
        <KanjealoLogo tamaño="md" variante="blanco" className="mx-auto" />
        <div>
          <h1 className="text-3xl font-extrabold mt-6">
            {negocio?.nombre_programa ?? "Programa de Lealtad"}
          </h1>
          <p className="text-white/70 mt-2 text-sm">
            Únete y empieza a ganar recompensas en cada visita.
          </p>
        </div>

        {negocio && (
          <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm">
            <Gift className="w-4 h-4" />
            <span>{negocio.sellos_requeridos} sellos = {negocio.descripcion_premio}</span>
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="flex-1 bg-white rounded-t-[32px] px-6 py-8 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-navy">Crea tu cuenta</h2>
          <p className="text-sm text-navy/40 mt-1">Solo necesitas tu nombre y teléfono.</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-[#F4F4F8] rounded-2xl text-navy text-sm outline-none focus:ring-2 ring-opacity-30"
              style={{ focusRingColor: color } as React.CSSProperties}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30" />
            <input
              type="tel"
              placeholder="Teléfono (ej. 99001234)"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-[#F4F4F8] rounded-2xl text-navy text-sm outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-medium px-1">{error}</p>
        )}

        <button
          onClick={registrarse}
          disabled={registrando || !nombre.trim() || !telefono.trim()}
          className="w-full py-4 rounded-2xl text-white text-base font-bold transition-all active:scale-95 disabled:opacity-40 shadow-lg"
          style={{ backgroundColor: color }}
        >
          {registrando ? "Registrando…" : "Unirme al programa"}
        </button>

        <p className="text-[11px] text-navy/30 text-center leading-relaxed">
          Al registrarte aceptas recibir comunicaciones del programa de fidelización.
          Tu información es confidencial.
        </p>
      </div>
    </div>
  );
}

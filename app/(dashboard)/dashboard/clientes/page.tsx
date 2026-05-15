"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, MoreHorizontal, Phone, Calendar, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNegocio, useLoyaltyConfig } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import type { Cliente, CashbackBalance, PointsBalance } from "@/lib/types";

const TIER_ICONS: Record<string, string> = {
  Bronce: "🥉", Plata: "🥈", Oro: "🥇", VIP: "💎",
};

export default function ClientesPage() {
  const { negocio, cargando: cargandoNegocio } = useNegocio();
  const { config } = useLoyaltyConfig(negocio?.id);
  const model = config?.model ?? "stamps";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cashbackMap, setCashbackMap] = useState<Record<string, CashbackBalance>>({});
  const [pointsMap, setPointsMap] = useState<Record<string, PointsBalance>>({});
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!negocio) return;

    async function cargar() {
      const [{ data: cli }, { data: cb }, { data: pts }] = await Promise.all([
        supabase.from("clientes").select("*").eq("business_id", negocio!.id)
          .order("ultima_visita", { ascending: false, nullsFirst: false }),
        supabase.from("cashback_balance").select("*").eq("business_id", negocio!.id),
        supabase.from("points_balance").select("*").eq("business_id", negocio!.id),
      ]);

      setClientes(cli ?? []);
      const cbMap: Record<string, CashbackBalance> = {};
      cb?.forEach(b => { cbMap[b.customer_id] = b; });
      setCashbackMap(cbMap);
      const ptsMap: Record<string, PointsBalance> = {};
      pts?.forEach(b => { ptsMap[b.customer_id] = b; });
      setPointsMap(ptsMap);
      setCargando(false);
    }

    cargar();
  }, [negocio]);

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.telefono ?? "").includes(busqueda)
  );

  const exportarCSV = () => {
    const filas = [
      ["Nombre", "Teléfono", "Sellos", "Canjes", "Última visita"],
      ...clientesFiltrados.map(c => [
        c.nombre, c.telefono ?? "",
        String(c.total_sellos), String(c.total_canjes),
        c.ultima_visita ?? c.created_at,
      ]),
    ];
    const blob = new Blob([filas.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clientes-kanjealo.csv";
    a.click();
  };

  if (cargandoNegocio || cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Column header label
  const colLabel = model === "cashback" ? "Saldo CB"
    : model === "points" || model === "tiers" || model === "mixed" ? "Puntos / Nivel"
    : "Sellos";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Clientes</h1>
          <p className="text-navy/50">{clientes.length} clientes en tu programa.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variante={model === "stamps" ? "navy" : "coral"} tamaño="sm" className="capitalize">
            {model === "stamps" ? "Sellos" : model === "cashback" ? "Cashback" : model === "points" ? "Puntos" : model === "tiers" ? "Niveles" : model === "referrals" ? "Referidos" : "Mixto"}
          </Badge>
          <Button variante="secundario" icono={<Download className="w-4 h-4" />} onClick={exportarCSV}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="p-4 border-none shadow-sm bg-white flex gap-4 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/20" />
          <input type="text" placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-12 pr-4 py-3 bg-cream border-none rounded-xl text-sm focus:ring-2 focus:ring-coral/20 outline-none"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      </Card>

      {clientes.length === 0 ? (
        <Card className="border-none shadow-sm bg-white p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center">
            <Users className="w-8 h-8 text-navy/20" />
          </div>
          <div>
            <p className="font-bold text-navy text-lg">Aún no tienes clientes</p>
            <p className="text-sm text-navy/40 mt-1">Comparte tu código QR para comenzar.</p>
          </div>
        </Card>
      ) : (
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy/5 text-navy/40 text-[11px] font-bold uppercase tracking-widest border-b border-navy/5">
                  <th className="px-8 py-4">Cliente</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4 text-center">{colLabel}</th>
                  <th className="px-6 py-4 text-center">Canjes</th>
                  <th className="px-6 py-4 text-center">Última Visita</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-cream/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                          {cliente.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-bold text-navy group-hover:text-coral transition-colors">
                          {cliente.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {cliente.telefono ? (
                        <div className="flex items-center gap-2 text-xs text-navy/60">
                          <Phone className="w-3 h-3" />{cliente.telefono}
                        </div>
                      ) : <span className="text-xs text-navy/30">—</span>}
                    </td>

                    {/* Columna dinámica según modelo */}
                    <td className="px-6 py-5 text-center">
                      {model === "stamps" && (
                        <LoyaltyCell stamps={cliente.total_sellos} required={negocio?.sellos_requeridos ?? 10} />
                      )}
                      {model === "cashback" && (
                        <span className="text-sm font-bold text-green-600">
                          L. {(cashbackMap[cliente.id]?.balance ?? 0).toFixed(2)}
                        </span>
                      )}
                      {(model === "points" || model === "tiers" || model === "mixed") && (
                        <PointsCell pts={pointsMap[cliente.id]} />
                      )}
                      {model === "referrals" && (
                        <span className="text-xs text-navy/40">—</span>
                      )}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <Badge variante="navy" tamaño="sm">{cliente.total_canjes} canjes</Badge>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-navy/40">
                        <Calendar className="w-3 h-3" />
                        {formatFecha(cliente.ultima_visita ?? cliente.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-navy/20 hover:text-navy transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-navy/5 flex items-center justify-between">
            <p className="text-xs text-navy/40 font-medium">
              Mostrando {clientesFiltrados.length} de {clientes.length} clientes
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function LoyaltyCell({ stamps, required }: { stamps: number; required: number }) {
  const filled = Math.min(stamps, required);
  const total = Math.min(required, 10);
  return (
    <div className="flex items-center justify-center gap-0.5 flex-wrap max-w-[120px] mx-auto">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < filled ? "bg-coral" : "bg-navy/10"}`} />
      ))}
    </div>
  );
}

function PointsCell({ pts }: { pts?: PointsBalance }) {
  const tier = pts?.tier ?? "Bronce";
  const icon = TIER_ICONS[tier] ?? "🥉";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-bold text-navy">{(pts?.balance ?? 0).toLocaleString()} pts</span>
      <span className="text-[10px] text-navy/50">{icon} {tier}</span>
    </div>
  );
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" });
}

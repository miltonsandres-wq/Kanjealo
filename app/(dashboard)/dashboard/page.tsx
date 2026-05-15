"use client";

import React, { useEffect, useState } from "react";
import { Zap, Calendar, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNegocio } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";

interface ActividadItem {
  id: string;
  cliente: string;
  accion: string;
  fecha: string;
  tipo: "sello" | "canje" | "nuevo";
}

export default function DashboardPage() {
  const { negocio, cargando } = useNegocio();

  const [totalClientes, setTotalClientes] = useState<number | null>(null);
  const [totalSellos, setTotalSellos] = useState<number | null>(null);
  const [totalCanjes, setTotalCanjes] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<ActividadItem[]>([]);
  const [barras, setBarras] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [conteosReales, setConteosReales] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [etiquetasDias, setEtiquetasDias] = useState<string[]>([]);
  const [cargandoStats, setCargandoStats] = useState(true);

  useEffect(() => {
    if (!negocio) return;

    async function cargarStats() {
      setCargandoStats(true);

      // Fecha de hace 7 días en UTC para filtrar la semana
      const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString();

      const [
        { count: cClientes },
        { data: agregados },
        { data: sellosRecientes },
        { data: canjesRecientes },
        { data: sellosSemana },
      ] = await Promise.all([
          supabase
            .from("clientes")
            .select("*", { count: "exact", head: true })
            .eq("business_id", negocio!.id),

          supabase
            .from("clientes")
            .select("total_sellos, total_canjes")
            .eq("business_id", negocio!.id),

          supabase
            .from("sellos")
            .select("id, created_at, clientes(nombre)")
            .eq("business_id", negocio!.id)
            .order("created_at", { ascending: false })
            .limit(5),

          supabase
            .from("canjes")
            .select("id, created_at, clientes(nombre)")
            .eq("business_id", negocio!.id)
            .order("created_at", { ascending: false })
            .limit(3),

          // Query separado: TODOS los sellos de los últimos 7 días para la gráfica
          supabase
            .from("sellos")
            .select("created_at")
            .eq("business_id", negocio!.id)
            .gte("created_at", hace7dias),
        ]);

      setTotalClientes(cClientes ?? 0);
      setTotalSellos(agregados?.reduce((s, c) => s + (c.total_sellos ?? 0), 0) ?? 0);
      setTotalCanjes(agregados?.reduce((s, c) => s + (c.total_canjes ?? 0), 0) ?? 0);

      // Actividad reciente combinada
      const items: ActividadItem[] = [];

      sellosRecientes?.forEach((s: any) => {
        items.push({
          id: s.id,
          cliente: s.clientes?.nombre ?? "Cliente",
          accion: "Sello asignado",
          fecha: formatFecha(s.created_at),
          tipo: "sello",
        });
      });

      canjesRecientes?.forEach((c: any) => {
        items.push({
          id: c.id,
          cliente: c.clientes?.nombre ?? "Cliente",
          accion: "Premio canjeado",
          fecha: formatFecha(c.created_at),
          tipo: "canje",
        });
      });

      items.sort((a, b) => a.fecha < b.fecha ? 1 : -1);
      setActividadReciente(items.slice(0, 6));

      // Barras semanales: usar sellosSemana (todos, sin límite)
      const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const conteosPorDia = Array(7).fill(0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Generar etiquetas reales de los últimos 7 días (de más antiguo a hoy)
      const etiquetas = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoy);
        d.setDate(d.getDate() - (6 - i));
        return DIAS[d.getDay()];
      });
      setEtiquetasDias(etiquetas);

      sellosSemana?.forEach((s: any) => {
        const fechaSello = new Date(s.created_at);
        fechaSello.setHours(0, 0, 0, 0);
        const diffDias = Math.round((hoy.getTime() - fechaSello.getTime()) / 86400000);
        if (diffDias >= 0 && diffDias < 7) conteosPorDia[6 - diffDias]++;
      });

      setConteosReales([...conteosPorDia]);
      const max = Math.max(...conteosPorDia, 1);
      setBarras(conteosPorDia.map(v => v > 0 ? Math.round((v / max) * 85) + 15 : 4));

      setCargandoStats(false);
    }

    cargarStats();
  }, [negocio]);

  const fechaHoy = new Date().toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const estadisticas = [
    {
      titulo: "Clientes Totales",
      valor: cargandoStats ? "—" : String(totalClientes ?? 0),
      icono: "users",
      tendencia: undefined,
    },
    {
      titulo: "Sellos Entregados",
      valor: cargandoStats ? "—" : String(totalSellos ?? 0),
      icono: "award",
      tendencia: undefined,
    },
    {
      titulo: "Canjes Realizados",
      valor: cargandoStats ? "—" : String(totalCanjes ?? 0),
      icono: "zap",
      tendencia: undefined,
    },
    {
      titulo: "Programa",
      valor: negocio?.nombre_programa ?? "Sin programa",
      icono: "trending-up",
      tendencia: undefined,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
          <p className="text-navy/50">
            {negocio ? `${negocio.nombre} · ` : ""}Bienvenido de nuevo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-medium text-navy/60">
            <Calendar className="w-4 h-4" />
            <span>{fechaHoy}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {estadisticas.map((stat, i) => (
          <StatCard
            key={i}
            titulo={stat.titulo}
            valor={stat.valor}
            icono={stat.icono}
            tendencia={stat.tendencia}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actividad semanal */}
        <Card className="lg:col-span-2 p-8 border-none shadow-xl bg-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-navy">Sellos esta semana</h3>
            <Badge variante="navy">Últimos 7 días</Badge>
          </div>

          {cargandoStats ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-6 h-6 border-4 border-coral border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-[300px] w-full flex items-end gap-3 px-2">
              {barras.map((h, i) => {
                const count = conteosReales[i] ?? 0;
                const esHoy = i === 6;
                return (
                <div key={i} className="flex-grow flex flex-col items-center gap-3 group">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 relative ${
                      count > 0
                        ? esHoy ? "bg-coral" : "bg-coral/60 group-hover:bg-coral"
                        : "bg-navy/5"
                    }`}
                    style={{ height: `${h}%` }}
                  >
                    {count > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {count} {count === 1 ? "sello" : "sellos"}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${esHoy ? "text-coral" : "text-navy/30"}`}>
                    {etiquetasDias[i] ?? ""}
                  </span>
                </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Actividad reciente */}
        <Card className="p-8 border-none shadow-xl bg-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-navy">Actividad</h3>
            <button className="text-navy/30 hover:text-navy transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {cargandoStats ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-cream" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-cream rounded w-3/4" />
                    <div className="h-2 bg-cream rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : actividadReciente.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-navy/30">
              <Zap className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Sin actividad aún</p>
            </div>
          ) : (
            <div className="space-y-6">
              {actividadReciente.map((item) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center font-bold text-navy text-xs">
                      {item.cliente.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy group-hover:text-coral transition-colors">
                        {item.cliente}
                      </p>
                      <p className="text-[11px] text-navy/40">{item.accion} · {item.fecha}</p>
                    </div>
                  </div>
                  <Badge
                    variante={item.tipo === "sello" ? "verde" : item.tipo === "canje" ? "coral" : "navy"}
                    tamaño="sm"
                  >
                    {item.tipo === "sello" ? "+1" : item.tipo === "canje" ? "Canje" : "Nuevo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {actividadReciente.length > 0 && (
            <Button variante="ghost" className="w-full mt-8 text-navy/40 text-xs font-bold uppercase tracking-widest hover:text-navy">
              Ver todo el historial
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatFecha(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  if (diff < 1440) return `Hace ${Math.round(diff / 60)} h`;
  return `Hace ${Math.round(diff / 1440)} días`;
}

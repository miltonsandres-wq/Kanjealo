"use client";

import { useState, useTransition } from "react";
import { toggleNegocio } from "../_actions";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Loader2, Power, PowerOff } from "lucide-react";
import type { Negocio } from "@/lib/types";

interface Props {
  negocios: Negocio[];
}

export function BusinessTable({ negocios: inicial }: Props) {
  const [negocios, setNegocios] = useState(inicial);
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function handleToggle(negocio: Negocio) {
    const nuevoEstado = !negocio.esta_activo;
    setLoadingId(negocio.id);

    setNegocios((prev) =>
      prev.map((n) =>
        n.id === negocio.id ? { ...n, esta_activo: nuevoEstado } : n
      )
    );

    startTransition(async () => {
      try {
        await toggleNegocio(negocio.id, nuevoEstado);
      } catch {
        setNegocios((prev) =>
          prev.map((n) =>
            n.id === negocio.id ? { ...n, esta_activo: negocio.esta_activo } : n
          )
        );
      } finally {
        setLoadingId(null);
      }
    });
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-HN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (negocios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-navy/30">
        <Building2 className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-medium text-sm">Sin negocios registrados aún</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-navy/5">
            {["Negocio", "Plan", "Estado", "Registro", "Acción"].map((h) => (
              <th
                key={h}
                className="text-left py-3 px-6 text-xs font-bold uppercase tracking-widest text-navy/40"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {negocios.map((negocio) => {
            const isLoading = loadingId === negocio.id;
            return (
              <tr
                key={negocio.id}
                className="border-b border-navy/5 hover:bg-cream/60 transition-colors group"
              >
                {/* Nombre */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: negocio.color_marca ?? "#FF5C3A" }}
                    >
                      {negocio.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm group-hover:text-coral transition-colors">
                        {negocio.nombre}
                      </p>
                      <p className="text-xs text-navy/40">/{negocio.slug}</p>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="py-4 px-6">
                  <Badge variante={negocio.plan === "pro" ? "coral" : "gris"}>
                    {negocio.plan === "pro" ? "Pro" : "Basic"}
                  </Badge>
                </td>

                {/* Estado */}
                <td className="py-4 px-6">
                  <Badge variante={negocio.esta_activo ? "verde" : "gris"}>
                    {negocio.esta_activo ? "Activo" : "Pausado"}
                  </Badge>
                </td>

                {/* Fecha */}
                <td className="py-4 px-6">
                  <span className="flex items-center gap-1.5 text-sm text-navy/50">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatFecha(negocio.created_at)}
                  </span>
                </td>

                {/* Toggle */}
                <td className="py-4 px-6">
                  <button
                    onClick={() => handleToggle(negocio)}
                    disabled={isLoading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                      negocio.esta_activo
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : negocio.esta_activo ? (
                      <PowerOff className="w-3.5 h-3.5" />
                    ) : (
                      <Power className="w-3.5 h-3.5" />
                    )}
                    {negocio.esta_activo ? "Pausar" : "Activar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

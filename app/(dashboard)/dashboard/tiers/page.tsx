"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Users, Edit2, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNegocio, useLoyaltyConfig } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import type { TierDef } from "@/lib/types";
import { useRouter } from "next/navigation";

interface TierStats extends TierDef {
  count: number;
}

export default function TiersPage() {
  const router = useRouter();
  const { negocio, cargando: cargandoNegocio } = useNegocio();
  const { config, cargando: cargandoConfig, refetch } = useLoyaltyConfig(negocio?.id);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TierDef | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Redirect if model doesn't use tiers
  useEffect(() => {
    if (!cargandoConfig && config && config.model !== "tiers" && config.model !== "mixed") {
      router.replace("/dashboard/configuracion");
    }
  }, [config, cargandoConfig, router]);

  useEffect(() => {
    if (!negocio || !config) return;
    const tiers: TierDef[] = config.tiers_config ?? [];

    supabase
      .from("points_balance")
      .select("tier")
      .eq("business_id", negocio.id)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach(r => { counts[r.tier] = (counts[r.tier] ?? 0) + 1; });
        setTierStats(tiers.map(t => ({ ...t, count: counts[t.name] ?? 0 })));
      });
  }, [negocio, config]);

  const guardarTier = async () => {
    if (!editForm || !negocio || !config) return;
    setGuardando(true);
    const updated = config.tiers_config.map(t =>
      t.name === editForm.name ? editForm : t
    );
    await supabase
      .from("loyalty_config")
      .update({ tiers_config: updated })
      .eq("business_id", negocio.id);
    await refetch();
    setEditando(null);
    setEditForm(null);
    setGuardando(false);
  };

  const totalClientes = tierStats.reduce((s, t) => s + t.count, 0);

  if (cargandoNegocio || cargandoConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Niveles de Lealtad</h1>
          <p className="text-navy/50">Distribución de tus clientes por nivel.</p>
        </div>
        <Badge variante="coral">
          {totalClientes} clientes en el programa
        </Badge>
      </div>

      {/* Pirámide de niveles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...tierStats].reverse().map((tier) => {
          const pct = totalClientes > 0 ? Math.round((tier.count / totalClientes) * 100) : 0;
          return (
            <Card key={tier.name} className="p-6 border-none shadow-xl bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: tier.color + "20" }}
                >
                  <Trophy className="w-5 h-5" style={{ color: tier.color }} />
                </div>
                <span className="text-2xl font-extrabold text-navy">{tier.count}</span>
              </div>

              <div>
                <p className="font-bold text-navy text-lg">{tier.name}</p>
                <p className="text-xs text-navy/40">Desde {tier.min_points.toLocaleString()} pts</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-navy/40 font-bold">
                  <span>PARTICIPACIÓN</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-navy/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: tier.color }}
                  />
                </div>
              </div>

              <p className="text-xs text-navy/50 italic">{tier.perks}</p>

              <button
                onClick={() => { setEditando(tier.name); setEditForm({ ...tier }); }}
                className="flex items-center gap-1.5 text-xs text-navy/30 hover:text-coral transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Editar nivel
              </button>
            </Card>
          );
        })}
      </div>

      {/* Tabla de beneficios */}
      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <div className="p-6 border-b border-navy/5">
          <h3 className="font-bold text-navy text-lg">Tabla de Beneficios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy/5 text-navy/40 text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Nivel</th>
                <th className="px-6 py-4">Puntos mínimos</th>
                <th className="px-6 py-4">Beneficios</th>
                <th className="px-6 py-4">Clientes</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {tierStats.map(tier => (
                <tr key={tier.name} className="hover:bg-cream/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                      <span className="font-bold text-navy">{tier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-navy/60">
                    {tier.min_points.toLocaleString()} pts
                  </td>
                  <td className="px-6 py-4 text-sm text-navy/70">{tier.perks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-navy/60">
                      <Users className="w-4 h-4" />{tier.count}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { setEditando(tier.name); setEditForm({ ...tier }); }}
                      className="text-xs text-navy/30 hover:text-coral transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de edición */}
      {editando && editForm && (
        <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 border-none shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-navy text-lg">Editar nivel: {editando}</h3>
              <button onClick={() => { setEditando(null); setEditForm(null); }}
                className="text-navy/30 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy/50 uppercase tracking-widest">Puntos mínimos</label>
                <input type="number" value={editForm.min_points}
                  onChange={e => setEditForm({ ...editForm, min_points: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-cream rounded-xl border-none text-sm text-navy outline-none focus:ring-2 focus:ring-coral/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy/50 uppercase tracking-widest">Beneficios</label>
                <input type="text" value={editForm.perks}
                  onChange={e => setEditForm({ ...editForm, perks: e.target.value })}
                  className="w-full px-4 py-2.5 bg-cream rounded-xl border-none text-sm text-navy outline-none focus:ring-2 focus:ring-coral/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy/50 uppercase tracking-widest">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={editForm.color}
                    onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none" />
                  <span className="text-sm font-mono text-navy">{editForm.color}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variante="primario" cargando={guardando}
                icono={<Save className="w-4 h-4" />} onClick={guardarTier}>
                Guardar
              </Button>
              <Button variante="ghost" onClick={() => { setEditando(null); setEditForm(null); }}>
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

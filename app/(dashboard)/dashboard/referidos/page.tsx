"use client";

import React, { useEffect, useState } from "react";
import { Share2, Users, Check, Clock, Gift, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNegocio, useLoyaltyConfig } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface ReferralRow {
  id: string;
  referrer_nombre: string;
  referred_nombre: string;
  status: string;
  reward_given: boolean;
  created_at: string;
}

export default function ReferidosPage() {
  const router = useRouter();
  const { negocio, cargando: cargandoNegocio } = useNegocio();
  const { config, cargando: cargandoConfig, refetch } = useLoyaltyConfig(negocio?.id);

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [toggling, setToggling] = useState(false);

  const model = config?.model;
  const activo = model === "referrals" || model === "mixed";

  useEffect(() => {
    if (!cargandoConfig && config && model !== "referrals" && model !== "mixed") {
      router.replace("/dashboard/configuracion");
    }
  }, [config, cargandoConfig, model, router]);

  useEffect(() => {
    if (!negocio) return;

    supabase
      .from("referrals")
      .select("id, status, reward_given, created_at, referrer_id, referred_id")
      .eq("business_id", negocio.id)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data?.length) { setCargando(false); return; }

        const ids = [...new Set([...data.map(r => r.referrer_id), ...data.map(r => r.referred_id)])];
        const { data: clientesData } = await supabase
          .from("clientes").select("id, nombre").in("id", ids);

        const nameMap: Record<string, string> = {};
        clientesData?.forEach(c => { nameMap[c.id] = c.nombre; });

        setReferrals(data.map(r => ({
          id: r.id,
          referrer_nombre: nameMap[r.referrer_id] ?? "Desconocido",
          referred_nombre: nameMap[r.referred_id] ?? "Desconocido",
          status: r.status,
          reward_given: r.reward_given,
          created_at: r.created_at,
        })));
        setCargando(false);
      });
  }, [negocio]);

  const togglePrograma = async () => {
    if (!negocio || !config) return;
    setToggling(true);
    const newModel = activo ? "points" : "referrals";
    await supabase.from("loyalty_config").update({ model: newModel }).eq("business_id", negocio.id);
    await refetch();
    setToggling(false);
  };

  const rewarded = referrals.filter(r => r.reward_given).length;
  const pending = referrals.filter(r => !r.reward_given).length;
  const thisMonth = referrals.filter(r => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (cargandoNegocio || cargandoConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Programa de Referidos</h1>
          <p className="text-navy/50">Clientes que recomiendan tu negocio a amigos.</p>
        </div>
        <button
          onClick={togglePrograma}
          disabled={toggling}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activo ? "bg-coral text-white" : "bg-navy/10 text-navy/60 hover:bg-navy/20"
          }`}
        >
          {activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          Programa {activo ? "Activo" : "Inactivo"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Este mes", value: thisMonth, icon: Share2, color: "coral" },
          { label: "Recompensados", value: rewarded, icon: Gift, color: "green" },
          { label: "Pendientes", value: pending, icon: Clock, color: "navy" },
        ].map(s => (
          <Card key={s.label} className="p-6 border-none shadow-xl bg-white flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              s.color === "coral" ? "bg-coral/10" : s.color === "green" ? "bg-green-50" : "bg-navy/5"
            }`}>
              <s.icon className={`w-6 h-6 ${
                s.color === "coral" ? "text-coral" : s.color === "green" ? "text-green-500" : "text-navy/40"
              }`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-navy">{s.value}</p>
              <p className="text-xs text-navy/40 font-medium">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Config card */}
      {config && (
        <Card className="p-6 border-none shadow-sm bg-navy/5 flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-navy/70">
            <Gift className="w-4 h-4 text-coral" />
            <span>Quien refiere gana <strong className="text-navy">{config.referral_reward_referrer} pts</strong></span>
          </div>
          <div className="w-px h-5 bg-navy/10" />
          <div className="flex items-center gap-2 text-sm text-navy/70">
            <Users className="w-4 h-4 text-coral" />
            <span>Nuevo cliente recibe <strong className="text-navy">{config.referral_reward_new} pts</strong> de bienvenida</span>
          </div>
          <div className="ml-auto">
            <Button variante="ghost" tamaño="sm" onClick={() => router.push("/dashboard/configuracion")}>
              Editar
            </Button>
          </div>
        </Card>
      )}

      {/* Tabla de referidos */}
      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <div className="p-6 border-b border-navy/5">
          <h3 className="font-bold text-navy">Historial de Referidos</h3>
        </div>
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-navy/30">
            <Share2 className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">Aún no hay referidos registrados.</p>
            <p className="text-xs">Los referidos aparecen aquí cuando un cliente comparte su enlace personalizado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy/5 text-navy/40 text-[11px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Referidor</th>
                  <th className="px-6 py-4">Nuevo Cliente</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-cream/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-xs font-bold text-coral">
                          {r.referrer_nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-navy">{r.referrer_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center text-xs font-bold text-navy">
                          {r.referred_nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-navy">{r.referred_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {r.reward_given ? (
                        <Badge variante="verde" tamaño="sm">
                          <Check className="w-3 h-3 mr-1 inline" />Recompensado
                        </Badge>
                      ) : (
                        <Badge variante="navy" tamaño="sm">
                          <Clock className="w-3 h-3 mr-1 inline" />Pendiente
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-navy/40">
                      {new Date(r.created_at).toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

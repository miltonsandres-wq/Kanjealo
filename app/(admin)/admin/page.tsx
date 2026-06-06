import { supabaseAdmin } from "@/lib/supabase-admin";
import { BusinessTable } from "./_components/BusinessTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, PauseCircle, TrendingUp } from "lucide-react";
import type { Negocio } from "@/lib/types";

async function getNegocios(): Promise<Negocio[]> {
  const { data, error } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminPage() {
  const negocios = await getNegocios();

  const total = negocios.length;
  const activos = negocios.filter((n) => n.esta_activo).length;
  const pausados = total - activos;
  const planPro = negocios.filter((n) => n.plan === "pro").length;

  const stats = [
    { label: "Negocios totales", valor: total, icono: Building2, variante: "navy" as const },
    { label: "Activos", valor: activos, icono: CheckCircle2, variante: "verde" as const },
    { label: "Pausados", valor: pausados, icono: PauseCircle, variante: "amarillo" as const },
    { label: "Plan Pro", valor: planPro, icono: TrendingUp, variante: "coral" as const },
  ];

  const fechaHoy = new Date().toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy font-outfit">Resumen</h1>
          <p className="text-navy/50 mt-0.5">Vista general de todos los negocios en Kanjealo.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm font-medium text-navy/60">
          <span>{fechaHoy}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => {
          const colorMap = {
            navy: "bg-navy/5 text-navy",
            verde: "bg-emerald-50 text-emerald-600",
            amarillo: "bg-amber-50 text-amber-600",
            coral: "bg-coral/10 text-coral",
          };
          return (
            <Card key={s.label} hoverable className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-outfit text-navy/50">{s.label}</p>
                  <p className="text-3xl font-outfit font-bold text-coral">{s.valor}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[s.variante]}`}>
                  <s.icono className="w-5 h-5" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-coral/5 rounded-full" />
            </Card>
          );
        })}
      </div>

      {/* Tabla de negocios */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-navy/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy/40" />
            <h2 className="text-xl font-bold text-navy font-outfit">Negocios registrados</h2>
          </div>
          <Badge variante="navy">{total} en total</Badge>
        </div>
        <BusinessTable negocios={negocios} />
      </Card>
    </div>
  );
}

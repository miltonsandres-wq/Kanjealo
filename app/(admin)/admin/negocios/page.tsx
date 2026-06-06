import { supabaseAdmin } from "@/lib/supabase-admin";
import { BusinessTable } from "../_components/BusinessTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import type { Negocio } from "@/lib/types";

async function getNegocios(): Promise<Negocio[]> {
  const { data, error } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function NegociosPage() {
  const negocios = await getNegocios();
  const total = negocios.length;
  const activos = negocios.filter((n) => n.esta_activo).length;
  const pausados = total - activos;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy font-outfit">Negocios</h1>
          <p className="text-navy/50 mt-0.5">
            {activos} activos · {pausados} pausados
          </p>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-navy/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy/40" />
            <h2 className="text-xl font-bold text-navy font-outfit">
              Todos los negocios
            </h2>
          </div>
          <Badge variante="navy">{total} en total</Badge>
        </div>
        <BusinessTable negocios={negocios} />
      </Card>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarMensajeLoyaltyObject } from "@/lib/google-wallet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { sucursal_id } = await req.json();
  if (!sucursal_id) return NextResponse.json({ error: "Falta sucursal_id" }, { status: 400 });

  const { data: sucursal, error: errSucursal } = await supabase
    .from("sucursales")
    .select("id, nombre, business_id, mensaje_notificacion")
    .eq("id", sucursal_id)
    .single();

  if (errSucursal || !sucursal) {
    return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
  }
  if (!sucursal.mensaje_notificacion) {
    return NextResponse.json({ error: "La sucursal no tiene un mensaje configurado" }, { status: 400 });
  }

  const { data: negocio } = await supabase
    .from("negocios")
    .select("nombre")
    .eq("id", sucursal.business_id)
    .single();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id")
    .eq("business_id", sucursal.business_id);

  const header = `📍 ${negocio?.nombre ?? sucursal.nombre}`;

  const resultados = await Promise.allSettled(
    (clientes ?? []).map((c) =>
      enviarMensajeLoyaltyObject(c.id, header, sucursal.mensaje_notificacion)
    )
  );

  const enviados = resultados.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({
    total: clientes?.length ?? 0,
    enviados,
    fallidos: (clientes?.length ?? 0) - enviados,
  });
}

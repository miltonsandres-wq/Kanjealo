import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  const business_id = new URL(req.url).searchParams.get("business_id");
  if (!business_id) return NextResponse.json({ error: "Falta business_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("sucursales")
    .select("*")
    .eq("business_id", business_id)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sucursales: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { business_id, nombre, latitud, longitud, direccion, mensaje_notificacion } = body;

  if (!business_id || !nombre) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const { data, error } = await supabase
    .from("sucursales")
    .insert({ business_id, nombre, latitud, longitud, direccion, mensaje_notificacion, activa: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sucursal: data });
}

export async function PUT(req: NextRequest) {
  const { id, nombre, latitud, longitud, direccion, mensaje_notificacion, activa } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { data, error } = await supabase
    .from("sucursales")
    .update({ nombre, latitud, longitud, direccion, mensaje_notificacion, activa, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sucursal: data });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await supabase.from("sucursales").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

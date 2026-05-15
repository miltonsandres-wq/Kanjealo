import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// GET: listar todos los clientes del negocio o buscar por teléfono
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono");
  const business_id = searchParams.get("business_id");

  if (!business_id) {
    return NextResponse.json({ error: "Falta business_id" }, { status: 400 });
  }

  // Sin teléfono → devolver lista completa de clientes
  if (!telefono) {
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, total_sellos, total_canjes, ultima_visita")
      .eq("business_id", business_id)
      .order("nombre", { ascending: true });
    return NextResponse.json({ clientes: clientes ?? [] });
  }

  const soloDigitos = telefono.replace(/\D/g, "");

  // 1. Búsqueda exacta con business_id
  let { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, total_sellos, total_canjes, created_at, ultima_visita, business_id")
    .eq("business_id", business_id)
    .eq("telefono", telefono.trim())
    .maybeSingle();

  // 2. Fallback: buscar por teléfono sin filtro de negocio (debug + casos de business_id incorrecto)
  if (!cliente) {
    const { data: porTelefono } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, total_sellos, total_canjes, created_at, ultima_visita, business_id")
      .eq("telefono", telefono.trim())
      .maybeSingle();

    if (porTelefono) {
      console.warn(
        `[cliente GET] Encontrado por teléfono pero business_id no coincide. ` +
        `Buscado: ${business_id} | En DB: ${porTelefono.business_id}`
      );
      // Si el cliente existe pero con distinto business_id, lo devolvemos igual
      // (el cajero busca por teléfono, no por negocio en este contexto de debug)
      cliente = porTelefono;
    }
  }

  // 3. Fallback por dígitos (formatos distintos ej: "9844 4382" vs "98444382")
  if (!cliente && soloDigitos.length >= 7) {
    const { data: alt } = await supabase
      .from("clientes")
      .select("id, nombre, telefono, total_sellos, total_canjes, created_at, ultima_visita, business_id")
      .ilike("telefono", `%${soloDigitos}%`)
      .maybeSingle();
    if (alt) cliente = alt;
  }

  if (!cliente) {
    return NextResponse.json({ cliente: null });
  }

  // Usar el business_id real del cliente (puede diferir del param si hubo mismatch)
  const bid = (cliente as any).business_id ?? business_id;

  // Balance según modelo
  const [{ data: cashback }, { data: puntos }] = await Promise.all([
    supabase
      .from("cashback_balance")
      .select("balance, total_earned, total_redeemed")
      .eq("customer_id", cliente.id)
      .eq("business_id", bid)
      .maybeSingle(),
    supabase
      .from("points_balance")
      .select("balance, total_earned, total_redeemed, tier")
      .eq("customer_id", cliente.id)
      .eq("business_id", bid)
      .maybeSingle(),
  ]);

  // Historial reciente (últimas 8 operaciones)
  const [{ data: sellos }, { data: canjes }, { data: ptsTransactions }, { data: cbTransactions }] =
    await Promise.all([
      supabase
        .from("sellos")
        .select("id, created_at")
        .eq("customer_id", cliente.id)
        .eq("business_id", bid)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("canjes")
        .select("id, created_at")
        .eq("customer_id", cliente.id)
        .eq("business_id", bid)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("points_transactions")
        .select("id, type, points, description, created_at")
        .eq("customer_id", cliente.id)
        .eq("business_id", bid)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("cashback_transactions")
        .select("id, type, amount, purchase_amount, created_at")
        .eq("customer_id", cliente.id)
        .eq("business_id", bid)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  return NextResponse.json({
    cliente,
    cashback: cashback ?? null,
    puntos: puntos ?? null,
    historial: {
      sellos: sellos ?? [],
      canjes: canjes ?? [],
      puntos: ptsTransactions ?? [],
      cashback: cbTransactions ?? [],
    },
  });
}

// POST: registrar nuevo cliente
export async function POST(req: NextRequest) {
  const { nombre, telefono, business_id } = await req.json();

  if (!nombre || !telefono || !business_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from("clientes")
    .select("id")
    .eq("business_id", business_id)
    .eq("telefono", telefono)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Ya existe un cliente con ese teléfono" }, { status: 409 });
  }

  const telefonoNorm = telefono.trim().replace(/\s+/g, "");

  const { data: nuevo, error } = await supabase
    .from("clientes")
    .insert({
      business_id,
      nombre: nombre.trim(),
      telefono: telefonoNorm,
      total_sellos: 0,
      total_canjes: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[cliente POST insert]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cliente: nuevo });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usa anon key porque RLS está desactivado en negocios y cajeros
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// GET: obtener nombre del negocio por slug (para mostrar en login)
export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const { data: negocio, error } = await supabase
    .from("negocios")
    .select("id, nombre, nombre_programa, color_marca, descripcion_premio, sellos_requeridos")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[cajero/login GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!negocio) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  return NextResponse.json(negocio);
}

export async function POST(req: NextRequest) {
  const { slug, pin } = await req.json();

  if (!slug || !pin) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // Buscar negocio por slug
  const { data: negocio, error: errNegocio } = await supabase
    .from("negocios")
    .select("id, nombre, slug, sellos_requeridos, color_marca, plan")
    .eq("slug", slug)
    .maybeSingle();

  if (errNegocio) {
    console.error("[cajero/login POST negocio]", errNegocio.message);
    return NextResponse.json({ error: errNegocio.message }, { status: 500 });
  }
  if (!negocio) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  // Buscar cajero por PIN
  const { data: cajero, error: errCajero } = await supabase
    .from("cajeros")
    .select("id, nombre, pin_hash")
    .eq("business_id", negocio.id)
    .eq("pin_hash", pin)
    .eq("esta_activo", true)
    .maybeSingle();

  if (errCajero) {
    console.error("[cajero/login POST cajero]", errCajero.message);
    return NextResponse.json({ error: errCajero.message }, { status: 500 });
  }
  if (!cajero) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  // Configuración de fidelización
  const { data: loyaltyConfig } = await supabase
    .from("loyalty_config")
    .select("model, cashback_percent, points_per_lempira, referral_reward_referrer, referral_reward_new")
    .eq("business_id", negocio.id)
    .maybeSingle();

  return NextResponse.json({
    cajero: { id: cajero.id, nombre: cajero.nombre },
    negocio: {
      id: negocio.id,
      nombre: negocio.nombre,
      slug: negocio.slug,
      sellos_requeridos: negocio.sellos_requeridos,
      color_marca: negocio.color_marca,
    },
    model: loyaltyConfig?.model ?? "stamps",
    loyalty: loyaltyConfig,
  });
}

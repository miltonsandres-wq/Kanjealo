import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarUrlGoogleWallet } from "@/lib/google-wallet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  const business_id = searchParams.get("business_id");

  if (!client_id || !business_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const [
    { data: cliente },
    { data: negocio },
    { data: loyaltyConfig },
    { data: sucursales },
  ] = await Promise.all([
    supabase.from("clientes").select("id, nombre, total_sellos").eq("id", client_id).single(),
    supabase
      .from("negocios")
      .select("id, nombre, nombre_programa, color_marca, sellos_requeridos")
      .eq("id", business_id)
      .single(),
    supabase
      .from("loyalty_config")
      .select("model")
      .eq("business_id", business_id)
      .maybeSingle(),
    supabase
      .from("sucursales")
      .select("latitud, longitud, mensaje_notificacion")
      .eq("business_id", business_id)
      .eq("activa", true),
  ]);

  if (!cliente || !negocio) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    const url = generarUrlGoogleWallet({
      businessId: negocio.id,
      businessNombre: negocio.nombre,
      programaNombre: negocio.nombre_programa ?? negocio.nombre,
      colorMarca: negocio.color_marca ?? "#FF5C3A",
      clientId: cliente.id,
      clienteNombre: cliente.nombre,
      totalSellos: cliente.total_sellos ?? 0,
      sellosRequeridos: negocio.sellos_requeridos ?? 10,
      model: loyaltyConfig?.model ?? "stamps",
      sucursales: sucursales ?? [],
    });

    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Error generando URL" }, { status: 500 });
  }
}

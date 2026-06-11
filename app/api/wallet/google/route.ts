import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarUrlGoogleWallet } from "@/lib/google-wallet";
import { generateAndUploadHeroImage } from "@/lib/card-image-server";

export const runtime = "nodejs";

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
    { data: cliente, error: errCliente },
    { data: negocio, error: errNegocio },
    { data: loyaltyConfig },
    { data: sucursales },
  ] = await Promise.all([
    supabase.from("clientes").select("id, nombre, total_sellos").eq("id", client_id).maybeSingle(),
    supabase
      .from("negocios")
      .select("id, nombre, nombre_programa, color_marca, sellos_requeridos, descripcion_premio, logo_url, stamp_icon, stamp_filled_color, stamp_empty_color")
      .eq("id", business_id)
      .maybeSingle(),
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

  if (errCliente || errNegocio) {
    console.error("[wallet/google] DB error:", { errCliente, errNegocio, client_id, business_id });
    return NextResponse.json({ error: "Error de base de datos", clienteErr: errCliente?.message, negocioErr: errNegocio?.message }, { status: 500 });
  }

  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado", client_id }, { status: 404 });
  }
  if (!negocio) {
    return NextResponse.json({ error: "Negocio no encontrado", business_id }, { status: 404 });
  }

  // Parámetros base de la imagen — se genera aquí en el route handler donde ImageResponse funciona
  const imageParams = {
    nombrePrograma:    negocio.nombre_programa ?? negocio.nombre,
    nombreNegocio:     negocio.nombre,
    colorMarca:        negocio.color_marca ?? "#FF5C3A",
    logoUrl:           negocio.logo_url ?? undefined,
    stampIcon:         negocio.stamp_icon ?? "circle",
    stampFilledColor:  negocio.stamp_filled_color ?? undefined,
    sellosRequeridos:  negocio.sellos_requeridos ?? 10,
    descripcionPremio: negocio.descripcion_premio ?? undefined,
  };

  // Generar ambas imágenes en paralelo aquí en el route handler (contexto correcto para ImageResponse)
  const [classHeroUrl, heroImageUrl] = await Promise.all([
    generateAndUploadHeroImage(
      { ...imageParams, totalSellos: 0 },
      `card-images/${negocio.id}/hero`,
    ).catch((e) => {
      console.error("[wallet/google] Error imagen clase:", e instanceof Error ? e.message : e);
      return null;
    }),
    generateAndUploadHeroImage(
      { ...imageParams, totalSellos: cliente.total_sellos ?? 0 },
      `card-images/${negocio.id}/${cliente.id}`,
    ).catch((e) => {
      console.error("[wallet/google] Error imagen cliente:", e instanceof Error ? e.message : e);
      return null;
    }),
  ]);

  console.log("[wallet/google] Hero images:", { classHeroUrl, heroImageUrl });

  const debug = searchParams.get("debug") === "1";

  try {
    const { url, payload } = await generarUrlGoogleWallet({
      businessId:       negocio.id,
      businessNombre:   negocio.nombre,
      programaNombre:   negocio.nombre_programa ?? negocio.nombre,
      colorMarca:       negocio.color_marca ?? "#FF5C3A",
      logoUrl:          negocio.logo_url ?? undefined,
      stampIcon:        negocio.stamp_icon ?? "circle",
      stampFilledColor: negocio.stamp_filled_color ?? undefined,
      stampEmptyColor:  negocio.stamp_empty_color ?? undefined,
      clientId:         cliente.id,
      clienteNombre:    cliente.nombre,
      totalSellos:      cliente.total_sellos ?? 0,
      sellosRequeridos: negocio.sellos_requeridos ?? 10,
      model:            loyaltyConfig?.model ?? "stamps",
      descripcionPremio: negocio.descripcion_premio ?? undefined,
      sucursales:       sucursales ?? [],
      classHeroUrl,
      heroImageUrl,
    });

    if (debug) return NextResponse.json({ classHeroUrl, heroImageUrl, payload });
    return NextResponse.redirect(url);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generando URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

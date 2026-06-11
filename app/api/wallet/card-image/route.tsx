import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateAndUploadHeroImage } from "@/lib/card-image-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const customerId = searchParams.get("customer_id");

  if (!businessId) {
    return NextResponse.json({ error: "business_id requerido" }, { status: 400 });
  }

  const { data: negocio, error: negErr } = await supabaseAdmin
    .from("negocios")
    .select("id, nombre, nombre_programa, color_marca, sellos_requeridos, descripcion_premio, logo_url, stamp_icon, stamp_filled_color")
    .eq("id", businessId)
    .single();

  if (negErr || !negocio) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  let totalSellos = 0;
  if (customerId) {
    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("total_sellos")
      .eq("id", customerId)
      .single();
    totalSellos = cliente?.total_sellos ?? 0;
  }

  const publicId = customerId
    ? `card-images/${businessId}/${customerId}`
    : `card-images/${businessId}/hero`;

  const url = await generateAndUploadHeroImage(
    {
      nombrePrograma:    negocio.nombre_programa,
      nombreNegocio:     negocio.nombre,
      colorMarca:        negocio.color_marca,
      logoUrl:           negocio.logo_url,
      stampIcon:         negocio.stamp_icon ?? "circle",
      stampFilledColor:  negocio.stamp_filled_color,
      totalSellos,
      sellosRequeridos:  negocio.sellos_requeridos,
      descripcionPremio: negocio.descripcion_premio,
    },
    publicId,
  );

  return NextResponse.json({ url });
}

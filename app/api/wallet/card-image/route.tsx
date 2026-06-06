import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateCardImage } from "@/lib/card-image-generator";

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
    .select("*")
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

  const { data: loyaltyConfig } = await supabaseAdmin
    .from("loyalty_config")
    .select("model")
    .eq("business_id", businessId)
    .maybeSingle();

  const buffer = await generateCardImage({
    nombrePrograma: negocio.nombre_programa,
    nombreNegocio: negocio.nombre,
    colorMarca: negocio.color_marca,
    logoUrl: negocio.logo_url,
    stampIcon: negocio.stamp_icon ?? "circle",
    stampFilledColor: negocio.stamp_filled_color ?? "#FF5C3A",
    stampEmptyColor: negocio.stamp_empty_color ?? "rgba(255,255,255,0.2)",
    totalSellos,
    sellosRequeridos: negocio.sellos_requeridos,
    descripcionPremio: negocio.descripcion_premio,
    model: loyaltyConfig?.model ?? "stamps",
  });

  const fileName = customerId
    ? `${businessId}/${customerId}-${Date.now()}.png`
    : `${businessId}/hero.png`;

  // Borrar imagen anterior del cliente antes de subir la nueva
  if (customerId) {
    const { data: existing } = await supabaseAdmin.storage
      .from("card-images")
      .list(businessId, { search: customerId });
    if (existing && existing.length > 0) {
      await supabaseAdmin.storage
        .from("card-images")
        .remove(existing.map((f) => `${businessId}/${f.name}`));
    }
  }

  const { error: uploadErr } = await supabaseAdmin.storage
    .from("card-images")
    .upload(fileName, buffer, { contentType: "image/png", upsert: true, cacheControl: "60" });

  if (uploadErr) {
    console.error("[card-image] Upload error:", uploadErr.message);
    return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from("card-images").getPublicUrl(fileName);
  return NextResponse.json({ url: urlData.publicUrl });
}

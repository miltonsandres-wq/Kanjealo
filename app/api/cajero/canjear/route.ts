import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { actualizarPaseGoogleWallet } from "@/lib/google-wallet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// Confirma la entrega del premio de la tarjeta de sellos y resetea el
// contador. Es una acción manual del cajero (separada de /api/cajero/sello)
// para que la tarjeta no se vacíe sola sin que nadie haya entregado el regalo.
export async function POST(req: NextRequest) {
  const { customer_id, business_id } = await req.json();

  if (!customer_id || !business_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    const [{ data: cliente }, { data: negocio }, { data: loyaltyConfig }] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nombre, total_sellos, total_canjes")
        .eq("id", customer_id)
        .eq("business_id", business_id)
        .single(),
      supabase
        .from("negocios")
        .select("id, nombre, nombre_programa, color_marca, sellos_requeridos, descripcion_premio, stamp_icon, stamp_filled_color")
        .eq("id", business_id)
        .single(),
      supabase
        .from("loyalty_config")
        .select("model")
        .eq("business_id", business_id)
        .maybeSingle(),
    ]);

    if (!cliente || !negocio) {
      return NextResponse.json({ error: "Cliente o negocio no encontrado" }, { status: 404 });
    }

    if (cliente.total_sellos < negocio.sellos_requeridos) {
      return NextResponse.json(
        { error: "El cliente todavía no completa los sellos requeridos" },
        { status: 400 }
      );
    }

    await supabase.from("canjes").insert({ customer_id, business_id });

    const total_canjes = cliente.total_canjes + 1;
    await supabase
      .from("clientes")
      .update({
        total_sellos: 0,
        total_canjes,
        ultima_visita: new Date().toISOString(),
      })
      .eq("id", customer_id);

    after(() =>
      actualizarPaseGoogleWallet({
        businessId: business_id,
        businessNombre: negocio.nombre,
        programaNombre: negocio.nombre_programa ?? negocio.nombre,
        colorMarca: negocio.color_marca ?? "#FF5C3A",
        clientId: customer_id,
        clienteNombre: cliente.nombre,
        totalSellos: 0,
        sellosRequeridos: negocio.sellos_requeridos,
        model: loyaltyConfig?.model ?? "stamps",
        descripcionPremio: negocio.descripcion_premio ?? undefined,
        stampIcon: negocio.stamp_icon ?? undefined,
        stampFilledColor: negocio.stamp_filled_color ?? undefined,
        sucursales: [],
      }).catch((e) => console.error("[canjear] actualizarPaseGoogleWallet falló:", e))
    );

    return NextResponse.json({
      nuevos_sellos: 0,
      sellos_requeridos: negocio.sellos_requeridos,
      total_canjes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

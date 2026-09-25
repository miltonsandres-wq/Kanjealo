import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { actualizarPaseGoogleWallet } from "@/lib/google-wallet";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { customer_id, business_id, cajero_id } = await req.json();

  if (!customer_id || !business_id || !cajero_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    // Obtener datos actuales del cliente y negocio
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

    if (cliente.total_sellos >= negocio.sellos_requeridos) {
      return NextResponse.json(
        { error: "El cliente ya completó su tarjeta. Canjea el premio antes de seguir sellando." },
        { status: 409 }
      );
    }

    const { data: cajero } = await supabase
      .from("cajeros")
      .select("pin_hash")
      .eq("id", cajero_id)
      .single();

    // Registrar sello
    await supabase.from("sellos").insert({
      customer_id,
      business_id,
      cashier_pin: cajero?.pin_hash ?? null,
    });

    const nuevos_sellos = cliente.total_sellos + 1;
    const sellos_requeridos = negocio.sellos_requeridos;
    const tarjeta_completa = nuevos_sellos >= sellos_requeridos;

    const walletParams = {
      businessId: business_id,
      businessNombre: negocio.nombre,
      programaNombre: negocio.nombre_programa ?? negocio.nombre,
      colorMarca: negocio.color_marca ?? "#FF5C3A",
      clientId: customer_id,
      clienteNombre: cliente.nombre,
      sellosRequeridos: sellos_requeridos,
      model: loyaltyConfig?.model ?? "stamps",
      descripcionPremio: negocio.descripcion_premio ?? undefined,
      stampIcon: negocio.stamp_icon ?? undefined,
      stampFilledColor: negocio.stamp_filled_color ?? undefined,
      sucursales: [],
    };

    // El premio ya NO se canjea solo al llegar al total: la tarjeta se queda
    // completa (p.ej. 10/10) hasta que el cajero confirme la entrega del
    // regalo desde el panel (ver /api/cajero/canjear). Así el cliente sigue
    // viendo su tarjeta llena en Google Wallet en vez de que se resetee sin
    // aviso.
    await supabase
      .from("clientes")
      .update({
        total_sellos: nuevos_sellos,
        ultima_visita: new Date().toISOString(),
      })
      .eq("id", customer_id);

    // Actualizar pase Google Wallet en background. `after()` mantiene viva
    // la función serverless hasta que esta promesa termine, en vez de
    // dejarla morir a mitad de camino apenas se envía la respuesta.
    after(() =>
      actualizarPaseGoogleWallet({ ...walletParams, totalSellos: nuevos_sellos }).catch((e) =>
        console.error("[sello] actualizarPaseGoogleWallet falló:", e)
      )
    );

    return NextResponse.json({
      nuevos_sellos,
      sellos_requeridos,
      tarjeta_completa,
      total_canjes: cliente.total_canjes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

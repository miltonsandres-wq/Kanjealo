import { NextRequest, NextResponse } from "next/server";
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
        .select("id, nombre, nombre_programa, color_marca, sellos_requeridos, descripcion_premio")
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
    const premio_listo = nuevos_sellos >= sellos_requeridos;

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
      sucursales: [],
    };

    if (premio_listo) {
      await supabase.from("canjes").insert({ customer_id, business_id });
      await supabase
        .from("clientes")
        .update({
          total_sellos: 0,
          total_canjes: cliente.total_canjes + 1,
          ultima_visita: new Date().toISOString(),
        })
        .eq("id", customer_id);

      // Actualizar pase Google Wallet en background
      actualizarPaseGoogleWallet({ ...walletParams, totalSellos: 0 }).catch(() => {});

      return NextResponse.json({
        nuevos_sellos: 0,
        sellos_requeridos,
        premio: true,
        total_canjes: cliente.total_canjes + 1,
      });
    }

    await supabase
      .from("clientes")
      .update({
        total_sellos: nuevos_sellos,
        ultima_visita: new Date().toISOString(),
      })
      .eq("id", customer_id);

    // Actualizar pase Google Wallet en background
    actualizarPaseGoogleWallet({ ...walletParams, totalSellos: nuevos_sellos }).catch(() => {});

    return NextResponse.json({
      nuevos_sellos,
      sellos_requeridos,
      premio: false,
      total_canjes: cliente.total_canjes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

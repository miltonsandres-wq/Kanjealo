import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cancelarSuscripcion } from "@/lib/paypal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { business_id } = await req.json();
  if (!business_id) {
    return NextResponse.json({ error: "Falta business_id" }, { status: 400 });
  }

  try {
    const { data: negocio } = await supabase
      .from("negocios")
      .select("paypal_subscription_id")
      .eq("id", business_id)
      .single();

    if (!negocio?.paypal_subscription_id) {
      return NextResponse.json({ error: "Este negocio no tiene una suscripción activa" }, { status: 400 });
    }

    await cancelarSuscripcion(negocio.paypal_subscription_id, "Cancelado por el dueño desde el panel");

    // El webhook (BILLING.SUBSCRIPTION.CANCELLED) también actualizará esto,
    // pero se refleja de inmediato para que el panel no espere.
    await supabase
      .from("negocios")
      .update({ esta_activo: false })
      .eq("id", business_id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

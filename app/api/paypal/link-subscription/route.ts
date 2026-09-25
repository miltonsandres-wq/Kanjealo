import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerSuscripcion } from "@/lib/paypal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// Se llama desde el dashboard justo despues de que el dueño aprueba el
// checkout de PayPal (onApprove del botón). Guarda el ID de inmediato para
// que el negocio quede activo sin esperar al webhook, que de todas formas
// confirma/corrige el estado despues (ver app/api/paypal/webhook).
export async function POST(req: NextRequest) {
  const { business_id, subscription_id } = await req.json();

  if (!business_id || !subscription_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    const suscripcion = await obtenerSuscripcion(subscription_id);

    if (suscripcion.status !== "ACTIVE" && suscripcion.status !== "APPROVED") {
      return NextResponse.json(
        { error: `La suscripción no está activa (estado: ${suscripcion.status})` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("negocios")
      .update({
        paypal_subscription_id: subscription_id,
        plan: "pro",
        esta_activo: true,
      })
      .eq("id", business_id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

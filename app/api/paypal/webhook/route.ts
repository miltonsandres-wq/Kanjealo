import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verificarWebhook } from "@/lib/paypal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export const runtime = "nodejs";

// PayPal manda estos eventos a medida que cambia el estado de una
// suscripción. Se resuelve el plan del negocio dueño de subscription.id
// (guardado antes en negocios.paypal_subscription_id al aprobar el checkout).
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const event = JSON.parse(rawBody);

  const verificado = await verificarWebhook(
    {
      transmissionId: req.headers.get("paypal-transmission-id") ?? "",
      transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
      certUrl: req.headers.get("paypal-cert-url") ?? "",
      authAlgo: req.headers.get("paypal-auth-algo") ?? "",
      transmissionSig: req.headers.get("paypal-transmission-sig") ?? "",
    },
    event
  ).catch(() => false);

  if (!verificado) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const subscriptionId: string | undefined = event.resource?.id;
  if (!subscriptionId) {
    return NextResponse.json({ ok: true }); // evento sin suscripción, se ignora
  }

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      await supabase
        .from("negocios")
        .update({ esta_activo: true })
        .eq("paypal_subscription_id", subscriptionId);
      break;

    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED":
      await supabase
        .from("negocios")
        .update({ esta_activo: false })
        .eq("paypal_subscription_id", subscriptionId);
      break;

    default:
      break;
  }

  return NextResponse.json({ ok: true });
}

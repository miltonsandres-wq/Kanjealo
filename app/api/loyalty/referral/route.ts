import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// POST: generar referido (llamado cuando cliente quiere compartir su link)
export async function POST(req: NextRequest) {
  const { referrer_id, business_id, slug } = await req.json();

  if (!referrer_id || !business_id || !slug) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const referral_url = `https://kanjealo.hn/c/${slug}?ref=${referrer_id}`;
  return NextResponse.json({ referral_url });
}

// PUT: completar referido cuando nuevo cliente se registra con ?ref=
export async function PUT(req: NextRequest) {
  const { referrer_id, referred_id, business_id } = await req.json();

  if (!referrer_id || !referred_id || !business_id) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    // Verificar que no existe ya este referido
    const { data: existing } = await supabaseAdmin
      .from("referrals")
      .select("id, status")
      .eq("referrer_id", referrer_id)
      .eq("referred_id", referred_id)
      .maybeSingle();

    if (existing?.status === "rewarded") {
      return NextResponse.json({ message: "Referido ya recompensado" });
    }

    const { data: cfg } = await supabaseAdmin
      .from("loyalty_config")
      .select("referral_reward_referrer, referral_reward_new")
      .eq("business_id", business_id)
      .single();

    if (!cfg) return NextResponse.json({ error: "Config no encontrada" }, { status: 404 });

    // Insertar o actualizar referido
    if (existing) {
      await supabaseAdmin
        .from("referrals")
        .update({ status: "rewarded", reward_given: true })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("referrals").insert({
        referrer_id, referred_id, business_id, status: "rewarded", reward_given: true,
      });
    }

    // Dar puntos al referrer
    await darPuntos(referrer_id, business_id, cfg.referral_reward_referrer, "Recompensa por referir un amigo");
    // Dar puntos al nuevo cliente
    await darPuntos(referred_id, business_id, cfg.referral_reward_new, "Bienvenida — referido por un amigo");

    return NextResponse.json({
      referrer_points: cfg.referral_reward_referrer,
      referred_points: cfg.referral_reward_new,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function darPuntos(customer_id: string, business_id: string, points: number, description: string) {
  await supabaseAdmin.from("points_transactions").insert({
    customer_id, business_id, type: "referral", points, description,
  });

  const { data: bal } = await supabaseAdmin
    .from("points_balance")
    .select("id, balance, total_earned")
    .eq("customer_id", customer_id)
    .eq("business_id", business_id)
    .maybeSingle();

  if (bal) {
    await supabaseAdmin
      .from("points_balance")
      .update({ balance: bal.balance + points, total_earned: bal.total_earned + points, updated_at: new Date().toISOString() })
      .eq("id", bal.id);
  } else {
    await supabaseAdmin.from("points_balance").insert({
      customer_id, business_id, balance: points, total_earned: points, total_redeemed: 0, tier: "Bronce",
    });
  }
}

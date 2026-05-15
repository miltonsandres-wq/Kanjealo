import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { customer_id, business_id, purchase_amount, model } = await req.json();

  if (!customer_id || !business_id || !model) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    if (model === "stamps") {
      return NextResponse.json({ message: "Usar endpoint de sellos" }, { status: 200 });
    }

    if (model === "cashback") {
      const { data: cfg } = await supabaseAdmin
        .from("loyalty_config")
        .select("cashback_percent, cashback_min_purchase")
        .eq("business_id", business_id)
        .single();

      if (!cfg) return NextResponse.json({ error: "Config no encontrada" }, { status: 404 });
      if ((purchase_amount ?? 0) < cfg.cashback_min_purchase) {
        return NextResponse.json({ error: "Compra por debajo del mínimo" }, { status: 400 });
      }

      const earned = parseFloat(((purchase_amount * cfg.cashback_percent) / 100).toFixed(2));

      await supabaseAdmin.from("cashback_transactions").insert({
        customer_id, business_id, type: "earn", amount: earned, purchase_amount,
      });

      const { data: existing } = await supabaseAdmin
        .from("cashback_balance")
        .select("id, balance, total_earned")
        .eq("customer_id", customer_id)
        .eq("business_id", business_id)
        .maybeSingle();

      let new_balance: number;
      if (existing) {
        new_balance = parseFloat((existing.balance + earned).toFixed(2));
        await supabaseAdmin
          .from("cashback_balance")
          .update({ balance: new_balance, total_earned: existing.total_earned + earned, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        new_balance = earned;
        await supabaseAdmin.from("cashback_balance").insert({
          customer_id, business_id, balance: earned, total_earned: earned, total_redeemed: 0,
        });
      }

      return NextResponse.json({ earned, new_balance });
    }

    if (model === "points" || model === "mixed" || model === "tiers") {
      const { data: cfg } = await supabaseAdmin
        .from("loyalty_config")
        .select("points_per_lempira, tiers_config")
        .eq("business_id", business_id)
        .single();

      if (!cfg) return NextResponse.json({ error: "Config no encontrada" }, { status: 404 });

      const earned = Math.floor((purchase_amount ?? 0) * cfg.points_per_lempira);

      const { data: existing } = await supabaseAdmin
        .from("points_balance")
        .select("id, balance, total_earned, tier")
        .eq("customer_id", customer_id)
        .eq("business_id", business_id)
        .maybeSingle();

      const prev_balance = existing?.balance ?? 0;
      const prev_tier = existing?.tier ?? "Bronce";
      const new_balance = prev_balance + earned;

      // Determine new tier
      const tiers: { name: string; min_points: number }[] = cfg.tiers_config ?? [];
      const sorted = [...tiers].sort((a, b) => b.min_points - a.min_points);
      const new_tier = sorted.find(t => new_balance >= t.min_points)?.name ?? "Bronce";
      const tier_up = new_tier !== prev_tier;

      // Tier bonus
      let bonus = 0;
      if (tier_up) {
        bonus = Math.floor(earned * 0.1);
        await supabaseAdmin.from("points_transactions").insert({
          customer_id, business_id, type: "tier_bonus",
          points: bonus, description: `Bono por subir a ${new_tier}`,
        });
      }

      await supabaseAdmin.from("points_transactions").insert({
        customer_id, business_id, type: "earn",
        points: earned, description: `Compra de L. ${purchase_amount}`,
      });

      if (existing) {
        await supabaseAdmin
          .from("points_balance")
          .update({
            balance: new_balance + bonus,
            total_earned: existing.total_earned + earned + bonus,
            tier: new_tier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("points_balance").insert({
          customer_id, business_id,
          balance: new_balance + bonus,
          total_earned: earned + bonus,
          total_redeemed: 0,
          tier: new_tier,
        });
      }

      return NextResponse.json({ earned, bonus, new_balance: new_balance + bonus, tier: new_tier, tier_up });
    }

    return NextResponse.json({ error: "Modelo no soportado" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

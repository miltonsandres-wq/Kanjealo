import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { customer_id, business_id, amount, model } = await req.json();

  if (!customer_id || !business_id || !model) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  try {
    if (model === "cashback") {
      const { data: bal } = await supabaseAdmin
        .from("cashback_balance")
        .select("id, balance, total_redeemed")
        .eq("customer_id", customer_id)
        .eq("business_id", business_id)
        .maybeSingle();

      if (!bal || bal.balance < amount) {
        return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
      }

      const new_balance = parseFloat((bal.balance - amount).toFixed(2));

      await supabaseAdmin.from("cashback_transactions").insert({
        customer_id, business_id, type: "redeem", amount, purchase_amount: null,
      });

      await supabaseAdmin
        .from("cashback_balance")
        .update({ balance: new_balance, total_redeemed: bal.total_redeemed + amount, updated_at: new Date().toISOString() })
        .eq("id", bal.id);

      return NextResponse.json({ redeemed: amount, new_balance });
    }

    if (model === "points" || model === "mixed" || model === "tiers") {
      const { data: bal } = await supabaseAdmin
        .from("points_balance")
        .select("id, balance, total_redeemed")
        .eq("customer_id", customer_id)
        .eq("business_id", business_id)
        .maybeSingle();

      if (!bal || bal.balance < amount) {
        return NextResponse.json({ error: "Puntos insuficientes" }, { status: 400 });
      }

      const new_balance = bal.balance - amount;

      await supabaseAdmin.from("points_transactions").insert({
        customer_id, business_id, type: "redeem",
        points: -amount, description: "Canje de puntos",
      });

      await supabaseAdmin
        .from("points_balance")
        .update({ balance: new_balance, total_redeemed: bal.total_redeemed + amount, updated_at: new Date().toISOString() })
        .eq("id", bal.id);

      return NextResponse.json({ redeemed: amount, new_balance });
    }

    return NextResponse.json({ error: "Modelo no soportado" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

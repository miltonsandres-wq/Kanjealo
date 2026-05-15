import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

// GET: obtener modelo de fidelización actual del negocio
export async function GET(req: NextRequest) {
  const business_id = new URL(req.url).searchParams.get("business_id");
  if (!business_id) return NextResponse.json({ error: "Falta business_id" }, { status: 400 });

  const { data } = await supabase
    .from("loyalty_config")
    .select("model, cashback_percent, points_per_lempira, referral_reward_referrer, referral_reward_new")
    .eq("business_id", business_id)
    .maybeSingle();

  return NextResponse.json({
    model: data?.model ?? "stamps",
    loyalty: data ?? null,
  });
}

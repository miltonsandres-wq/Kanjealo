import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  const business_id = searchParams.get("business_id");

  const ISSUER_ID    = process.env.GOOGLE_WALLET_ISSUER_ID;
  const CLIENT_EMAIL = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const PRIVATE_KEY  = process.env.GOOGLE_WALLET_PRIVATE_KEY;

  // Mostrar variables de entorno (sin exponer la clave privada completa)
  const envCheck = {
    ISSUER_ID: ISSUER_ID ?? "❌ NO CONFIGURADA",
    CLIENT_EMAIL: CLIENT_EMAIL ?? "❌ NO CONFIGURADA",
    PRIVATE_KEY_SET: PRIVATE_KEY ? `✓ ${PRIVATE_KEY.length} chars` : "❌ NO CONFIGURADA",
    PRIVATE_KEY_STARTS: PRIVATE_KEY?.substring(0, 40) ?? "N/A",
    APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "❌ NO CONFIGURADA",
  };

  if (!client_id || !business_id) {
    return NextResponse.json({ envCheck, error: "Pasa client_id y business_id como parámetros" });
  }

  const [{ data: cliente }, { data: negocio }, { data: loyaltyConfig }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, total_sellos").eq("id", client_id).single(),
    supabase.from("negocios").select("id, nombre, nombre_programa, color_marca, sellos_requeridos").eq("id", business_id).single(),
    supabase.from("loyalty_config").select("model").eq("business_id", business_id).maybeSingle(),
  ]);

  const classId  = `${ISSUER_ID}.${(negocio?.id ?? "").replace(/[^a-zA-Z0-9]/g, "")}`;
  const objectId = `${ISSUER_ID}.${(cliente?.id ?? "").replace(/[^a-zA-Z0-9]/g, "")}`;

  const payload = {
    iss: CLIENT_EMAIL,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [process.env.NEXT_PUBLIC_APP_URL ?? "https://kanjealo.hn", "http://localhost:3000"],
    payload: {
      loyaltyClasses: [{
        id: classId,
        issuerName: negocio?.nombre ?? "?",
        programName: negocio?.nombre_programa ?? negocio?.nombre ?? "?",
        reviewStatus: "UNDER_REVIEW",
        hexBackgroundColor: "#FF5C3A",
        multipleDevicesAndHoldersAllowedStatus: "ONE_USER_ALL_DEVICES",
        rewardsTiers: [{ tier: "Preferente", tierPoints: `${negocio?.sellos_requeridos ?? 10}` }],
      }],
      loyaltyObjects: [{
        id: objectId,
        classId,
        state: "ACTIVE",
        accountId: cliente?.id ?? "?",
        accountName: cliente?.nombre ?? "?",
        loyaltyPoints: { balance: { int: cliente?.total_sellos ?? 0 }, label: "Sellos" },
        barcode: { type: "QR_CODE", value: `kj:id:${cliente?.id}`, alternateText: cliente?.nombre ?? "?" },
      }],
    },
  };

  let tokenInfo: Record<string, unknown> = { error: "No se pudo firmar" };
  try {
    const key = (PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
    const token = jwt.sign(payload, key, { algorithm: "RS256" });
    tokenInfo = {
      ok: true,
      token_length: token.length,
      save_url: `https://pay.google.com/gp/v/save/${token}`,
    };
  } catch (e: unknown) {
    tokenInfo = { error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ envCheck, payload, tokenInfo, dbResults: { cliente, negocio, loyaltyConfig } });
}

import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { v2 as cloudinary } from "cloudinary";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { STAMP_ICONS } from "@/lib/stamp-icons";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const W = 1032;
const H = 336;

function darkenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const d = (v: number) =>
    Math.max(0, Math.round(v * (1 - amount))).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

// Posiciones diagonales fijas para hasta 10 sellos (x, y, size en px)
const SCATTER: { x: number; y: number; s: number }[] = [
  { x: 372, y: 226, s: 66 },
  { x: 455, y: 138, s: 62 },
  { x: 536, y: 52,  s: 64 },
  { x: 620, y: 150, s: 60 },
  { x: 702, y: 50,  s: 58 },
  { x: 775, y: 166, s: 60 },
  { x: 846, y: 62,  s: 56 },
  { x: 904, y: 198, s: 58 },
  { x: 950, y: 88,  s: 54 },
  { x: 970, y: 248, s: 54 },
];

function buildCardJSX(p: {
  nombrePrograma: string;
  nombreNegocio: string;
  colorMarca: string;
  logoUrl?: string | null;
  stampIcon: string;
  stampFilledColor: string;
  totalSellos: number;
  sellosRequeridos: number;
  descripcionPremio?: string;
}) {
  const base  = p.colorMarca.startsWith("#") ? p.colorMarca : `#${p.colorMarca}`;
  const dark  = darkenColor(base, 0.28);
  const path  = STAMP_ICONS[p.stampIcon] ?? STAMP_ICONS.circle;
  const count = Math.min(p.sellosRequeridos, 10);
  const spots = SCATTER.slice(0, count);

  return (
    <div
      style={{
        width: W,
        height: H,
        background: `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      }}
    >
      {/* ── Logo + nombre (top-left) ── */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 32,
          display: "flex",
          alignItems: "center",
        }}
      >
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.logoUrl}
            width={56}
            height={56}
            style={{ borderRadius: 12, objectFit: "cover", marginRight: 14 }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              fontSize: 26,
              color: "white",
            }}
          >
            ★
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
            {p.nombreNegocio}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
            {p.nombrePrograma}
          </div>
        </div>
      </div>

      {/* ── LEALTAD badge (top-right) ── */}
      <div
        style={{
          position: "absolute",
          right: 38,
          top: 32,
          backgroundColor: "rgba(255,255,255,0.18)",
          borderRadius: 999,
          padding: "5px 16px",
          fontSize: 11,
          fontWeight: 700,
          color: "white",
          letterSpacing: "0.08em",
          display: "flex",
        }}
      >
        LEALTAD
      </div>

      {/* ── Premio (bottom-left) ── */}
      {p.descripcionPremio ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 26,
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            display: "flex",
          }}
        >
          Premio: {p.descripcionPremio}
        </div>
      ) : null}

      {/* ── Sellos dispersos en diagonal ── */}
      {spots.map((pos, i) => {
        const filled   = i < p.totalSellos;
        const iconSize = Math.round(pos.s * 0.47);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: pos.s,
              height: pos.s,
              borderRadius: "50%",
              backgroundColor: filled
                ? p.stampFilledColor
                : "rgba(255,255,255,0.10)",
              border: `2.5px solid ${
                filled ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.32)"
              }`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke={filled ? "white" : "rgba(255,255,255,0.38)"}
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={path} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const customerId = searchParams.get("customer_id");

  if (!businessId) {
    return NextResponse.json({ error: "business_id requerido" }, { status: 400 });
  }

  const { data: negocio, error: negErr } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("id", businessId)
    .single();

  if (negErr || !negocio) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  let totalSellos = 0;
  if (customerId) {
    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("total_sellos")
      .eq("id", customerId)
      .single();
    totalSellos = cliente?.total_sellos ?? 0;
  }

  const jsx = buildCardJSX({
    nombrePrograma:   negocio.nombre_programa,
    nombreNegocio:    negocio.nombre,
    colorMarca:       negocio.color_marca,
    logoUrl:          negocio.logo_url,
    stampIcon:        negocio.stamp_icon ?? "circle",
    stampFilledColor: negocio.stamp_filled_color ?? negocio.color_marca,
    totalSellos,
    sellosRequeridos: negocio.sellos_requeridos,
    descripcionPremio: negocio.descripcion_premio,
  });

  const imageResponse = new ImageResponse(jsx, { width: W, height: H });
  const buffer  = Buffer.from(await imageResponse.arrayBuffer());
  const base64  = `data:image/png;base64,${buffer.toString("base64")}`;

  const publicId = customerId
    ? `card-images/${businessId}/${customerId}`
    : `card-images/${businessId}/hero`;

  const result = await cloudinary.uploader.upload(base64, {
    public_id: publicId,
    overwrite: true,
    format:    "png",
    invalidate: true,
  });

  return NextResponse.json({ url: result.secure_url });
}

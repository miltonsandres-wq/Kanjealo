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

// Tres zonas horizontales
const ZONE_MID_L = 280;
const ZONE_MID_R = 720;

// Grid 2 cols × 5 filas centrado en la zona central (280–720)
const COLS       = 2;
const ROWS       = 5;
const S          = 60;   // tamaño del sello
const GAP        = 8;    // espacio entre sellos
const GRID_W     = COLS * S + (COLS - 1) * GAP;          // 128
const GRID_H     = ROWS * S + (ROWS - 1) * GAP;          // 332
const GRID_X     = (ZONE_MID_L + ZONE_MID_R) / 2 - GRID_W / 2;  // 436
const GRID_Y     = (H - GRID_H) / 2;                     // 2

function stampPos(i: number) {
  return {
    x: GRID_X + (i % COLS) * (S + GAP),
    y: GRID_Y + Math.floor(i / COLS) * (S + GAP),
  };
}

function darkenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const d = (v: number) =>
    Math.max(0, Math.round(v * (1 - amount))).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

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
  const base     = p.colorMarca.startsWith("#") ? p.colorMarca : `#${p.colorMarca}`;
  const dark     = darkenColor(base, 0.28);
  const path     = STAMP_ICONS[p.stampIcon] ?? STAMP_ICONS.circle;
  const count    = Math.min(p.sellosRequeridos, 10);
  const iconSize = Math.round(S * 0.46);

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
      {/* Divisores verticales sutiles */}
      <div style={{ position: "absolute", left: ZONE_MID_L, top: 0, width: 1, height: H, backgroundColor: "rgba(255,255,255,0.12)", display: "flex" }} />
      <div style={{ position: "absolute", left: ZONE_MID_R, top: 0, width: 1, height: H, backgroundColor: "rgba(255,255,255,0.12)", display: "flex" }} />

      {/* ── ZONA IZQUIERDA: logo + nombre ── */}
      {p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logoUrl}
          alt={p.nombreNegocio}
          width={70}
          height={70}
          style={{ position: "absolute", left: 35, top: 56, borderRadius: 14, objectFit: "cover" }}
        />
      ) : (
        <div style={{ position: "absolute", left: 35, top: 56, width: 70, height: 70, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "white" }}>
          ★
        </div>
      )}

      <div style={{ position: "absolute", left: 35, top: 142, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: "white", lineHeight: 1.3 }}>
          {p.nombreNegocio}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          {p.nombrePrograma}
        </div>
      </div>

      {/* ── ZONA CENTRAL: grid 2 × 5 de sellos ── */}
      {Array.from({ length: count }, (_, i) => {
        const filled = i < p.totalSellos;
        const { x, y } = stampPos(i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: S,
              height: S,
              borderRadius: "50%",
              backgroundColor: filled ? p.stampFilledColor : "rgba(255,255,255,0.10)",
              border: `2.5px solid ${filled ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.32)"}`,
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

      {/* ── ZONA DERECHA: contador SELLOS + premio ── */}
      <div style={{ position: "absolute", left: ZONE_MID_R + 32, top: 64, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em" }}>
          SELLOS
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 4 }}>
          <div style={{ fontSize: 54, fontWeight: 800, color: "white", lineHeight: 1 }}>
            {p.totalSellos}
          </div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginLeft: 6, marginBottom: 4 }}>
            / {p.sellosRequeridos}
          </div>
        </div>
      </div>

      {p.descripcionPremio ? (
        <div style={{ position: "absolute", left: ZONE_MID_R + 32, bottom: 44, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", letterSpacing: "0.10em" }}>
            PREMIO
          </div>
          <div style={{ fontSize: 14, color: "white", fontWeight: 600, marginTop: 4 }}>
            {p.descripcionPremio}
          </div>
        </div>
      ) : null}
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
    nombrePrograma:    negocio.nombre_programa,
    nombreNegocio:     negocio.nombre,
    colorMarca:        negocio.color_marca,
    logoUrl:           negocio.logo_url,
    stampIcon:         negocio.stamp_icon ?? "circle",
    stampFilledColor:  negocio.stamp_filled_color ?? negocio.color_marca,
    totalSellos,
    sellosRequeridos:  negocio.sellos_requeridos,
    descripcionPremio: negocio.descripcion_premio,
  });

  const imageResponse = new ImageResponse(jsx, { width: W, height: H });
  const buffer  = Buffer.from(await imageResponse.arrayBuffer());
  const base64  = `data:image/png;base64,${buffer.toString("base64")}`;

  const publicId = customerId
    ? `card-images/${businessId}/${customerId}`
    : `card-images/${businessId}/hero`;

  const result = await cloudinary.uploader.upload(base64, {
    public_id:  publicId,
    overwrite:  true,
    format:     "png",
    invalidate: true,
  });

  return NextResponse.json({ url: result.secure_url });
}

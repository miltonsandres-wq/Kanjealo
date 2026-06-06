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

// Grid 5 columnas × 2 filas — ocupa el ancho del banner landscape
const COLS     = 5;
const ROWS     = 2;
const S        = 78;   // tamaño sello (px)
const S_GAP    = 16;   // separación entre sellos
const ZONE_W   = 220;  // ancho zona izquierda y derecha

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
  const count    = Math.min(p.sellosRequeridos, COLS * ROWS);
  const iconSize = Math.round(S * 0.44);

  // Filas de sellos: 2 filas × 5 columnas
  const stampRows = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      const i = row * COLS + col;
      return i < count ? { i, filled: i < p.totalSellos } : null;
    })
  );

  return (
    <div
      style={{
        width: W,
        height: H,
        background: `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      }}
    >
      {/* ── ZONA IZQUIERDA: logo + nombre ── */}
      <div
        style={{
          width: ZONE_W,
          height: H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 18px",
        }}
      >
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.logoUrl}
            alt={p.nombreNegocio}
            width={66}
            height={66}
            style={{ borderRadius: 13, objectFit: "cover", marginBottom: 14 }}
          />
        ) : (
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 13,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
              fontSize: 28,
              color: "white",
            }}
          >
            ★
          </div>
        )}
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {p.nombreNegocio}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            marginTop: 5,
          }}
        >
          {p.nombrePrograma}
        </div>
      </div>

      {/* Divisor */}
      <div
        style={{
          width: 1,
          height: H,
          backgroundColor: "rgba(255,255,255,0.12)",
          display: "flex",
        }}
      />

      {/* ── ZONA CENTRAL: grid 5 × 2 ── */}
      <div
        style={{
          flex: 1,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {stampRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "flex",
              flexDirection: "row",
              marginBottom: rowIdx < ROWS - 1 ? S_GAP : 0,
            }}
          >
            {row.map((stamp, colIdx) => {
              if (!stamp) return null;
              const { filled } = stamp;
              return (
                <div
                  key={colIdx}
                  style={{
                    width: S,
                    height: S,
                    borderRadius: "50%",
                    backgroundColor: filled
                      ? p.stampFilledColor
                      : "rgba(255,255,255,0.10)",
                    border: `2.5px solid ${
                      filled ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.32)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: colIdx < COLS - 1 ? S_GAP : 0,
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
        ))}
      </div>

      {/* Divisor */}
      <div
        style={{
          width: 1,
          height: H,
          backgroundColor: "rgba(255,255,255,0.12)",
          display: "flex",
        }}
      />

      {/* ── ZONA DERECHA: contador + premio ── */}
      <div
        style={{
          width: ZONE_W,
          height: H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 18px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.12em",
            marginBottom: 6,
          }}
        >
          SELLOS
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: "white",
              lineHeight: 1,
            }}
          >
            {p.totalSellos}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.45)",
              marginLeft: 6,
            }}
          >
            / {p.sellosRequeridos}
          </div>
        </div>

        {p.descripcionPremio ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(255,255,255,0.40)",
                letterSpacing: "0.10em",
                marginBottom: 5,
              }}
            >
              PREMIO
            </div>
            <div
              style={{
                fontSize: 12,
                color: "white",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {p.descripcionPremio}
            </div>
          </div>
        ) : null}
      </div>
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

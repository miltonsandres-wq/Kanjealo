import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { v2 as cloudinary } from "cloudinary";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { STAMP_ICONS } from "@/lib/stamp-icons";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
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
  const baseColor = p.colorMarca.startsWith("#") ? p.colorMarca : `#${p.colorMarca}`;
  const darkColor = darkenColor(baseColor, 0.3);
  const iconPath = STAMP_ICONS[p.stampIcon] ?? STAMP_ICONS.circle;
  const displayCount = Math.min(p.sellosRequeridos, 10);

  return (
    <div
      style={{
        width: W,
        height: H,
        background: `linear-gradient(130deg, ${baseColor} 0%, ${darkColor} 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px 44px 28px",
        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Header: logo + nombre + badge */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {p.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.logoUrl}
            width={58}
            height={58}
            style={{ borderRadius: 12, objectFit: "cover", marginRight: 16 }}
          />
        ) : (
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              fontSize: 28,
              color: "white",
            }}
          >
            ★
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
            {p.nombreNegocio}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>
            {p.nombrePrograma}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            backgroundColor: "rgba(255,255,255,0.18)",
            borderRadius: 999,
            padding: "5px 16px",
            fontSize: 11,
            fontWeight: 700,
            color: "white",
            letterSpacing: "0.08em",
          }}
        >
          LEALTAD
        </div>
      </div>

      {/* Fila de sellos */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {Array.from({ length: displayCount }, (_, i) => {
          const filled = i < p.totalSellos;
          return (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: filled ? p.stampFilledColor : "transparent",
                border: `2px solid ${filled ? p.stampFilledColor : "rgba(255,255,255,0.4)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke={filled ? "white" : "rgba(255,255,255,0.45)"}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={iconPath} />
              </svg>
            </div>
          );
        })}
        {p.sellosRequeridos > 10 && (
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginLeft: 4 }}>
            +{p.sellosRequeridos - 10}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          {p.descripcionPremio ? `🎁 ${p.descripcionPremio}` : ""}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          KANJEALO
        </div>
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
    nombrePrograma: negocio.nombre_programa,
    nombreNegocio: negocio.nombre,
    colorMarca: negocio.color_marca,
    logoUrl: negocio.logo_url,
    stampIcon: negocio.stamp_icon ?? "circle",
    stampFilledColor: negocio.stamp_filled_color ?? negocio.color_marca,
    totalSellos,
    sellosRequeridos: negocio.sellos_requeridos,
    descripcionPremio: negocio.descripcion_premio,
  });

  const imageResponse = new ImageResponse(jsx, { width: W, height: H });
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

  // Subir a Cloudinary (carpeta card-images, sobrescribir si ya existe)
  const publicId = customerId
    ? `card-images/${businessId}/${customerId}`
    : `card-images/${businessId}/hero`;

  const uploadResult = await cloudinary.uploader.upload(base64, {
    public_id: publicId,
    overwrite: true,
    format: "png",
    invalidate: true,
  });

  return NextResponse.json({ url: uploadResult.secure_url });
}

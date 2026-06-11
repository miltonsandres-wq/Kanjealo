import { ImageResponse } from "next/og";
import { v2 as cloudinary } from "cloudinary";
import { STAMP_ICONS } from "@/lib/stamp-icons";

const W = 1032;
const H = 336;

const MAX_COLS = 5;
const MAX_ROWS = 2;
const S        = 112;  // stamp diameter — larger now that we own the full width
const S_GAP    = 24;   // gap between stamps in a row
const ROW_GAP  = 24;   // gap between rows

function darkenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const d = (v: number) =>
    Math.max(0, Math.round(v * (1 - amount))).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

export interface HeroImageParams {
  nombrePrograma: string;
  nombreNegocio: string;
  colorMarca: string;
  logoUrl?: string | null;
  stampIcon?: string;
  stampFilledColor?: string;
  totalSellos: number;
  sellosRequeridos: number;
  descripcionPremio?: string;
}

function buildCardJSX(p: HeroImageParams) {
  const base     = p.colorMarca.startsWith("#") ? p.colorMarca : `#${p.colorMarca}`;
  const dark     = darkenColor(base, 0.30);
  const path     = STAMP_ICONS[p.stampIcon ?? "circle"] ?? STAMP_ICONS.circle;
  const count    = Math.min(p.sellosRequeridos, MAX_COLS * MAX_ROWS);
  const filled   = p.stampFilledColor ?? base;
  const iconSize = Math.round(S * 0.46);

  // Build stamp rows, filtering nulls so Satori never sees mixed children
  const rows = Array.from({ length: MAX_ROWS }, (_, row) =>
    Array.from({ length: MAX_COLS }, (_, col) => {
      const i = row * MAX_COLS + col;
      return i < count ? { i, isFilled: i < p.totalSellos } : null;
    }).filter((s): s is { i: number; isFilled: boolean } => s !== null)
  ).filter((row) => row.length > 0);

  return (
    <div
      style={{
        width: W,
        height: H,
        background: `linear-gradient(135deg, ${base} 0%, ${dark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Stamp grid — centered, fills the full banner */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: rowIdx < rows.length - 1 ? ROW_GAP : 0,
            }}
          >
            {row.map((stamp, colIdx) => (
              <div
                key={colIdx}
                style={{
                  width: S,
                  height: S,
                  minWidth: S,
                  minHeight: S,
                  borderRadius: "50%",
                  backgroundColor: stamp.isFilled
                    ? filled
                    : "rgba(255,255,255,0.12)",
                  border: `3px solid ${
                    stamp.isFilled
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.35)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                  marginRight: colIdx < row.length - 1 ? S_GAP : 0,
                }}
              >
                <svg
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={stamp.isFilled ? "white" : "rgba(255,255,255,0.40)"}
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={path} />
                </svg>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export async function generateAndUploadHeroImage(
  params: HeroImageParams,
  publicId: string,
): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key:    process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });

  const jsx = buildCardJSX(params);
  const imageResponse = new ImageResponse(jsx, { width: W, height: H });
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    public_id:  publicId,
    overwrite:  true,
    format:     "png",
    invalidate: true,
  });

  return result.secure_url;
}

import { ImageResponse } from "next/og";
import { v2 as cloudinary } from "cloudinary";
import { STAMP_ICONS } from "@/lib/stamp-icons";

const W = 1032;
const H = 336;

const COLS   = 5;
const ROWS   = 2;
const S      = 78;
const S_GAP  = 16;
const ZONE_W = 220;

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
  const dark     = darkenColor(base, 0.28);
  const path     = STAMP_ICONS[p.stampIcon ?? "circle"] ?? STAMP_ICONS.circle;
  const count    = Math.min(p.sellosRequeridos, COLS * ROWS);
  const filled   = p.stampFilledColor ?? base;
  const iconSize = Math.round(S * 0.44);

  const stampRows = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      const i = row * COLS + col;
      return i < count ? { i, isFilled: i < p.totalSellos } : null;
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
      {/* IZQUIERDA: logo + nombre */}
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

      {/* CENTRO: grid 5×2 */}
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
              alignItems: "center",
              marginBottom: rowIdx < ROWS - 1 ? S_GAP : 0,
            }}
          >
            {row.map((stamp, colIdx) => {
              if (!stamp) return null;
              return (
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
                      : "rgba(255,255,255,0.10)",
                    border: `2.5px solid ${
                      stamp.isFilled
                        ? "rgba(255,255,255,0.22)"
                        : "rgba(255,255,255,0.32)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                    marginRight: colIdx < COLS - 1 ? S_GAP : 0,
                  }}
                >
                  <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={stamp.isFilled ? "white" : "rgba(255,255,255,0.38)"}
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

      {/* DERECHA: contador + premio */}
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
            {`/ ${p.sellosRequeridos}`}
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

// Genera la imagen y la sube a Cloudinary. Devuelve la URL pública.
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

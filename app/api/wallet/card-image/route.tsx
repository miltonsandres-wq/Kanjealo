import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellos    = Math.min(parseInt(searchParams.get("s") ?? "0"), 50);
  const requeridos = Math.min(parseInt(searchParams.get("r") ?? "10"), 50);
  const rawColor  = searchParams.get("c") ?? "FF5C3A";
  const nombre    = searchParams.get("n") ?? "Programa de Lealtad";
  const color     = rawColor.startsWith("#") ? rawColor : `#${rawColor}`;

  const stamps = Array.from({ length: requeridos }, (_, i) => i < sellos);
  const perRow = requeridos <= 10 ? 5 : requeridos <= 20 ? 7 : 10;
  const rows: boolean[][] = [];
  for (let i = 0; i < stamps.length; i += perRow) {
    rows.push(stamps.slice(i, i + perRow));
  }

  const stampSize = requeridos <= 10 ? 48 : requeridos <= 20 ? 38 : 30;
  const gap = 8;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color,
          padding: "28px 40px",
          gap: 16,
        }}
      >
        {/* Business / program name */}
        <div
          style={{
            color: "white",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: -0.5,
            textShadow: "0 2px 6px rgba(0,0,0,0.25)",
            textAlign: "center",
          }}
        >
          {nombre}
        </div>

        {/* Stamp grid */}
        <div style={{ display: "flex", flexDirection: "column", gap, alignItems: "center" }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap }}>
              {row.map((filled, ci) => (
                <div
                  key={ci}
                  style={{
                    width: stampSize,
                    height: stampSize,
                    borderRadius: "50%",
                    background: filled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)",
                    border: `2px solid rgba(255,255,255,${filled ? "0.85" : "0.45"})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.round(stampSize * 0.5),
                    boxShadow: filled ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                  }}
                >
                  {filled ? "★" : ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Progress */}
        <div
          style={{
            color: "rgba(255,255,255,0.80)",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {sellos} de {requeridos} sellos acumulados
        </div>
      </div>
    ),
    { width: 1032, height: 336 }
  );
}

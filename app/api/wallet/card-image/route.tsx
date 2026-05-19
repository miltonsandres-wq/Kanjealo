import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sellos    = Math.min(parseInt(searchParams.get("sellos")    ?? "0"),  50);
  const requeridos = Math.min(parseInt(searchParams.get("requeridos") ?? "10"), 50);
  const color     = searchParams.get("color")  ?? "#FF5C3A";
  const nombre    = searchParams.get("nombre") ?? "Programa de Lealtad";

  const stamps = Array.from({ length: requeridos }, (_, i) => i < sellos);

  // Layout: max 10 per row
  const perRow = Math.min(requeridos, 10);
  const rows: boolean[][] = [];
  for (let i = 0; i < stamps.length; i += perRow) {
    rows.push(stamps.slice(i, i + perRow));
  }

  const stampSize = requeridos <= 10 ? 52 : requeridos <= 20 ? 42 : 34;
  const gap       = requeridos <= 10 ? 10 : 8;

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
          background: `linear-gradient(135deg, ${color}dd, ${color})`,
          padding: "32px 40px",
          gap: 20,
        }}
      >
        {/* Business name */}
        <div
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: -0.5,
            textShadow: "0 2px 8px rgba(0,0,0,0.2)",
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
                    background: filled
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.20)",
                    border: `2.5px solid rgba(255,255,255,${filled ? "0.9" : "0.5"})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: stampSize * 0.52,
                    boxShadow: filled ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  {filled ? "★" : ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Progress text */}
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 18,
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

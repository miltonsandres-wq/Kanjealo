import { createCanvas, loadImage, Path2D } from "@napi-rs/canvas";
import { STAMP_ICONS } from "./stamp-icons";

const W = 1032;
const H = 336;

function darkenColor(hex: string, amount: number): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const d = (v: number) =>
    Math.max(0, Math.round(v * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

function drawStamp(
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  x: number,
  y: number,
  size: number,
  filled: boolean,
  icon: string,
  filledColor: string,
  emptyColor: string
) {
  const cx = x + size / 2;
  const cy = y + size / 2;

  // Fondo del círculo
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = filled ? filledColor : emptyColor;
  ctx.fill();

  // Ícono SVG
  const pathStr = STAMP_ICONS[icon] ?? STAMP_ICONS.circle;
  const scale = (size * 0.55) / 24;

  ctx.save();
  ctx.translate(x + size * 0.225, y + size * 0.225);
  ctx.scale(scale, scale);
  ctx.strokeStyle = filled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2 / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const path = new Path2D(pathStr);
  ctx.stroke(path);
  ctx.restore();
}

export interface CardImageParams {
  nombrePrograma: string;
  nombreNegocio: string;
  colorMarca: string;
  logoUrl?: string | null;
  stampIcon?: string;
  stampFilledColor?: string;
  stampEmptyColor?: string;
  totalSellos?: number;
  sellosRequeridos?: number;
  descripcionPremio?: string;
  model?: string;
}

export async function generateCardImage(params: CardImageParams): Promise<Buffer> {
  const {
    nombrePrograma,
    nombreNegocio,
    colorMarca,
    logoUrl,
    stampIcon = "circle",
    stampFilledColor = "#FF5C3A",
    stampEmptyColor = "rgba(255,255,255,0.2)",
    totalSellos = 0,
    sellosRequeridos = 10,
    descripcionPremio,
    model = "stamps",
  } = params;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Gradiente de fondo
  const baseColor = colorMarca.startsWith("#") ? colorMarca : `#${colorMarca}`;
  const darkColor = darkenColor(baseColor, 0.25);
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(1, darkColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Logo
  let contentX = 60;

  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      const img = await loadImage(buf);
      const maxW = 160, maxH = 100;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img as any, 48, (H - h) / 2, w, h);
      contentX = 240;
    } catch {
      // Placeholder con inicial
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(48 + 40, H / 2, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        (nombreNegocio || nombrePrograma).slice(0, 1).toUpperCase(),
        48 + 40,
        H / 2
      );
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      contentX = 240;
    }
  }

  // Nombre del programa
  ctx.fillStyle = "white";
  ctx.font = "bold 44px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(nombrePrograma, contentX, 90);

  // Subtítulo
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "20px sans-serif";
  ctx.fillText("Programa de fidelización", contentX, 144);

  // Zona de sellos
  if (model === "stamps" || model === "mixed") {
    const stampSize = 36;
    const gap = 10;
    const step = stampSize + gap;
    const available = W - contentX - 60;
    const perRow = Math.max(1, Math.floor(available / step));
    const total = Math.min(sellosRequeridos, 30);

    let sy = 200;
    let drawn = 0;

    while (drawn < total) {
      const rowCount = Math.min(perRow, total - drawn);
      for (let i = 0; i < rowCount; i++) {
        const sx = contentX + i * step;
        drawStamp(
          ctx,
          sx,
          sy,
          stampSize,
          drawn + i < totalSellos,
          stampIcon,
          stampFilledColor,
          stampEmptyColor
        );
      }
      drawn += rowCount;
      sy += stampSize + gap;
    }

    if (descripcionPremio) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "17px monospace";
      ctx.fillText(
        `${totalSellos} de ${sellosRequeridos} · Premio: ${descripcionPremio}`,
        contentX,
        sy + 24
      );
    }
  } else if (model === "cashback") {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "18px sans-serif";
    ctx.fillText("Saldo disponible", contentX, 210);
    ctx.fillStyle = "white";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("L. 0.00", contentX, 275);
  } else if (model === "points" || model === "tiers") {
    ctx.fillStyle = "white";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("0 puntos", contentX, 230);
  }

  return canvas.toBuffer("image/png");
}

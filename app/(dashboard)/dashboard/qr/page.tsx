"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download, Printer, Copy, Check,
  Palette, Type, Layers, Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNegocio } from "@/lib/hooks";

// ── Tipos y constantes ───────────────────────────────────────

type TemplateId = "vertical" | "cuadrado" | "horizontal";
type TabEditor = "plantilla" | "contenido" | "colores";

const TEMPLATES: { id: TemplateId; label: string; desc: string; W: number; H: number }[] = [
  { id: "vertical",   label: "Vertical",   desc: "Mostrador / Ventana",    W: 800,  H: 1200 },
  { id: "cuadrado",   label: "Cuadrado",   desc: "Redes sociales",         W: 1000, H: 1000 },
  { id: "horizontal", label: "Horizontal", desc: "Mesa / Mostrador largo", W: 1200, H: 800  },
];

const FONDOS = [
  "#0F2044", "#1A1A2E", "#0D3B2E",
  "#3D1A0D", "#2D1B69", "#1A1A1A",
];

const ACENTOS = [
  "#FF5C3A", "#FFB800", "#22C55E",
  "#60A5FA", "#F472B6", "#FFFFFF",
];

// ── Helpers de canvas ────────────────────────────────────────

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, y: number,
  maxW: number, lh: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  ctx.textAlign = "center";
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line.trim(), cx, cy);
      line = words[i] + " ";
      cy += lh;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), cx, cy);
  return cy + lh;
}

function drawDecor(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(W * 0.88, H * 0.08, W * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.12, H * 0.94, W * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.035;
  const dot = 28;
  for (let dx = 0; dx < W; dx += dot)
    for (let dy = 0; dy < H; dy += dot) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.restore();
}

function logoCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, emoji: string,
) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.font = `${r * 1.1}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(emoji, cx, cy);
  ctx.textBaseline = "alphabetic";
}

function drawQR(
  ctx: CanvasRenderingContext2D,
  qrCanvas: HTMLCanvasElement | null,
  x: number, y: number, size: number, pad: number,
) {
  rrect(ctx, x - pad, y - pad, size + pad * 2, size + pad * 2, 26);
  ctx.fillStyle = "white";
  ctx.fill();
  if (qrCanvas) {
    ctx.drawImage(qrCanvas, x, y, size, size);
  } else {
    ctx.fillStyle = "#e5e1db";
    rrect(ctx, x, y, size, size, 10);
    ctx.fill();
  }
}

// ── Página ───────────────────────────────────────────────────

export default function QRPage() {
  const { negocio } = useNegocio();

  const slug = negocio?.slug ?? "";
  const qrUrl = slug ? `https://kanjealo.hn/c/${slug}` : "https://kanjealo.hn/c/...";

  const [template,       setTemplate]       = useState<TemplateId>("vertical");
  const [nombreNegocio,  setNombreNegocio]  = useState("");
  const [emoji,          setEmoji]          = useState("⭐");
  const [textoInvit,     setTextoInvit]     = useState("¡Únete a nuestro programa de fidelización y gana recompensas!");
  const [textoCTA,       setTextoCTA]       = useState("");

  // Inicializar con datos reales cuando cargue el negocio
  React.useEffect(() => {
    if (!negocio) return;
    setNombreNegocio(negocio.nombre);
    setTextoCTA(`¡Gana ${negocio.descripcion_premio}!`);
  }, [negocio]);
  const [colorFondo,     setColorFondo]     = useState("#0F2044");
  const [colorAccento,   setColorAccento]   = useState("#FF5C3A");
  const [mostrarUrl,     setMostrarUrl]     = useState(true);
  const [mostrarBrand,   setMostrarBrand]   = useState(true);
  const [tabActivo,      setTabActivo]      = useState<TabEditor>("plantilla");
  const [copiado,        setCopiado]        = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrDivRef  = useRef<HTMLDivElement>(null);

  const renderFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tmpl = TEMPLATES.find(t => t.id === template) ?? TEMPLATES[0];
    canvas.width  = tmpl.W;
    canvas.height = tmpl.H;
    const W = tmpl.W;
    const H = tmpl.H;

    const qrEl = qrDivRef.current?.querySelector("canvas") ?? null;

    await document.fonts.ready;

    // Background
    const gr = ctx.createLinearGradient(0, 0, W * 0.55, H);
    const [rr,rg,rb] = [1,3,5].map(i => parseInt(colorFondo.slice(i, i+2), 16));
    gr.addColorStop(0, colorFondo);
    gr.addColorStop(1, `rgb(${Math.max(0,rr-24)},${Math.max(0,rg-24)},${Math.max(0,rb-24)})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);

    drawDecor(ctx, W, H);

    const FONT = `"Outfit", "Helvetica Neue", Arial, sans-serif`;

    // ── Vertical ──────────────────────────────────────────
    if (template === "vertical") {
      logoCircle(ctx, W / 2, 105, 55, emoji);

      ctx.font = `bold 60px ${FONT}`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(nombreNegocio, W / 2, 225);

      ctx.font = `34px ${FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.60)";
      const afterInvit = wrapText(ctx, textoInvit, W / 2, 280, W - 120, 46);

      const divY = Math.max(afterInvit, 360);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W * 0.18, divY);
      ctx.lineTo(W * 0.82, divY);
      ctx.stroke();
      ctx.restore();

      ctx.font = `26px ${FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText("Escanea para unirte:", W / 2, divY + 50);

      const qrSize = 370;
      const qrY    = divY + 80;
      drawQR(ctx, qrEl, (W - qrSize) / 2, qrY, qrSize, 20);

      const belowQR = qrY + qrSize + 20;
      ctx.font = `bold 46px ${FONT}`;
      ctx.fillStyle = colorAccento;
      ctx.fillText(textoCTA, W / 2, belowQR + 62);

      if (mostrarUrl) {
        ctx.font = `24px "DM Mono","Courier New",monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fillText(qrUrl, W / 2, belowQR + 108);
      }
      if (mostrarBrand) {
        ctx.font = `20px ${FONT}`;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillText("Powered by Kanjealo", W / 2, H - 28);
      }
    }

    // ── Cuadrado ──────────────────────────────────────────
    else if (template === "cuadrado") {
      logoCircle(ctx, W / 2, 88, 46, emoji);

      ctx.font = `bold 62px ${FONT}`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(nombreNegocio, W / 2, 195);

      ctx.font = `30px ${FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.58)";
      wrapText(ctx, textoInvit, W / 2, 242, W - 130, 42);

      const qrSize = 340;
      const qrY    = 360;
      drawQR(ctx, qrEl, (W - qrSize) / 2, qrY, qrSize, 18);

      const belowQR = qrY + qrSize + 18;
      ctx.font = `bold 40px ${FONT}`;
      ctx.fillStyle = colorAccento;
      ctx.fillText(textoCTA, W / 2, belowQR + 54);

      if (mostrarUrl) {
        ctx.font = `22px monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.fillText(qrUrl, W / 2, belowQR + 96);
      }
      if (mostrarBrand) {
        ctx.font = `18px ${FONT}`;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillText("Powered by Kanjealo", W / 2, H - 24);
      }
    }

    // ── Horizontal ────────────────────────────────────────
    else {
      const qrSize = 380;
      const qrPad  = 18;
      const qrX    = 64;
      const qrY    = (H - qrSize) / 2;
      drawQR(ctx, qrEl, qrX, qrY, qrSize, qrPad);

      const txtCX = qrX + qrSize + qrPad + (W - (qrX + qrSize + qrPad + 60)) / 2 + 60;
      const txtW  = W - txtCX - 50;

      logoCircle(ctx, txtCX, H * 0.16, 40, emoji);

      ctx.font = `bold 50px ${FONT}`;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(nombreNegocio, txtCX, H * 0.38);

      ctx.font = `26px ${FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.58)";
      wrapText(ctx, textoInvit, txtCX, H * 0.46, txtW, 38);

      ctx.font = `bold 34px ${FONT}`;
      ctx.fillStyle = colorAccento;
      ctx.fillText(textoCTA, txtCX, H * 0.76);

      if (mostrarUrl) {
        ctx.font = `19px monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.fillText(qrUrl, txtCX, H * 0.86);
      }
      if (mostrarBrand) {
        ctx.font = `17px ${FONT}`;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.textAlign = "right";
        ctx.fillText("Powered by Kanjealo", W - 36, H - 22);
      }
    }
  }, [template, nombreNegocio, emoji, textoInvit, textoCTA, colorFondo, colorAccento, mostrarUrl, mostrarBrand, qrUrl]);

  useEffect(() => {
    const t = setTimeout(renderFlyer, 80);
    return () => clearTimeout(t);
  }, [renderFlyer]);

  const descargar = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `flyer-${slug}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  const imprimir = () => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>Flyer ${nombreNegocio}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
      img{max-width:100%;max-height:100vh;object-fit:contain}
      @media print{body{margin:0}img{width:100%;height:auto}}</style>
      </head><body><img src="${url}" onload="window.print()"/></body></html>`
    );
    w.document.close();
  };

  const copiar = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const tmpl     = TEMPLATES.find(t => t.id === template) ?? TEMPLATES[0];
  const landscape = tmpl.W > tmpl.H;

  const tabs: { id: TabEditor; label: string; icon: React.ReactNode }[] = [
    { id: "plantilla", label: "Plantilla", icon: <Layers className="w-4 h-4" /> },
    { id: "contenido", label: "Contenido", icon: <Type   className="w-4 h-4" /> },
    { id: "colores",   label: "Colores",   icon: <Palette className="w-4 h-4" /> },
  ];

  const EMOJIS = ["☕", "🍕", "🍔", "🌮", "🥤", "🍰", "💈", "🛍️", "💊", "🌸", "🏪", "🎁"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Diseñador de Flyer</h1>
          <p className="text-navy/50">Crea el material de tu programa para impresión y redes sociales.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variante="secundario" icono={<Printer className="w-4 h-4" />} onClick={imprimir}>
            Imprimir
          </Button>
          <Button variante="primario" icono={<Download className="w-4 h-4" />} onClick={descargar}>
            Descargar PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 items-start">

        {/* ── Panel Editor ── */}
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex bg-cream rounded-2xl p-1.5 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  tabActivo === tab.id
                    ? "bg-white text-navy shadow-sm"
                    : "text-navy/40 hover:text-navy"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Plantilla ── */}
          {tabActivo === "plantilla" && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t => {
                  const ratio   = t.W / t.H;
                  const active  = template === t.id;
                  const pw      = ratio >= 1 ? 52 : 36;
                  const ph      = ratio >= 1 ? 34 : 52;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        active ? "border-coral bg-coral/5" : "border-transparent bg-cream hover:bg-navy/5"
                      }`}
                    >
                      <div
                        className={`rounded-xl flex items-center justify-center transition-colors ${active ? "bg-coral" : "bg-navy/15"}`}
                        style={{ width: pw, height: ph }}
                      >
                        <div className={`w-3 h-3 rounded-full ${active ? "bg-white" : "bg-navy/30"}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${active ? "text-coral" : "text-navy/70"}`}>{t.label}</p>
                        <p className="text-[10px] text-navy/40 mt-0.5">{t.desc}</p>
                        <p className="text-[9px] text-navy/25 font-mono mt-0.5">{t.W}×{t.H}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Enlace QR */}
              <Card className="p-5 border-none bg-white shadow-sm space-y-3">
                <p className="text-sm font-bold text-navy">Enlace del QR</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] text-coral font-bold bg-cream px-3 py-2.5 rounded-xl overflow-hidden text-ellipsis whitespace-nowrap">
                    {qrUrl}
                  </code>
                  <button
                    onClick={copiar}
                    className="p-2.5 rounded-xl bg-cream hover:bg-navy/10 transition-colors shrink-0"
                  >
                    {copiado
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <Copy  className="w-4 h-4 text-navy/40"  />}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ── Tab: Contenido ── */}
          {tabActivo === "contenido" && (
            <Card className="p-7 border-none shadow-sm bg-white space-y-6">
              <Input
                etiqueta="Nombre del negocio"
                value={nombreNegocio}
                onChange={e => setNombreNegocio(e.target.value)}
                placeholder="Café Mirna"
              />

              {/* Emoji / logo icon */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-navy">Ícono del negocio</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        emoji === e
                          ? "bg-coral shadow-md scale-110"
                          : "bg-cream hover:bg-navy/10"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-navy">Texto de invitación</label>
                <textarea
                  value={textoInvit}
                  onChange={e => setTextoInvit(e.target.value)}
                  rows={3}
                  placeholder="¡Únete y gana recompensas!"
                  className="w-full px-4 py-3 bg-cream border-none rounded-xl text-sm text-navy resize-none outline-none focus:ring-2 focus:ring-coral/20 placeholder:text-navy/30"
                />
              </div>

              <Input
                etiqueta="Llamada a la acción (CTA)"
                value={textoCTA}
                onChange={e => setTextoCTA(e.target.value)}
                placeholder="¡Gana un café gratis!"
                ayuda="Aparece en el color de acento debajo del QR."
              />

              <div className="space-y-3 pt-3 border-t border-navy/5">
                <label className="text-sm font-bold text-navy">Elementos opcionales</label>
                {[
                  { label: "Mostrar enlace URL", val: mostrarUrl,   set: setMostrarUrl },
                  { label: "Mostrar branding Kanjealo", val: mostrarBrand, set: setMostrarBrand },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-navy/60 group-hover:text-navy transition-colors">{opt.label}</span>
                    <button
                      onClick={() => opt.set(!opt.val)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${opt.val ? "bg-coral" : "bg-navy/20"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${opt.val ? "left-6" : "left-1"}`} />
                    </button>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {/* ── Tab: Colores ── */}
          {tabActivo === "colores" && (
            <div className="space-y-5">
              <Card className="p-7 border-none shadow-sm bg-white space-y-6">
                {/* Fondo */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-navy">Color de fondo</label>
                  <div className="flex flex-wrap gap-2.5">
                    {FONDOS.map(hex => (
                      <button
                        key={hex}
                        title={hex}
                        onClick={() => setColorFondo(hex)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          colorFondo === hex ? "border-navy/30 scale-110 shadow-lg" : "border-transparent opacity-55 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden shrink-0">
                      <input type="color" value={colorFondo} onChange={e => setColorFondo(e.target.value)}
                        className="w-12 h-12 -translate-x-1 -translate-y-1 cursor-pointer border-none" />
                    </div>
                  </div>
                  <Input value={colorFondo} onChange={e => setColorFondo(e.target.value)} className="max-w-[150px] font-mono text-sm" />
                </div>

                {/* Acento */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-navy">Color de acento (CTA)</label>
                  <div className="flex flex-wrap gap-2.5">
                    {ACENTOS.map(hex => (
                      <button
                        key={hex}
                        title={hex}
                        onClick={() => setColorAccento(hex)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          colorAccento === hex ? "border-navy/30 scale-110 shadow-lg" : "border-transparent opacity-55 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: hex,
                          ...(hex === "#FFFFFF" ? { border: "2px solid #e0dcd6" } : {}),
                        }}
                      />
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden shrink-0">
                      <input type="color" value={colorAccento} onChange={e => setColorAccento(e.target.value)}
                        className="w-12 h-12 -translate-x-1 -translate-y-1 cursor-pointer border-none" />
                    </div>
                  </div>
                  <Input value={colorAccento} onChange={e => setColorAccento(e.target.value)} className="max-w-[150px] font-mono text-sm" />
                </div>
              </Card>

              {/* Mini preview de combinación */}
              <div
                className="p-5 rounded-2xl flex items-center gap-4 transition-all duration-300"
                style={{ backgroundColor: colorFondo }}
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0">
                  {emoji}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{nombreNegocio}</p>
                  <p className="text-[13px] font-bold mt-0.5" style={{ color: colorAccento }}>{textoCTA}</p>
                </div>
              </div>

              <Card className="p-4 bg-cream border-none flex gap-3">
                <Info className="w-5 h-5 text-navy/40 shrink-0 mt-0.5" />
                <p className="text-[11px] text-navy/60 leading-relaxed">
                  Recomendamos fondos oscuros (navy, negro) y acentos brillantes (coral, dorado) para máxima legibilidad en impresión.
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* ── Panel Preview ── */}
        <div className="lg:sticky lg:top-28 space-y-5">
          <div className="flex items-center justify-between">
            <Badge variante="navy">VISTA PREVIA EN VIVO</Badge>
            <span className="text-[11px] text-navy/40 font-mono">{tmpl.W} × {tmpl.H} px</span>
          </div>

          <div className={`flex justify-center ${landscape ? "overflow-x-auto pb-2" : ""}`}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                maxWidth: landscape ? 520 : 340,
                height: "auto",
                borderRadius: 20,
                boxShadow: "0 20px 64px rgba(15,32,68,0.28)",
                display: "block",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variante="primario"   className="w-full" icono={<Download className="w-4 h-4" />} onClick={descargar}>
              Descargar PNG
            </Button>
            <Button variante="secundario" className="w-full" icono={<Printer  className="w-4 h-4" />} onClick={imprimir}>
              Imprimir
            </Button>
          </div>

          <Card className="p-4 bg-cream border-none flex gap-3">
            <Info className="w-5 h-5 text-navy/40 shrink-0 mt-0.5" />
            <p className="text-[11px] text-navy/60 leading-relaxed">
              Descarga en alta resolución ({tmpl.W}×{tmpl.H}px). El QR real apunta a tu programa. Recomendamos impresión en papel 200g+.
            </p>
          </Card>
        </div>
      </div>

      {/* QR canvas oculto para renderizado */}
      <div
        ref={qrDivRef}
        style={{ position: "absolute", left: -9999, top: 0, opacity: 0, pointerEvents: "none" }}
      >
        <QRCodeCanvas value={qrUrl} size={400} level="H" bgColor="#FFFFFF" fgColor="#0F2044" />
      </div>
    </div>
  );
}

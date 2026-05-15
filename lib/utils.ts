// ═══════════════════════════════════════
// Kanjealo — Utilidades
// ═══════════════════════════════════════

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clasesCondicionales(
  ...clases: (string | boolean | undefined | null)[]
): string {
  return clases.filter(Boolean).join(" ");
}

export function formatearFecha(fecha: string | Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(fecha));
}

export function formatearFechaCorta(fecha: string | Date): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "short",
  }).format(new Date(fecha));
}

export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "USD",
  }).format(monto);
}

export function generarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generarPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function obtenerIniciales(nombre: string): string {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const esDemoMode = (): boolean => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
};

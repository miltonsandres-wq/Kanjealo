"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  QrCode,
  Settings,
  LogOut,
  HelpCircle,
  Trophy,
  Share2,
  X,
} from "lucide-react";
import { KanjealoLogo } from "../logo";
import { cn } from "@/lib/utils";
import { useNegocio, useLoyaltyConfig } from "@/lib/hooks";
import { useClerk } from "@clerk/nextjs";

const BASE_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CreditCard, label: "Mi Tarjeta", href: "/dashboard/tarjeta" },
  { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
  { icon: QrCode, label: "Código QR", href: "/dashboard/qr" },
];

const BOTTOM_ITEMS = [
  { icon: Settings, label: "Configuración", href: "/dashboard/configuracion" },
];

interface SidebarProps {
  abierto?: boolean;
  onCerrar?: () => void;
}

export function Sidebar({ abierto = false, onCerrar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { negocio } = useNegocio();
  const { config } = useLoyaltyConfig(negocio?.id);
  const model = config?.model;

  const extraItems = [
    ...(model === "tiers" || model === "mixed"
      ? [{ icon: Trophy, label: "Niveles", href: "/dashboard/tiers" }]
      : []),
    ...(model === "referrals" || model === "mixed"
      ? [{ icon: Share2, label: "Referidos", href: "/dashboard/referidos" }]
      : []),
  ];

  const allItems = [...BASE_ITEMS, ...extraItems, ...BOTTOM_ITEMS];

  return (
    <>
      {/* Overlay móvil */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onCerrar}
        />
      )}

      <aside
        className={cn(
          "w-64 bg-navy h-screen fixed left-0 top-0 text-white flex flex-col z-50 transition-transform duration-300 md:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-8 flex items-center justify-between">
          <KanjealoLogo tamaño="md" variante="blanco" />
          <button
            onClick={onCerrar}
            className="md:hidden text-white/60 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-4 space-y-1">
          {allItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCerrar}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  active
                    ? "bg-coral text-white shadow-lg"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  active ? "text-white" : "text-white/40 group-hover:text-white"
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-6 border-t border-white/5 space-y-4">
          <button className="flex items-center gap-3 px-4 py-2 text-white/50 hover:text-white transition-colors w-full">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Ayuda</span>
          </button>
          <button
            onClick={() => signOut(() => router.push("/"))}
            className="flex items-center gap-3 px-4 py-2 text-white/50 hover:text-coral transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useNegocio } from "@/lib/hooks";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { negocio, cargando } = useNegocio();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && negocio === null) {
      router.replace("/onboarding");
    }
  }, [cargando, negocio, router]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!negocio) return null;

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="pt-20 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

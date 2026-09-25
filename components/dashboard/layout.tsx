"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useNegocio } from "@/lib/hooks";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { negocio, cargando } = useNegocio();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

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

  // Prueba de 15 días desde el registro. Si venció y no hay suscripción de
  // PayPal activa, se bloquea todo el dashboard salvo Configuración (ahí
  // vive el botón para suscribirse).
  const suscripcionActiva = Boolean(negocio.paypal_subscription_id && negocio.esta_activo);
  const diasDePrueba = negocio.trial_ends_at
    ? Math.ceil((new Date(negocio.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const pruebaVencida = diasDePrueba !== null && diasDePrueba <= 0 && !suscripcionActiva;
  const pruebaPorVencer = diasDePrueba !== null && diasDePrueba > 0 && !suscripcionActiva;

  const rutaPermitida = pathname === "/dashboard/configuracion";

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />
      <div className="md:pl-64">
        <Topbar onAbrirMenu={() => setSidebarAbierto(true)} />
        <main className="pt-20 p-4 md:p-8">
          {pruebaVencida && !rutaPermitida ? (
            <div className="max-w-md mx-auto mt-12 bg-white rounded-3xl shadow-xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-coral/10 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-coral" />
              </div>
              <h2 className="text-xl font-bold text-navy">Tu prueba de 15 días terminó</h2>
              <p className="text-sm text-navy/50">
                Suscríbete para seguir usando el dashboard, dar sellos y ver a tus clientes.
              </p>
              <Button variante="primario" onClick={() => router.push("/dashboard/configuracion")}>
                Ir a Facturación
              </Button>
            </div>
          ) : (
            <>
              {pruebaPorVencer && !rutaPermitida && (
                <div className="mb-4 flex items-center justify-between gap-3 bg-coral/10 border border-coral/20 text-coral text-sm font-medium rounded-2xl px-4 py-3">
                  <span>
                    Te quedan {diasDePrueba} {diasDePrueba === 1 ? "día" : "días"} de prueba gratis.
                  </span>
                  <button
                    onClick={() => router.push("/dashboard/configuracion")}
                    className="font-bold underline shrink-0"
                  >
                    Suscribirme
                  </button>
                </div>
              )}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

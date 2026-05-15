"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { KanjealoLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletPreview } from "@/components/wallet-preview";
import { supabase } from "@/lib/supabase";
import { generarSlug } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  
  // Datos del negocio
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [slug, setSlug] = useState("");
  const [nombrePrograma, setNombrePrograma] = useState("Tarjeta de Sellos");
  const [sellosRequeridos, setSellosRequeridos] = useState(10);
  const [descripcionPremio, setDescripcionPremio] = useState("Un producto gratis");
  const [colorMarca, setColorMarca] = useState("#FF5C3A");

  useEffect(() => {
    if (nombreNegocio && paso === 1) {
      setSlug(generarSlug(nombreNegocio));
    }
  }, [nombreNegocio, paso]);

  const finalizarOnboarding = async () => {
    if (!user) return;
    setCargando(true);

    try {
      const { error } = await supabase.from("negocios").insert({
        clerk_org_id: user.id,
        nombre: nombreNegocio,
        slug,
        nombre_programa: nombrePrograma,
        sellos_requeridos: sellosRequeridos,
        descripcion_premio: descripcionPremio,
        color_marca: colorMarca,
        plan: "basic",
        esta_activo: true,
        logo_url: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      });

      if (error) throw error;
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error en onboarding:", error?.message ?? error);
    } finally {
      setCargando(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center p-6 pt-12 md:pt-20">
      <div className="mb-12">
        <KanjealoLogo tamaño="md" />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Formulario */}
        <div className="space-y-8">
          <div className="space-y-2">
            <Badge variante="coral">Paso {paso} de 2</Badge>
            <h1 className="text-3xl font-bold text-navy">
              {paso === 1 ? "Cuéntanos de tu negocio" : "Configura tu programa"}
            </h1>
            <p className="text-navy/60">
              {paso === 1 
                ? "Necesitamos lo básico para crear tu perfil." 
                : "Define cómo tus clientes ganarán premios."}
            </p>
          </div>

          <Card className="p-8 border-none shadow-xl space-y-6">
            {paso === 1 ? (
              <>
                <Input 
                  etiqueta="Nombre del Negocio"
                  placeholder="Ej: Café Mirna"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                />
                <div className="space-y-2">
                  <Input 
                    etiqueta="URL personalizada (Slug)"
                    placeholder="cafe-mirna"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    ayuda={`kanjealo.hn/c/${slug || '...'}`}
                  />
                </div>
                <Button 
                  className="w-full" 
                  tamaño="lg"
                  disabled={!nombreNegocio || !slug}
                  onClick={() => setPaso(2)}
                >
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Input 
                  etiqueta="Nombre del Programa"
                  placeholder="Ej: Tarjeta de Lealtad"
                  value={nombrePrograma}
                  onChange={(e) => setNombrePrograma(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    etiqueta="Sellos requeridos"
                    type="number"
                    min="2"
                    max="20"
                    value={sellosRequeridos}
                    onChange={(e) => setSellosRequeridos(parseInt(e.target.value))}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-navy/70">Color de Marca</label>
                    <div className="flex gap-2">
                      {["#FF5C3A", "#0F2044", "#22C55E", "#EAB308", "#8B5CF6"].map((c) => (
                        <button 
                          key={c}
                          onClick={() => setColorMarca(c)}
                          className={`w-8 h-8 rounded-full border-2 ${colorMarca === c ? 'border-navy scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Input 
                  etiqueta="¿Cuál es el premio?"
                  placeholder="Ej: Un café grande gratis"
                  value={descripcionPremio}
                  onChange={(e) => setDescripcionPremio(e.target.value)}
                />
                <div className="flex gap-4 pt-4">
                  <Button variante="ghost" onClick={() => setPaso(1)}>Atrás</Button>
                  <Button 
                    className="flex-grow" 
                    tamaño="lg" 
                    cargando={cargando}
                    onClick={finalizarOnboarding}
                  >
                    Crear mi programa
                  </Button>
                </div>
              </>
            )}
          </Card>

          <div className="flex items-center gap-4 text-xs text-navy/40 px-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Datos seguros
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Listo en segundos
            </div>
          </div>
        </div>

        {/* Preview en tiempo real */}
        <div className="lg:sticky lg:top-20">
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-navy/40 uppercase tracking-widest">Vista previa en vivo</span>
          </div>
          <div className="flex justify-center transform scale-90 md:scale-100 origin-top">
            <WalletPreview 
              nombrePrograma={nombreNegocio || "Tu Negocio"}
              colorMarca={colorMarca}
              sellosActuales={3}
              sellosRequeridos={sellosRequeridos}
              descripcionPremio={descripcionPremio}
            />
          </div>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 border border-white">
              <div className="p-2 bg-coral/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-coral" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy">Personalización Instantánea</h4>
                <p className="text-xs text-navy/60 leading-relaxed">Tu tarjeta digital se actualiza en tiempo real mientras configuras tu programa.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

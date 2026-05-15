import React from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Smartphone, 
  Store, 
  Users, 
  Zap, 
  ChevronRight, 
  Star,
  QrCode
} from "lucide-react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletPreview } from "@/components/wallet-preview";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-cream selection:bg-coral selection:text-white">
      <MarketingNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-navy overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-coral/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-coral/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <Badge variante="coral" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-wider">
              Fidelización Digital · Honduras
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-8">
              Tus clientes <br />
              <span className="text-coral">vuelven siempre.</span>
            </h1>
            <p className="text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
              Elimina las tarjetas de papel. Crea tu propio programa de sellos digital en minutos y recompensa a tus clientes directamente en su móvil.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <Button tamaño="xl" className="w-full sm:w-auto text-lg px-10">
                  Empezar ahora — Es gratis
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button variante="ghost" tamaño="xl" className="w-full sm:w-auto text-white hover:bg-white/10 group">
                  Ver cómo funciona 
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center space-x-6 text-white/40 text-sm">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-coral" />
                Sin tarjetas físicas
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-coral" />
                Listo en 5 minutos
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative z-10 w-full max-w-[320px] transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <WalletPreview 
                nombrePrograma="Café Mirna" 
                colorMarca="#FF5C3A" 
                sellosActuales={6}
                sellosRequeridos={10}
                descripcionPremio="Un Latte Grande Gratis"
              />
            </div>
            {/* Decorative elements behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-white/5 rounded-full" />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-navy text-4xl md:text-5xl font-bold mb-6">Tan simple que parece magia</h2>
            <p className="text-navy/60 text-lg">
              Diseñado para ser rápido en el mostrador. Sin fricción para tus clientes, sin complicaciones para ti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Store,
                title: "Configura tu programa",
                desc: "Eliges cuántos sellos se necesitan y cuál es el premio. Sube tu logo y personaliza tus colores."
              },
              {
                icon: QrCode,
                title: "Tus clientes escanean",
                desc: "Un código QR en tu mostrador es todo lo que necesitan. Se registran en segundos sin descargar apps."
              },
              {
                icon: Zap,
                title: "Ganan y canjean",
                desc: "Tus cajeros asignan sellos digitalmente. Al completar la tarjeta, el cliente recibe su premio."
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 group hover:bg-cream/50 rounded-3xl transition-colors">
                <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mb-8 group-hover:bg-coral/10 transition-colors">
                  <step.icon className="w-8 h-8 text-navy group-hover:text-coral transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-navy mb-4">{step.title}</h3>
                <p className="text-navy/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits for Business */}
      <section id="negocios" className="py-24 md:py-32 bg-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">El poder de los datos en tu mostrador</h2>
              <div className="space-y-8">
                {[
                  {
                    icon: Users,
                    title: "Base de datos propia",
                    desc: "Conoce quiénes son tus clientes más fieles y obtén sus datos de contacto (WhatsApp/Email)."
                  },
                  {
                    icon: Star,
                    title: "Aumenta la recurrencia",
                    desc: "Los clientes con tarjetas de fidelización regresan un 40% más seguido a los negocios."
                  },
                  {
                    icon: Smartphone,
                    title: "Notificaciones directas",
                    desc: "Envía promociones y recordatorios a tus clientes para que regresen pronto."
                  }
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-coral" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{benefit.title}</h4>
                      <p className="text-white/60">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-sm">
              <div className="aspect-video bg-navy rounded-3xl overflow-hidden flex items-center justify-center border border-white/5 shadow-2xl">
                 <div className="text-center p-12">
                   <div className="text-coral text-6xl font-bold mb-4">42%</div>
                   <p className="text-white text-xl font-medium">Incremento promedio en visitas mensuales</p>
                   <p className="text-white/40 mt-4 text-sm italic">Basado en datos de programas de fidelización digitales 2024</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-24 md:py-32 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-navy text-4xl md:text-5xl font-bold mb-6">Planes para cada negocio</h2>
            <p className="text-navy/60 text-lg">Comienza gratis y crece con nosotros.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="p-10 border-none shadow-sm flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-2">Gratis</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-navy">$0</span>
                  <span className="text-navy/40 ml-2">/ siempre</span>
                </div>
                <p className="text-navy/60 text-sm">Perfecto para negocios que están empezando.</p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["Hasta 50 clientes", "1 sucursal", "Tarjeta digital básica", "Soporte por email"].map((feat, i) => (
                  <li key={i} className="flex items-center text-sm text-navy/70">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-green-500" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <Button variante="secundario" className="w-full py-6">Empezar gratis</Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="p-10 border-2 border-coral shadow-2xl flex flex-col relative scale-105">
              <div className="absolute top-0 right-10 -translate-y-1/2">
                <Badge variante="coral" className="px-4 py-1 shadow-lg">MÁS POPULAR</Badge>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-2">Pro</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-navy">$29</span>
                  <span className="text-navy/40 ml-2">/ mes</span>
                </div>
                <p className="text-navy/60 text-sm">Todo lo que necesitas para fidelizar masivamente.</p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["Clientes ilimitados", "Hasta 3 sucursales", "Métricas avanzadas", "Personalización completa", "Soporte prioritario"].map((feat, i) => (
                  <li key={i} className="flex items-center text-sm text-navy/70">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-coral" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <Button variante="primario" className="w-full py-6 text-lg">Prueba 14 días gratis</Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="p-10 border-none shadow-sm flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-navy mb-2">Enterprise</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-navy">Custom</span>
                </div>
                <p className="text-navy/60 text-sm">Para cadenas y franquicias con múltiples sedes.</p>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["Sucursales ilimitadas", "API Access", "Gestor de cuenta dedicado", "Integración con POS", "Custom Domains"].map((feat, i) => (
                  <li key={i} className="flex items-center text-sm text-navy/70">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-navy/40" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Button variante="ghost" className="w-full py-6 border border-navy/10">Hablar con ventas</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-coral text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">¿Listo para transformar tu negocio?</h2>
          <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto">
            Únete a cientos de negocios en Honduras que ya están digitalizando su lealtad con Kanjealo.
          </p>
          <Link href="/sign-up">
            <Button tamaño="xl" className="bg-white text-coral hover:bg-white/90 px-12 text-xl font-bold shadow-2xl">
              Crear mi programa ahora
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

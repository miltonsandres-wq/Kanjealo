import React from "react";
import Link from "next/link";
import { KanjealoLogo } from "../logo";
import { Button } from "../ui/button";

export function MarketingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/">
          <KanjealoLogo tamaño="md" variante="blanco" />
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#como-funciona" className="text-white/70 hover:text-white transition-colors">
            Cómo funciona
          </Link>
          <Link href="#negocios" className="text-white/70 hover:text-white transition-colors">
            Para tu negocio
          </Link>
          <Link href="#precios" className="text-white/70 hover:text-white transition-colors">
            Precios
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/sign-in">
            <Button variante="ghost" className="text-white hover:bg-white/10">
              Iniciar sesión
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variante="primario">
              Empezar gratis
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

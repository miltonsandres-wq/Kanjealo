import React from "react";
import Link from "next/link";
import { KanjealoLogo } from "../logo";

export function MarketingFooter() {
  return (
    <footer className="bg-navy text-white pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <KanjealoLogo tamaño="md" className="mb-6" variante="blanco" />
          <p className="text-white/50 text-sm leading-relaxed">
            Fidelización digital para negocios modernos en Honduras. 
            Transforma clientes casuales en fans leales.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6">Plataforma</h4>
          <ul className="space-y-4 text-white/50 text-sm">
            <li><Link href="#como-funciona" className="hover:text-coral transition-colors">Cómo funciona</Link></li>
            <li><Link href="#precios" className="hover:text-coral transition-colors">Precios</Link></li>
            <li><Link href="/dashboard" className="hover:text-coral transition-colors">Panel de Control</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6">Legal</h4>
          <ul className="space-y-4 text-white/50 text-sm">
            <li><Link href="/terminos" className="hover:text-coral transition-colors">Términos de Servicio</Link></li>
            <li><Link href="/privacidad" className="hover:text-coral transition-colors">Privacidad</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6">Contacto</h4>
          <ul className="space-y-4 text-white/50 text-sm">
            <li className="flex items-center space-x-2">
              <span>hola@kanjealo.hn</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>San Pedro Sula, Honduras</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 text-center text-white/30 text-xs">
        <p>© {new Date().getFullYear()} Kanjealo. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

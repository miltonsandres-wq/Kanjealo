"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, LogOut } from "lucide-react";
import { KanjealoLogo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", href: "/admin" },
  { icon: Building2, label: "Negocios", href: "/admin/negocios" },
  { icon: CreditCard, label: "Pagos", href: "/admin/pagos" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <aside className="w-64 bg-navy h-screen fixed left-0 top-0 text-white flex flex-col z-40">
      <div className="p-8 flex flex-col gap-1">
        <KanjealoLogo tamaño="md" variante="blanco" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-coral ml-[46px]">
          Admin
        </span>
      </div>

      <nav className="flex-grow px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                active
                  ? "bg-coral text-white shadow-lg"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  active ? "text-white" : "text-white/40 group-hover:text-white"
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={() => signOut(() => router.push("/sign-in"))}
          className="flex items-center gap-3 px-4 py-2 text-white/50 hover:text-coral transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

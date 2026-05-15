"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Search, Menu } from "lucide-react";
import { Badge } from "../ui/badge";

export function Topbar() {
  const { user } = useUser();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 right-0 left-64 z-30 px-8 flex items-center justify-between">
      {/* Search / Breadcrumbs placeholder */}
      <div className="flex items-center gap-4 text-navy/40">
        <Search className="w-5 h-5" />
        <span className="text-sm font-medium">Buscar en Kanjealo...</span>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 text-navy/40 hover:text-navy transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full border-2 border-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy leading-none mb-1">
              {user?.fullName || "Administrador"}
            </p>
            <Badge variante="gris" tamaño="sm">Plan Pro</Badge>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

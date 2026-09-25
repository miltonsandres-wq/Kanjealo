"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Menu, Search } from "lucide-react";
import { Badge } from "../ui/badge";

interface TopbarProps {
  onAbrirMenu?: () => void;
}

export function Topbar({ onAbrirMenu }: TopbarProps) {
  const { user } = useUser();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 right-0 left-0 md:left-64 z-30 px-4 md:px-8 flex items-center justify-between">
      {/* Search / Breadcrumbs placeholder */}
      <div className="flex items-center gap-4 text-navy/40">
        <button
          onClick={onAbrirMenu}
          className="md:hidden text-navy/60 hover:text-navy -ml-1 p-1"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Search className="w-5 h-5 hidden sm:block" />
        <span className="text-sm font-medium hidden sm:inline">Buscar en Kanjealo...</span>
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
          <UserButton />
        </div>
      </div>
    </header>
  );
}

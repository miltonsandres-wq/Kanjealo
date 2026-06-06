"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export function AdminTopbar() {
  const { user } = useUser();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 right-0 left-64 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-2 text-navy/40">
        <Shield className="w-4 h-4 text-coral" />
        <span className="text-sm font-semibold text-navy/50">Panel de Administración</span>
      </div>

      <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-navy leading-none mb-1">
            {user?.fullName || "Admin"}
          </p>
          <p className="text-xs text-navy/40">{user?.emailAddresses[0]?.emailAddress}</p>
        </div>
        <UserButton />
      </div>
    </header>
  );
}

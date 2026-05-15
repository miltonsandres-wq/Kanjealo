import React from "react";
import { Card } from "./card";

interface StatCardProps {
  titulo: string;
  valor: string | number;
  icono: string;
  tendencia?: {
    valor: number;
    esPositivo: boolean;
  };
}

export function StatCard({ titulo, valor, icono, tendencia }: StatCardProps) {
  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-outfit text-navy/50">{titulo}</p>
          <p className="text-3xl font-outfit font-bold text-coral">{valor}</p>
          {tendencia && (
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  tendencia.esPositivo ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {tendencia.esPositivo ? "↑" : "↓"} {tendencia.valor}%
              </span>
              <span className="text-xs text-navy/30">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className="text-2xl opacity-80">{icono}</div>
      </div>

      {/* Decoración sutil */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-coral/5 rounded-full" />
    </Card>
  );
}

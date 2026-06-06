import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PagosPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-navy font-outfit">Pagos</h1>
        <p className="text-navy/50 mt-0.5">Historial de suscripciones y cobros.</p>
      </div>

      <Card className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-coral/10 flex items-center justify-center mb-5">
          <CreditCard className="w-8 h-8 text-coral" />
        </div>
        <h2 className="text-xl font-bold text-navy font-outfit mb-2">
          Stripe no está conectado aún
        </h2>
        <p className="text-navy/40 text-sm max-w-sm">
          Cuando integres Stripe Webhooks, aquí aparecerá el historial real de pagos, suscripciones activas y cobros fallidos.
        </p>
      </Card>
    </div>
  );
}

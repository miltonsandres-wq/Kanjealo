"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (el: HTMLElement) => void };
    };
  }
}

const SDK_URL = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;

let sdkPromise: Promise<void> | null = null;

function cargarSdkPaypal(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar el SDK de PayPal"));
      document.body.appendChild(script);
    });
  }
  return sdkPromise;
}

interface PaypalSubscribeButtonProps {
  planId: string;
  onApproved: (subscriptionId: string) => void | Promise<void>;
  onError?: (error: unknown) => void;
}

export function PaypalSubscribeButton({ planId, onApproved, onError }: PaypalSubscribeButtonProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;

    cargarSdkPaypal()
      .then(() => {
        if (cancelado || !contenedorRef.current || !window.paypal) return;
        window.paypal
          .Buttons({
            style: { shape: "pill", color: "gold", layout: "vertical", label: "subscribe" },
            createSubscription: (_data: unknown, actions: { subscription: { create: (opts: { plan_id: string }) => Promise<string> } }) =>
              actions.subscription.create({ plan_id: planId }),
            onApprove: async (data: { subscriptionID: string }) => {
              await onApproved(data.subscriptionID);
            },
            onError: (err: unknown) => onError?.(err),
          })
          .render(contenedorRef.current);
        setCargando(false);
      })
      .catch(() => {
        if (!cancelado) { setError(true); setCargando(false); }
      });

    return () => { cancelado = true; };
  }, [planId, onApproved, onError]);

  if (error) {
    return <p className="text-xs text-red-500">No se pudo cargar el botón de PayPal. Recarga la página.</p>;
  }

  return (
    <div>
      {cargando && (
        <div className="h-11 rounded-full bg-navy/5 animate-pulse" />
      )}
      <div ref={contenedorRef} />
    </div>
  );
}

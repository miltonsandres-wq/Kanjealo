"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import type { Negocio, LoyaltyConfig } from "./types";

export function useNegocio() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [cargando, setCargando] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("negocios")
      .select("*")
      .eq("clerk_org_id", userId)
      .maybeSingle();
    setNegocio(data ?? null);
    setCargando(false);
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) { setCargando(false); return; }
    refetch();
  }, [isLoaded, userId, refetch]);

  return { negocio, cargando, refetch };
}

export function useLoyaltyConfig(businessId: string | undefined) {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [cargando, setCargando] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) return;
    setCargando(true);
    const { data } = await supabase
      .from("loyalty_config")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();
    setConfig(data ?? null);
    setCargando(false);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) { setCargando(false); return; }
    refetch();
  }, [businessId, refetch]);

  return { config, cargando, refetch };
}

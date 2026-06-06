"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function toggleNegocio(id: string, nuevoEstado: boolean) {
  const { error } = await supabaseAdmin
    .from("negocios")
    .update({ esta_activo: nuevoEstado })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

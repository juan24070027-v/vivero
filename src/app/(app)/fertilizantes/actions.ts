"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

const fertilizerSchema = z.object({
  common_name: z.string().trim().min(1, "El nombre es obligatorio."),
  unit_label: z.string().trim().min(1, "Indica cómo se vende (kg, saco 25kg, bidón 20L…)."),
  unit_price: z.coerce.number().min(0, "No puede ser negativo."),
  stock: z.coerce.number().min(0, "No puede ser negativo."),
});

export interface FertilizerFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(parsed: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of parsed.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createFertilizer(_prev: FertilizerFormState, formData: FormData): Promise<FertilizerFormState> {
  await requireProfile();
  const parsed = fertilizerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fertilizers").insert(parsed.data);
  if (error) return { error: "No se pudo guardar el fertilizante. Intenta de nuevo." };

  revalidatePath("/fertilizantes");
  revalidatePath("/dashboard");
  redirect("/fertilizantes?created=1");
}

export async function updateFertilizer(id: string, _prev: FertilizerFormState, formData: FormData): Promise<FertilizerFormState> {
  await requireProfile();
  const parsed = fertilizerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fertilizers").update(parsed.data).eq("id", id);
  if (error) return { error: "No se pudo actualizar el fertilizante. Intenta de nuevo." };

  revalidatePath("/fertilizantes");
  revalidatePath("/dashboard");
  redirect("/fertilizantes?updated=1");
}

export async function deleteFertilizer(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("fertilizers").delete().eq("id", id);
  revalidatePath("/fertilizantes");
  revalidatePath("/dashboard");
}

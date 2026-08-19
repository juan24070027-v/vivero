"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

const clientSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Correo inválido.").optional().or(z.literal("")),
  notes: z.string().trim().optional(),
});

export interface ClientFormState {
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

export async function createClientRecord(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireProfile();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert(parsed.data);
  if (error) return { error: "No se pudo guardar el cliente. Intenta de nuevo." };

  revalidatePath("/clientes");
  redirect("/clientes?created=1");
}

export async function updateClientRecord(id: string, _prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireProfile();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Revisa los campos marcados.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
  if (error) return { error: "No se pudo actualizar el cliente. Intenta de nuevo." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}?updated=1`);
}

export async function deleteClientRecord(formData: FormData) {
  await requireProfile();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/clientes");
  redirect("/clientes");
}

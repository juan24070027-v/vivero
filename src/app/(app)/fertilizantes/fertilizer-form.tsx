"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, Input } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import type { Fertilizer } from "@/lib/types";
import type { FertilizerFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

export function FertilizerForm({
  action,
  fertilizer,
  submitLabel,
}: {
  action: (prev: FertilizerFormState, formData: FormData) => Promise<FertilizerFormState>;
  fertilizer?: Fertilizer;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <Field label="Nombre" htmlFor="common_name" required error={state.fieldErrors?.common_name}>
        <Input id="common_name" name="common_name" defaultValue={fertilizer?.common_name} placeholder="Triple 17, Urea, Foliar orgánico…" required />
      </Field>
      <Field
        label="Presentación"
        htmlFor="unit_label"
        required
        hint="Cómo se vende: kg, Saco 25kg, Bidón 20L…"
        error={state.fieldErrors?.unit_label}
      >
        <Input id="unit_label" name="unit_label" defaultValue={fertilizer?.unit_label ?? "kg"} required />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Precio unitario (MXN)" htmlFor="unit_price" required error={state.fieldErrors?.unit_price}>
          <Input id="unit_price" name="unit_price" type="number" min={0} step="0.01" defaultValue={fertilizer?.unit_price ?? 0} required />
        </Field>
        <Field label="Existencias" htmlFor="stock" required error={state.fieldErrors?.stock}>
          <Input id="stock" name="stock" type="number" min={0} step="0.01" defaultValue={fertilizer?.stock ?? 0} required />
        </Field>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <LinkButton href="/fertilizantes" variant="secondary">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}

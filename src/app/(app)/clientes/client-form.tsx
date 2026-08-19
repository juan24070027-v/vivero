"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import type { Client } from "@/lib/types";
import type { ClientFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : label}
    </Button>
  );
}

export function ClientForm({
  action,
  client,
  submitLabel,
  cancelHref,
}: {
  action: (prev: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  client?: Client;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <Field label="Nombre o razón social" htmlFor="name" required error={state.fieldErrors?.name}>
        <Input id="name" name="name" defaultValue={client?.name} required />
      </Field>
      <Field label="Dirección" htmlFor="address" error={state.fieldErrors?.address}>
        <Input id="address" name="address" defaultValue={client?.address ?? ""} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Teléfono" htmlFor="phone" error={state.fieldErrors?.phone}>
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field label="Correo" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
        </Field>
      </div>
      <Field label="Notas" htmlFor="notes" error={state.fieldErrors?.notes}>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} rows={3} />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <LinkButton href={cancelHref} variant="secondary">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}

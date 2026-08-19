import { ClientForm } from "../client-form";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Nuevo cliente</h1>
        <p className="text-sm text-stone-500">Agrégalo para no volver a escribir sus datos en cada cotización.</p>
      </div>
      <ClientForm action={createClientRecord} submitLabel="Guardar cliente" cancelHref="/clientes" />
    </div>
  );
}

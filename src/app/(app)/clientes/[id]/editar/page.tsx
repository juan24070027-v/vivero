import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "../../client-form";
import { updateClientRecord } from "../../actions";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();

  if (!client) notFound();

  const action = updateClientRecord.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Editar cliente</h1>
        <p className="text-sm text-stone-500">
          {client.code} · {client.name}
        </p>
      </div>
      <ClientForm action={action} client={client} submitLabel="Guardar cambios" cancelHref={`/clientes/${id}`} />
    </div>
  );
}

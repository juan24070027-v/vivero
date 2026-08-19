import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FertilizerForm } from "../../fertilizer-form";
import { updateFertilizer } from "../../actions";

export default async function EditFertilizerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: fertilizer } = await supabase.from("fertilizers").select("*").eq("id", id).single();

  if (!fertilizer) notFound();

  const action = updateFertilizer.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Editar fertilizante</h1>
        <p className="text-sm text-stone-500">
          {fertilizer.code} · {fertilizer.common_name}
        </p>
      </div>
      <FertilizerForm action={action} fertilizer={fertilizer} submitLabel="Guardar cambios" />
    </div>
  );
}

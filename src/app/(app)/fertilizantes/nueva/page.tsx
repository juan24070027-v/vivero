import { FertilizerForm } from "../fertilizer-form";
import { createFertilizer } from "../actions";

export default function NewFertilizerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Nuevo fertilizante</h1>
        <p className="text-sm text-stone-500">Agrega un producto al catálogo de fertilizantes.</p>
      </div>
      <FertilizerForm action={createFertilizer} submitLabel="Guardar fertilizante" />
    </div>
  );
}

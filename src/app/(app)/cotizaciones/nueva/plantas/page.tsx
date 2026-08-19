import { createClient } from "@/lib/supabase/server";
import { QuotationBuilder, type PickerProduct, type PickerClient } from "../../quotation-builder";

export default async function NewPlantQuotationPage() {
  const supabase = await createClient();
  const [{ data: plants }, { data: clients }] = await Promise.all([
    supabase.from("plants").select("*").order("common_name"),
    supabase.from("clients").select("id, name, address").order("name"),
  ]);

  const products: PickerProduct[] = (plants ?? []).map((p) => ({
    id: p.id,
    commonName: p.common_name,
    scientificName: p.scientific_name,
  }));

  const pickerClients: PickerClient[] = clients ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Cotizar plantas</h1>
        <p className="text-sm text-stone-500">Arma una cotización con el catálogo de plantas.</p>
      </div>
      <QuotationBuilder productType="plantas" products={products} clients={pickerClients} />
    </div>
  );
}

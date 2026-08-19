import { createClient } from "@/lib/supabase/server";
import { QuotationBuilder, type PickerProduct, type PickerClient } from "../../quotation-builder";

export default async function NewSeedQuotationPage() {
  const supabase = await createClient();
  const [{ data: seeds }, { data: clients }] = await Promise.all([
    supabase.from("seeds").select("*").order("common_name"),
    supabase.from("clients").select("id, name, address").order("name"),
  ]);

  const products: PickerProduct[] = (seeds ?? []).map((s) => ({
    id: s.id,
    commonName: s.common_name,
    scientificName: s.scientific_name,
    classification: s.classification,
    availableMonths: s.available_months ?? undefined,
    seedsPerKilo: s.seeds_per_kilo ?? undefined,
    unitPrice: s.unit_price,
    stock: s.stock_kg,
  }));

  const pickerClients: PickerClient[] = clients ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Cotizar semillas</h1>
        <p className="text-sm text-stone-500">Arma una cotización con el catálogo de semillas.</p>
      </div>
      <QuotationBuilder productType="semillas" products={products} clients={pickerClients} />
    </div>
  );
}

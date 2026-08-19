import { createClient } from "@/lib/supabase/server";
import { QuotationBuilder, type PickerProduct, type PickerClient } from "../../quotation-builder";

export default async function NewFertilizerQuotationPage() {
  const supabase = await createClient();
  const [{ data: fertilizers }, { data: clients }] = await Promise.all([
    supabase.from("fertilizers").select("*").order("common_name"),
    supabase.from("clients").select("id, name, address").order("name"),
  ]);

  const products: PickerProduct[] = (fertilizers ?? []).map((f) => ({
    id: f.id,
    commonName: f.common_name,
    unitPrice: f.unit_price,
    stock: f.stock,
    unitLabel: f.unit_label,
  }));

  const pickerClients: PickerClient[] = clients ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Cotizar fertilizantes</h1>
        <p className="text-sm text-stone-500">Arma una cotización con el catálogo de fertilizantes.</p>
      </div>
      <QuotationBuilder productType="fertilizantes" products={products} clients={pickerClients} />
    </div>
  );
}

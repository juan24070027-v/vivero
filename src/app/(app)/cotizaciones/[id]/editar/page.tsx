import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuotationBuilder, type PickerProduct, type PickerClient, type ExistingQuotation } from "../../quotation-builder";

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotation } = await supabase.from("quotations").select("*").eq("id", id).single();
  if (!quotation) notFound();
  if (quotation.status !== "pendiente") {
    redirect(`/cotizaciones/${id}?cannotEdit=1`);
  }

  const [{ data: items }, { data: clients }] = await Promise.all([
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("sort_order", { ascending: true }),
    supabase.from("clients").select("id, name, address").order("name"),
  ]);

  let products: PickerProduct[] = [];
  if (quotation.product_type === "semillas") {
    const { data } = await supabase.from("seeds").select("*").order("common_name");
    products = (data ?? []).map((s) => ({
      id: s.id,
      commonName: s.common_name,
      scientificName: s.scientific_name,
      classification: s.classification,
      availableMonths: s.available_months ?? undefined,
      seedsPerKilo: s.seeds_per_kilo ?? undefined,
      unitPrice: s.unit_price,
      stock: s.stock_kg,
    }));
  } else if (quotation.product_type === "plantas") {
    const { data } = await supabase.from("plants").select("*").order("common_name");
    products = (data ?? []).map((p) => ({ id: p.id, commonName: p.common_name, scientificName: p.scientific_name }));
  } else {
    const { data } = await supabase.from("fertilizers").select("*").order("common_name");
    products = (data ?? []).map((f) => ({
      id: f.id,
      commonName: f.common_name,
      unitPrice: f.unit_price,
      stock: f.stock,
      unitLabel: f.unit_label,
    }));
  }

  const pickerClients: PickerClient[] = clients ?? [];

  const existingQuotation: ExistingQuotation = {
    id: quotation.id,
    clientId: quotation.client_id,
    clientName: quotation.client_name,
    clientAddress: quotation.client_address,
    quoteDate: quotation.quote_date,
    validityDays: quotation.validity_days,
    quoteCity: quotation.quote_city,
    notes: quotation.notes,
    conditions: quotation.conditions,
    taxRate: quotation.tax_rate,
    discountType: quotation.discount_type,
    discountValue: quotation.discount_value,
    shippingCost: quotation.shipping_cost,
    items: (items ?? []).map((i) => ({
      seedId: i.seed_id,
      plantId: i.plant_id,
      fertilizerId: i.fertilizer_id,
      commonName: i.common_name,
      scientificName: i.scientific_name,
      classification: i.classification,
      availableMonths: i.available_months,
      seedsPerKilo: i.seeds_per_kilo,
      bagSize: i.bag_size,
      height: i.height,
      unitLabel: i.unit_label,
      unitPrice: i.unit_price,
      quantity: i.quantity,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Editar cotización {quotation.folio}</h1>
        <p className="text-sm text-stone-500">Solo se puede editar mientras esté pendiente.</p>
      </div>
      <QuotationBuilder productType={quotation.product_type} products={products} clients={pickerClients} existingQuotation={existingQuotation} />
    </div>
  );
}

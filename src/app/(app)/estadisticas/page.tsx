import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import { RevenueChart, StatusPieChart, ProductTypeBarChart } from "./charts";
import type { QuotationStatus } from "@/lib/types";

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default async function StatisticsPage() {
  const supabase = await createClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [{ data: quotations }, { data: lowSeeds }, { data: lowFertilizers }] = await Promise.all([
    supabase
      .from("quotations")
      .select("product_type, status, total, quote_date, client_name")
      .gte("quote_date", sixMonthsAgo.toISOString().slice(0, 10)),
    supabase.from("seeds").select("id, common_name, stock_kg").lt("stock_kg", 5).order("stock_kg", { ascending: true }).limit(5),
    supabase.from("fertilizers").select("id, common_name, stock, unit_label").lt("stock", 5).order("stock", { ascending: true }).limit(5),
  ]);

  const allQuotations = quotations ?? [];
  const revenueQuotations = allQuotations.filter((q) => q.status === "aprobada" || q.status === "facturada");

  // Ingresos por mes (últimos 6 meses, con meses en cero incluidos)
  const monthBuckets: { key: string; month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthBuckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, total: 0 });
  }
  for (const q of revenueQuotations) {
    const d = new Date(`${q.quote_date}T12:00:00`);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthBuckets.find((b) => b.key === key);
    if (bucket) bucket.total += q.total;
  }

  // Desglose por estado
  const statuses: QuotationStatus[] = ["pendiente", "aprobada", "rechazada", "facturada"];
  const statusBreakdown = statuses.map((status) => ({
    status,
    count: allQuotations.filter((q) => q.status === status).length,
  }));

  // Desglose por tipo de producto (monto)
  const productTypeBreakdown = [
    { type: "Semillas", total: revenueQuotations.filter((q) => q.product_type === "semillas").reduce((s, q) => s + q.total, 0) },
    { type: "Plantas", total: revenueQuotations.filter((q) => q.product_type === "plantas").reduce((s, q) => s + q.total, 0) },
    { type: "Fertilizantes", total: revenueQuotations.filter((q) => q.product_type === "fertilizantes").reduce((s, q) => s + q.total, 0) },
  ];

  // Top clientes por monto cotizado (aprobado/facturado)
  const clientTotals = new Map<string, { total: number; count: number }>();
  for (const q of revenueQuotations) {
    const entry = clientTotals.get(q.client_name) ?? { total: 0, count: 0 };
    entry.total += q.total;
    entry.count += 1;
    clientTotals.set(q.client_name, entry);
  }
  const topClients = Array.from(clientTotals.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalRevenue = revenueQuotations.reduce((s, q) => s + q.total, 0);
  const conversionRate = allQuotations.length > 0 ? Math.round((revenueQuotations.length / allQuotations.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-forest-900">Estadísticas</h1>
        <p className="text-sm text-stone-500">Últimos 6 meses. Solo cuenta como ingreso lo aprobado o facturado.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs text-stone-500">Ingresos (6 meses)</p>
            <p className="font-display text-2xl text-forest-900 mt-1">{formatCurrency(totalRevenue)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-stone-500">Cotizaciones (6 meses)</p>
            <p className="font-display text-2xl text-forest-900 mt-1">{allQuotations.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-stone-500">Tasa de conversión</p>
            <p className="font-display text-2xl text-forest-900 mt-1">{conversionRate}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-stone-500">Clientes activos</p>
            <p className="font-display text-2xl text-forest-900 mt-1">{clientTotals.size}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg text-forest-900">Ingresos por mes</h2>
          </CardHeader>
          <CardBody>
            <RevenueChart data={monthBuckets} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-forest-900">Cotizaciones por estado</h2>
          </CardHeader>
          <CardBody>
            <StatusPieChart data={statusBreakdown} />
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
              {statusBreakdown.map((s) => (
                <span key={s.status} className="text-xs text-stone-500">
                  {QUOTATION_STATUS_LABELS[s.status]}: <strong className="text-forest-800">{s.count}</strong>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-forest-900">Ingresos por producto</h2>
          </CardHeader>
          <CardBody>
            <ProductTypeBarChart data={productTypeBreakdown} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-forest-900">Clientes top</h2>
          </CardHeader>
          <CardBody className="p-0">
            {topClients.length > 0 ? (
              <ul className="divide-y divide-stone-100">
                {topClients.map((c) => (
                  <li key={c.name} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-forest-900 truncate">{c.name}</p>
                      <p className="text-xs text-stone-500">{c.count} cotización(es)</p>
                    </div>
                    <span className="text-sm font-medium text-forest-800 shrink-0">{formatCurrency(c.total)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500 text-center py-10">Aún no hay cotizaciones aprobadas.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg text-forest-900">Stock bajo</h2>
          </CardHeader>
          <CardBody className="p-0">
            {(lowSeeds && lowSeeds.length > 0) || (lowFertilizers && lowFertilizers.length > 0) ? (
              <ul className="divide-y divide-stone-100">
                {lowSeeds?.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-forest-900 truncate">{s.common_name}</span>
                    <span className="text-xs font-medium text-clay-700">{s.stock_kg} kg</span>
                  </li>
                ))}
                {lowFertilizers?.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-forest-900 truncate">{f.common_name}</span>
                    <span className="text-xs font-medium text-clay-700">
                      {f.stock} {f.unit_label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500 text-center py-10">Sin alertas de inventario.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

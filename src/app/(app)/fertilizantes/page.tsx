import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, Table, Th, Td } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { ToastOnParam } from "@/components/ui/toast-on-param";
import { formatCurrency } from "@/lib/utils";
import { deleteFertilizer } from "./actions";
import { Plus, Pencil, Trash2, Search, Beaker } from "lucide-react";

export default async function FertilizersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("fertilizers").select("*").order("common_name", { ascending: true });
  if (q) {
    query = query.ilike("common_name", `%${q}%`);
  }
  const { data: fertilizers } = await query;

  return (
    <div className="space-y-6">
      <ToastOnParam param="created" message="Fertilizante agregado al catálogo." />
      <ToastOnParam param="updated" message="Fertilizante actualizado." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-forest-900">Fertilizantes</h1>
          <p className="text-sm text-stone-500">Catálogo e inventario de fertilizantes y agroquímicos.</p>
        </div>
        <LinkButton href="/fertilizantes/nueva">
          <Plus size={16} /> Nuevo fertilizante
        </LinkButton>
      </div>

      <Card>
        <CardBody>
          <form className="mb-4" action="/fertilizantes">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input name="q" defaultValue={q} placeholder="Buscar por nombre…" className="pl-9" />
            </div>
          </form>

          {fertilizers && fertilizers.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Nombre</Th>
                  <Th>Presentación</Th>
                  <Th className="text-right">Precio</Th>
                  <Th className="text-right">Existencias</Th>
                  <Th className="text-right">Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {fertilizers.map((f) => (
                  <tr key={f.id} className="hover:bg-stone-50">
                    <Td className="text-stone-500 font-mono text-xs">{f.code}</Td>
                    <Td className="font-medium text-forest-900">{f.common_name}</Td>
                    <Td className="text-stone-600">{f.unit_label}</Td>
                    <Td className="text-right font-medium text-forest-900">{formatCurrency(f.unit_price)}</Td>
                    <Td className="text-right">
                      <span className={f.stock < 5 ? "text-clay-700 font-medium" : "text-stone-700"}>
                        {f.stock} {f.unit_label}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <LinkButton href={`/fertilizantes/${f.id}/editar`} variant="ghost" size="sm" aria-label="Editar">
                          <Pencil size={15} />
                        </LinkButton>
                        <form action={deleteFertilizer}>
                          <input type="hidden" name="id" value={f.id} />
                          <ConfirmSubmitButton
                            confirmMessage={`¿Eliminar "${f.common_name}" del catálogo? Esto no afecta cotizaciones ya generadas.`}
                            variant="ghost"
                            size="sm"
                            aria-label="Eliminar"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-16">
              <Beaker className="mx-auto text-stone-300" size={40} />
              <p className="mt-3 text-stone-500">{q ? "No se encontraron fertilizantes." : "Aún no hay fertilizantes registrados."}</p>
              {!q && (
                <LinkButton href="/fertilizantes/nueva" size="sm" className="mt-4">
                  <Plus size={16} /> Agregar el primero
                </LinkButton>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

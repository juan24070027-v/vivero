import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, Badge, Table, Th, Td } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { ToastOnParam } from "@/components/ui/toast-on-param";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import { deleteClientRecord } from "../actions";
import { ChevronLeft, Pencil, Trash2, Mail, Phone, MapPin, Plus } from "lucide-react";
import type { QuotationStatus } from "@/lib/types";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const { data: quotations } = await supabase
    .from("quotations")
    .select("id, folio, product_type, status, total, quote_date")
    .eq("client_id", id)
    .order("quote_date", { ascending: false });

  const totalQuoted = (quotations ?? []).reduce((sum, q) => sum + q.total, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <ToastOnParam param="updated" message="Cliente actualizado." />

      <div>
        <Link href="/clientes" className="text-sm text-forest-700 hover:underline flex items-center gap-1 mb-3">
          <ChevronLeft size={15} /> Clientes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-forest-900">{client.name}</h1>
            <p className="text-sm text-stone-500 mt-0.5">{client.code}</p>
          </div>
          <div className="flex gap-2">
            <LinkButton href={`/clientes/${id}/editar`} variant="secondary" size="sm">
              <Pencil size={15} /> Editar
            </LinkButton>
            <form action={deleteClientRecord}>
              <input type="hidden" name="id" value={id} />
              <ConfirmSubmitButton
                confirmMessage={`¿Eliminar a "${client.name}"? Sus cotizaciones pasadas se conservan.`}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Eliminar
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </div>

      <Card>
        <CardBody className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2 text-stone-600">
            <MapPin size={16} className="shrink-0 mt-0.5 text-stone-400" />
            {client.address || "Sin dirección registrada"}
          </div>
          <div className="flex items-start gap-2 text-stone-600">
            <Phone size={16} className="shrink-0 mt-0.5 text-stone-400" />
            {client.phone || "—"}
          </div>
          <div className="flex items-start gap-2 text-stone-600">
            <Mail size={16} className="shrink-0 mt-0.5 text-stone-400" />
            {client.email || "—"}
          </div>
          {client.notes && <p className="sm:col-span-3 text-stone-600 pt-2 border-t border-stone-100">{client.notes}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <h2 className="font-display text-lg text-forest-900">Cotizaciones</h2>
            {quotations && quotations.length > 0 && (
              <p className="text-xs text-stone-500 mt-0.5">
                {quotations.length} cotización{quotations.length === 1 ? "" : "es"} · {formatCurrency(totalQuoted)} en total
              </p>
            )}
          </div>
          <LinkButton href="/cotizaciones/nueva/semillas" size="sm" variant="secondary">
            <Plus size={15} /> Nueva
          </LinkButton>
        </CardHeader>
        <CardBody className="p-0">
          {quotations && quotations.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Folio</Th>
                  <Th>Tipo</Th>
                  <Th>Fecha</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-stone-50">
                    <Td>
                      <Link href={`/cotizaciones/${q.id}`} className="font-mono text-xs text-forest-700 hover:underline">
                        {q.folio}
                      </Link>
                    </Td>
                    <Td className="capitalize text-stone-600">{q.product_type}</Td>
                    <Td className="text-stone-600">{formatShortDate(q.quote_date)}</Td>
                    <Td className="text-right font-medium text-forest-900">{formatCurrency(q.total)}</Td>
                    <Td>
                      <Badge tone={statusTone(q.status)}>{QUOTATION_STATUS_LABELS[q.status]}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-sm text-stone-500 text-center py-10">Este cliente aún no tiene cotizaciones.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function statusTone(status: QuotationStatus): "warning" | "success" | "danger" | "info" {
  if (status === "pendiente") return "warning";
  if (status === "aprobada") return "success";
  if (status === "rechazada") return "danger";
  return "info";
}

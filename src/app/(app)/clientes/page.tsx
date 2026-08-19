import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, Table, Th, Td } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ToastOnParam } from "@/components/ui/toast-on-param";
import { Plus, Search, Users, Mail, Phone } from "lucide-react";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name", { ascending: true });
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <ToastOnParam param="created" message="Cliente agregado." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-forest-900">Clientes</h1>
          <p className="text-sm text-stone-500">Registro de clientes para agilizar las cotizaciones.</p>
        </div>
        <LinkButton href="/clientes/nuevo">
          <Plus size={16} /> Nuevo cliente
        </LinkButton>
      </div>

      <Card>
        <CardBody>
          <form className="mb-4" action="/clientes">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input name="q" defaultValue={q} placeholder="Buscar por nombre…" className="pl-9" />
            </div>
          </form>

          {clients && clients.length > 0 ? (
            <Table>
              <thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Contacto</Th>
                  <Th>Dirección</Th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-stone-50">
                    <Td>
                      <Link href={`/clientes/${client.id}`} className="font-medium text-forest-900 hover:underline">
                        {client.name}
                      </Link>
                      <p className="text-xs text-stone-500 font-mono">{client.code}</p>
                    </Td>
                    <Td className="text-stone-600">
                      <div className="space-y-0.5">
                        {client.phone && (
                          <p className="flex items-center gap-1.5 text-xs">
                            <Phone size={12} /> {client.phone}
                          </p>
                        )}
                        {client.email && (
                          <p className="flex items-center gap-1.5 text-xs">
                            <Mail size={12} /> {client.email}
                          </p>
                        )}
                        {!client.phone && !client.email && "—"}
                      </div>
                    </Td>
                    <Td className="text-stone-600 text-sm">{client.address || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-16">
              <Users className="mx-auto text-stone-300" size={40} />
              <p className="mt-3 text-stone-500">{q ? "No se encontraron clientes." : "Aún no hay clientes registrados."}</p>
              {!q && (
                <LinkButton href="/clientes/nuevo" size="sm" className="mt-4">
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

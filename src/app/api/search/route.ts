import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export const runtime = "nodejs";

export interface SearchResult {
  type: "seed" | "plant" | "fertilizer" | "client" | "quotation";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export async function GET(request: Request) {
  await requireProfile();
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] satisfies SearchResult[] });
  }

  const supabase = await createClient();
  const like = `%${q}%`;

  const [seeds, plants, fertilizers, clients, quotations] = await Promise.all([
    supabase.from("seeds").select("id, common_name, scientific_name").ilike("common_name", like).limit(5),
    supabase.from("plants").select("id, common_name, scientific_name").ilike("common_name", like).limit(5),
    supabase.from("fertilizers").select("id, common_name, unit_label").ilike("common_name", like).limit(5),
    supabase.from("clients").select("id, name").ilike("name", like).limit(5),
    supabase.from("quotations").select("id, folio, client_name").or(`client_name.ilike.${like},folio.ilike.${like}`).limit(5),
  ]);

  const results: SearchResult[] = [
    ...(seeds.data ?? []).map((s) => ({
      type: "seed" as const,
      id: s.id,
      title: s.common_name,
      subtitle: s.scientific_name,
      href: `/semillas/${s.id}/editar`,
    })),
    ...(plants.data ?? []).map((p) => ({
      type: "plant" as const,
      id: p.id,
      title: p.common_name,
      subtitle: p.scientific_name,
      href: `/plantas/${p.id}/editar`,
    })),
    ...(fertilizers.data ?? []).map((f) => ({
      type: "fertilizer" as const,
      id: f.id,
      title: f.common_name,
      subtitle: f.unit_label,
      href: `/fertilizantes/${f.id}/editar`,
    })),
    ...(clients.data ?? []).map((c) => ({
      type: "client" as const,
      id: c.id,
      title: c.name,
      href: `/clientes/${c.id}`,
    })),
    ...(quotations.data ?? []).map((q) => ({
      type: "quotation" as const,
      id: q.id,
      title: q.folio,
      subtitle: q.client_name,
      href: `/cotizaciones/${q.id}`,
    })),
  ];

  return NextResponse.json({ results });
}

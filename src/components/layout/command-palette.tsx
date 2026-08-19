"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sprout, Trees, Beaker, Users, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/app/api/search/route";

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  seed: "Semilla",
  plant: "Planta",
  fertilizer: "Fertilizante",
  client: "Cliente",
  quotation: "Cotización",
};

const TYPE_ICONS: Record<SearchResult["type"], typeof Sprout> = {
  seed: Sprout,
  plant: Trees,
  fertilizer: Beaker,
  client: Users,
  quotation: FileSpreadsheet,
};

/**
 * Se monta solo cuando está abierto (ver AppChrome), así que cada apertura
 * arranca con estado limpio de forma natural — sin necesitar un efecto que
 * resetee manualmente al cambiar `open`.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch {
        // petición cancelada o de red — se ignora
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const trimmedQuery = query.trim();
  const visibleResults = trimmedQuery.length >= 2 ? results : [];

  function navigateTo(result: SearchResult) {
    onClose();
    router.push(result.href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = visibleResults[activeIndex];
      if (r) navigateTo(r);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-forest-950/50" />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-stone-200">
          <Search size={18} className="text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar semillas, plantas, clientes, cotizaciones…"
            className="flex-1 h-12 outline-none text-sm bg-transparent"
          />
          <kbd className="hidden sm:inline text-[10px] border border-stone-300 rounded px-1.5 py-0.5 text-stone-400 shrink-0">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {loading && <p className="px-4 py-6 text-sm text-stone-400 text-center">Buscando…</p>}
          {!loading && trimmedQuery.length >= 2 && visibleResults.length === 0 && (
            <p className="px-4 py-6 text-sm text-stone-400 text-center">Sin resultados para &quot;{query}&quot;</p>
          )}
          {!loading && trimmedQuery.length < 2 && (
            <p className="px-4 py-6 text-sm text-stone-400 text-center">Escribe al menos 2 letras…</p>
          )}
          {!loading &&
            visibleResults.map((r, idx) => {
              const Icon = TYPE_ICONS[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => navigateTo(r)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left", idx === activeIndex && "bg-forest-50")}
                >
                  <Icon size={16} className="text-forest-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-forest-900 truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-stone-500 truncate">{r.subtitle}</p>}
                  </div>
                  <span className="text-[10px] uppercase text-stone-400 shrink-0">{TYPE_LABELS[r.type]}</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

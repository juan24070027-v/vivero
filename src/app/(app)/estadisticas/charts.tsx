"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { QUOTATION_STATUS_LABELS } from "@/lib/constants";
import type { QuotationStatus } from "@/lib/types";

const FOREST = "#2e6349";
const CLAY = "#cfa13d";
const STATUS_COLORS: Record<QuotationStatus, string> = {
  pendiente: "#cfa13d",
  aprobada: "#2e6349",
  rechazada: "#dc2626",
  facturada: "#3b82f6",
};

export function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={{ stroke: "#e7e5e4" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#78716c" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 13 }}
        />
        <Bar dataKey="total" fill={FOREST} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: { status: QuotationStatus; count: number }[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) {
    return <p className="text-sm text-stone-400 text-center py-16">Sin cotizaciones todavía.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={filtered} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {filtered.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, QUOTATION_STATUS_LABELS[name as QuotationStatus]] as [number, string]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 13 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProductTypeBarChart({ data }: { data: { type: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
        <YAxis type="category" dataKey="type" tick={{ fontSize: 12, fill: "#1b342a" }} axisLine={false} tickLine={false} width={90} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 13 }} />
        <Bar dataKey="total" fill={CLAY} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

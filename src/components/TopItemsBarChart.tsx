"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ItemTotal } from "@/lib/stats";
import { formatFull } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PALETTE = ["#d4a843", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#f0d078", "#2dd4bf", "#fb923c"];

function truncate(name: string, max = 16): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function ItemsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ItemTotal;
  const index = payload[0].index ?? 0;
  return (
    <div className="rounded-lg border border-night-600 bg-night-900/95 px-3.5 py-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
      <p className="flex items-center gap-2 text-xs font-bold text-ink">
        <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
        {item.name}
      </p>
      <p className="mt-1 text-[11px] text-ink-muted">
        <span className="font-extrabold text-gold-300">{formatFull(item.qty)}</span> unidades
      </p>
    </div>
  );
}

export function TopItemsBarChart({ data }: { data: ItemTotal[] }) {
  const height = Math.max(260, data.length * 38);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 42, left: 0, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8888a0", fontSize: 11 }}
            tickFormatter={(name: string) => truncate(name)}
          />
          <Tooltip content={<ItemsTooltip />} cursor={{ fill: "#2a2a3a", fillOpacity: 0.35 }} />
          <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((item) => (
              <Cell key={item.name} fill={PALETTE[data.indexOf(item) % PALETTE.length]} fillOpacity={0.9} />
            ))}
            <LabelList dataKey="qty" position="right" fill="#8888a0" fontSize={11} formatter={(v: unknown) => `${v}×`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

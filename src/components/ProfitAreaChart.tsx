"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "@/lib/stats";
import { formatFull, formatGP } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */

function ProfitTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as DayPoint;
  const positive = point.profit >= 0;
  return (
    <div className="rounded-lg border border-night-600 bg-night-900/95 px-3.5 py-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${positive ? "text-green-400" : "text-red-400"}`}>
        {positive ? "+" : ""}
        {formatGP(point.profit)} profit
      </p>
      <p className="mt-0.5 text-[11px] text-ink-muted">Loot: {formatFull(point.loot)} gp</p>
      <p className="text-[11px] text-ink-muted">
        {point.hunts} {point.hunts === 1 ? "sessão" : "sessões"}
      </p>
    </div>
  );
}

export function ProfitAreaChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-[260px] w-full sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4a843" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#d4a843" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#d4a843" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2a3a" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#8888a0", fontSize: 11 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
            dy={8}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v: number) => formatGP(v)}
            tick={{ fill: "#8888a0", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<ProfitTooltip />} cursor={{ stroke: "#a07820", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#d4a843"
            strokeWidth={2.5}
            fill="url(#goldGradient)"
            dot={false}
            activeDot={{ r: 4.5, fill: "#f0d078", stroke: "#0f0f14", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

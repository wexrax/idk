"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MrrPoint } from "@/lib/api/contracts";
import { formatCurrencyRub } from "@/lib/utils";

type MrrChartProps = {
  data: MrrPoint[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatCompactRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function MrrChart({ data }: MrrChartProps) {
  const titleId = useId();
  const chartData = data.map((point) => ({
    ...point,
    label: formatDate(point.date),
  }));

  return (
    <div className="admin-panel min-h-[292px] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="max-w-xs text-base font-bold leading-5 text-white">
          Динамика MRR и новых пользователей
        </h2>
        <div className="flex rounded-[10px] border border-white/[0.06] bg-bg-elevated p-1">
          {["30д", "90д", "12м"].map((period, index) => (
            <span
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                index === 0 ? "admin-gradient text-white shadow-lg shadow-brand-primary/20" : "text-text-secondary"
              }`}
              key={period}
            >
              {period}
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only" id={titleId}>
        Динамика MRR
      </p>
      <div aria-labelledby={titleId} className="h-48 xl:h-52" role="img">
        <ResponsiveContainer height="100%" initialDimension={{ height: 288, width: 640 }} width="100%">
          <AreaChart data={chartData} margin={{ bottom: 0, left: 0, right: 8, top: 12 }}>
            <defs>
              <linearGradient id="mrrFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.68} />
                <stop offset="95%" stopColor="#3aa0ff" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.075)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#7a8194", fontSize: 12 }}
              tickLine={false}
              hide
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#7a8194", fontSize: 12 }}
              tickFormatter={formatCompactRub}
              tickLine={false}
              width={64}
              hide
            />
            <Tooltip
              contentStyle={{
                background: "#11141c",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#e6e9ef",
              }}
              formatter={(value) => [formatCurrencyRub(Number(value)), "MRR"]}
              labelStyle={{ color: "#a8b0c2" }}
            />
            <Area
              dataKey="mrr"
              fill="url(#mrrFill)"
              stroke="#7c5cff"
              strokeWidth={3}
              type="monotone"
            />
            <Line
              dataKey="new_users"
              dot={false}
              stroke="#3aa0ff"
              strokeDasharray="3 3"
              strokeWidth={2.75}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-5 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand-primary" />
          MRR (млн ₽)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand-secondary" />
          Новые пользователи
        </span>
      </div>
      <table className="sr-only">
        <caption>Данные динамики MRR</caption>
        <thead>
          <tr>
            <th scope="col">Дата</th>
            <th scope="col">MRR</th>
            <th scope="col">Новые пользователи</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{formatCurrencyRub(point.mrr)}</td>
              <td>{point.new_users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

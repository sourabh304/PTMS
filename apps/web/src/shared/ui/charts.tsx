'use client';

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LookupCount } from '@/shared/types/api';
import { EmptyState } from './feedback';

const tooltipStyle = {
  borderRadius: 16,
  border: '1px solid rgba(255,251,242,.85)',
  background: 'var(--surface)',
  boxShadow: 'var(--clay-shadow-sm)',
  fontSize: 12,
};

/** Donut for categorical distributions, colored by each lookup's configured color. */
export function DonutChart({ data, height = 220, emptyLabel = 'No data yet' }: { data: LookupCount[]; height?: number; emptyLabel?: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <EmptyState title={emptyLabel} className="py-8" />;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data.filter((d) => d.count)} dataKey="count" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
              {data.filter((d) => d.count).map((item) => (
                <Cell key={item.id} fill={item.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold">{total}</span>
          <span className="text-xs text-muted">total</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-medium tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars with labels, good for priorities/severities. */
export function BarList({ data, emptyLabel = 'No data yet' }: { data: LookupCount[]; emptyLabel?: string }) {
  const max = Math.max(...data.map((d) => d.count), 0);
  if (!max) return <EmptyState title={emptyLabel} className="py-8" />;
  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li key={item.id}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{item.name}</span>
            <span className="font-medium tabular-nums">{item.count}</span>
          </div>
          <div className="clay-inset h-2.5 overflow-hidden rounded-full">
            <div className="h-full rounded-full shadow-[inset_1px_1px_2px_rgb(255_251_242/0.5)]" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface SeriesChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  series: { key: keyof T & string; label: string; color: string }[];
  height?: number;
  formatValue?: (value: number) => string;
  stacked?: boolean;
}

export function ColumnChart<T extends object>({ data, xKey, series, height = 260, formatValue, stacked }: SeriesChartProps<T>) {
  if (!data.length) return <EmptyState title="No data for this period" className="py-8" />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={formatValue} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => (formatValue ? formatValue(Number(value)) : String(value))} cursor={{ fill: 'var(--surface-muted)' }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[8, 8, 8, 8]} stackId={stacked ? 'stack' : undefined} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

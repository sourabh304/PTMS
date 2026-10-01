'use client';

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LookupCount } from '@/shared/types/api';
import { EmptyState } from './feedback';

const tooltipStyle = {
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--foreground)',
  boxShadow: 'var(--shadow-md)',
  fontSize: 12,
};
const tooltipItemStyle = { color: 'var(--foreground)' };

/**
 * Donut for categorical distributions, colored by each lookup's configured color.
 * Uses a container query so the legend stacks below the chart in narrow cards.
 */
export function DonutChart({ data, height = 200, emptyLabel = 'No data yet' }: { data: LookupCount[]; height?: number; emptyLabel?: string }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <EmptyState title={emptyLabel} className="py-8" />;
  const slices = data.filter((d) => d.count);
  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @md:flex-row @md:gap-8">
        <div className="relative shrink-0" style={{ width: height, height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={slices} dataKey="count" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={slices.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
                {slices.map((item) => (
                  <Cell key={item.id} fill={item.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{total}</span>
            <span className="text-xs text-muted">total</span>
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {data.map((item) => (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 truncate text-foreground-soft">{item.name}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted">{Math.round((item.count / total) * 100)}%</span>
              <span className="w-8 text-right font-medium tabular-nums text-foreground">{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
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
            <span className="font-medium tabular-nums text-foreground">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }} />
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
          <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipItemStyle} formatter={(value) => (formatValue ? formatValue(Number(value)) : String(value))} cursor={{ fill: 'var(--surface-muted)' }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }} />}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} stackId={stacked ? 'stack' : undefined} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

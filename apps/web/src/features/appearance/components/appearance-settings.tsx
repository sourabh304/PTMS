'use client';

import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from '@/features/auth/api';
import { appConfig } from '@/shared/config/env';
import { cn } from '@/shared/lib/utils';
import {
  ACCENT_PRESETS,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  SIDEBAR_OPTIONS,
  STYLE_OPTIONS,
  THEME_MODES,
  type FontOption,
  type ThemeMode,
} from '@/shared/theme/theme.config';
import { useTheme } from '@/shared/theme/theme-provider';
import { Button } from '@/shared/ui/button';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { Segmented } from '@/shared/ui/layout';

const MODE_ICONS: Record<ThemeMode, ReactNode> = {
  light: <Sun />,
  dark: <Moon />,
  system: <Monitor />,
};

/** CSS variable registered by next/font for each selectable font. */
const FONT_VARIABLES: Record<FontOption, string> = {
  figtree: 'var(--font-figtree)',
  inter: 'var(--font-inter)',
  geist: 'var(--font-geist)',
  plex: 'var(--font-plex)',
  manrope: 'var(--font-manrope)',
};

export function AppearanceSettings() {
  const { appearance, update, reset } = useTheme();
  const { data: session } = useSession();
  const organizationColor = session?.organization?.primaryColor ?? appConfig.brandColor;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Appearance"
          description="Personalize how the app looks on this device. Changes apply instantly."
          actions={
            <Button variant="secondary" size="sm" onClick={reset}>
              <RotateCcw /> Reset to defaults
            </Button>
          }
        />
        <CardBody className="divide-y divide-border p-0">
          <Setting title="Style" description="Overall look of cards, buttons and inputs.">
            <div className="grid gap-3 sm:grid-cols-2">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => update({ style: style.value })}
                  aria-pressed={appearance.style === style.value}
                  className={cn(
                    'flex items-start gap-3 rounded-ui-lg border p-3 text-left transition-colors',
                    appearance.style === style.value ? 'border-brand bg-brand-soft' : 'border-border hover:bg-surface-hover',
                  )}
                >
                  <span className={cn('mt-0.5 size-8 shrink-0 rounded-ui', style.value === 'clay' ? 'bg-[#f5eedf] shadow-[4px_4px_10px_rgb(150_122_84/0.3),-3px_-3px_8px_rgb(255_251_242/0.9),inset_2px_2px_3px_rgb(255_251_242/0.8)]' : 'border border-border bg-surface')} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {style.label}
                      {appearance.style === style.value && <Check className="size-3.5 text-brand" />}
                    </span>
                    <span className="block text-xs text-muted">{style.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Setting>
          <Setting title="Theme" description="Use light, dark, or follow your operating system.">
            <div className="grid grid-cols-3 gap-3">
              {THEME_MODES.map((mode) => (
                <OptionTile key={mode.value} selected={appearance.mode === mode.value} onClick={() => update({ mode: mode.value })} label={mode.label} icon={MODE_ICONS[mode.value]}>
                  <ModePreview mode={mode.value} />
                </OptionTile>
              ))}
            </div>
          </Setting>

          <Setting title="Accent color" description="Used for buttons, links, highlights and charts.">
            <div className="flex flex-wrap gap-2.5">
              {ACCENT_PRESETS.map((preset) => {
                const color = preset.color ?? organizationColor;
                const selected = appearance.accent === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => update({ accent: preset.value })}
                    aria-pressed={selected}
                    title={preset.value === 'organization' ? 'Organization default' : preset.label}
                    className={cn(
                      'group flex items-center gap-2 rounded-ui border px-2.5 py-1.5 text-xs font-medium transition-colors',
                      selected ? 'border-brand bg-brand-soft text-foreground' : 'border-border text-foreground-soft hover:border-border-strong',
                    )}
                  >
                    <span className="flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                      {selected && <Check className="size-3 text-white" strokeWidth={3} />}
                    </span>
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </Setting>

          <Setting title="Font" description="Typeface used across the interface.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {FONT_OPTIONS.map((font) => (
                <OptionTile key={font.value} selected={appearance.font === font.value} onClick={() => update({ font: font.value })} label={font.label} description={font.description}>
                  <span className="block py-3 text-3xl font-semibold tracking-tight text-foreground" style={{ fontFamily: FONT_VARIABLES[font.value] }}>
                    Aa
                  </span>
                </OptionTile>
              ))}
            </div>
          </Setting>

          <Setting title="Sidebar" description="Navigation panel style.">
            <Segmented value={appearance.sidebar} onChange={(sidebar) => update({ sidebar })} options={SIDEBAR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
          </Setting>

          <Setting title="Density" description="Compact shows more rows and tighter spacing.">
            <Segmented value={appearance.density} onChange={(density) => update({ density })} options={DENSITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
          </Setting>

          <Setting title="Corner radius" description="Roundness of cards, inputs and buttons.">
            <Segmented value={appearance.radius} onChange={(radius) => update({ radius })} options={RADIUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
          </Setting>
        </CardBody>
      </Card>
      <p className="text-xs text-muted">Appearance preferences are stored in this browser and don&apos;t affect other people in your organization.</p>
    </div>
  );
}

function Setting({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 p-[var(--card-p)] md:grid-cols-[240px_1fr] md:gap-8">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

interface OptionTileProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

function OptionTile({ selected, onClick, label, description, icon, children }: OptionTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-ui-lg border bg-surface p-1.5 text-left transition-colors',
        selected ? 'border-brand ring-2 ring-brand/20' : 'border-border hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-center overflow-hidden rounded-ui bg-surface-muted">{children}</div>
      <div className="flex items-start gap-2 px-1.5 pb-1 pt-2.5">
        {icon && <span className="mt-0.5 text-muted [&_svg]:size-3.5">{icon}</span>}
        <span className="min-w-0">
          <span className="block text-xs font-medium text-foreground">{label}</span>
          {description && <span className="block truncate text-[11px] text-muted">{description}</span>}
        </span>
        {selected && <Check className="ml-auto size-3.5 shrink-0 text-brand" />}
      </div>
    </button>
  );
}

/** Miniature app sketch for each theme mode. */
function ModePreview({ mode }: { mode: ThemeMode }) {
  const palette = {
    light: { bg: '#f6f7f9', panel: '#ffffff', line: '#e4e7ec', text: '#d0d5dd' },
    dark: { bg: '#0c111d', panel: '#121826', line: '#253046', text: '#344054' },
  };
  const render = (p: (typeof palette)['light']) => (
    <div className="flex h-full w-full gap-1 p-1.5" style={{ backgroundColor: p.bg }}>
      <div className="w-1/4 rounded-sm" style={{ backgroundColor: p.panel, border: `1px solid ${p.line}` }} />
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-2 w-1/2 rounded-sm" style={{ backgroundColor: p.text }} />
        <div className="flex-1 rounded-sm" style={{ backgroundColor: p.panel, border: `1px solid ${p.line}` }}>
          <div className="m-1 h-1.5 w-1/3 rounded-sm bg-brand" />
        </div>
      </div>
    </div>
  );
  return (
    <div className="flex h-20 w-full">
      {mode === 'system' ? (
        <>
          <div className="w-1/2 overflow-hidden">{render(palette.light)}</div>
          <div className="w-1/2 overflow-hidden">{render(palette.dark)}</div>
        </>
      ) : (
        render(palette[mode])
      )}
    </div>
  );
}

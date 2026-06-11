'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/field';
import { Text } from '@/components/ui/text';
import { SelectableCard } from './SelectableCard';

/** Item do catálogo necessário pra renderizar o card. */
export type EquipmentPickerItem = {
  code: string;
  name: string;
  kind: string;
  subtype: string | null;
  category: string | null;
  damage: string | null;
  damageType: string | null;
  range: string | null;
  shortDescription: string | null;
};

const KIND_LABELS: Record<string, string> = {
  WEAPON: 'Armamento',
  ARMOR: 'Armadura',
  CONSUMABLE: 'Consumível',
  GENERAL: 'Geral',
};

/**
 * Seletor de equipamento estilo catálogo (mesmo padrão de poderes/aptidões):
 * busca + filtro por tipo acima, lista de cards clicáveis. Clicar adiciona;
 * itens já no inventário mostram um contador de quantidade (shuriken etc.).
 *
 * Presentational: o pai liga aos callbacks (wizard = estado local; ficha =
 * server actions). `quantityByCode` é a seleção atual (code → quantidade).
 */
export function EquipmentPicker({
  catalog,
  quantityByCode,
  onAdd,
  onRemove,
  onQuantity,
  busy,
}: {
  catalog: ReadonlyArray<EquipmentPickerItem>;
  quantityByCode: ReadonlyMap<string, number>;
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onQuantity: (code: string, qty: number) => void;
  busy?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<'ALL' | string>('ALL');
  // Scroll infinito: renderiza só um lote por vez (catálogo tem centenas de itens).
  const PAGE = 24;
  const [visible, setVisible] = useState(PAGE);

  const kindsPresent = useMemo(() => {
    const set = new Set<string>();
    for (const e of catalog) set.add(e.kind);
    return Array.from(set);
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((e) => {
      if (kind !== 'ALL' && e.kind !== kind) return false;
      if (q) {
        const blob = `${e.name} ${e.subtype ?? ''} ${e.code}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [catalog, kind, search]);

  // Volta ao primeiro lote sempre que o filtro muda.
  useEffect(() => setVisible(PAGE), [search, kind]);

  const shown = filtered.slice(0, visible);
  const listRef = useRef<HTMLUListElement>(null);
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      setVisible((v) => (v < filtered.length ? v + PAGE : v));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="equip-search">Buscar</Label>
          <Input
            id="equip-search"
            placeholder="arma, armadura, item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="equip-kind">Tipo</Label>
          <Select id="equip-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="ALL">Todos ({catalog.length})</option>
            {kindsPresent.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k] ?? k}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
        mostrando {shown.length} de {filtered.length} itens
      </p>

      <ul
        ref={listRef}
        onScroll={onScroll}
        className="grid max-h-[420px] gap-2 overflow-y-auto pr-1"
      >
        {shown.map((e) => {
          const qty = quantityByCode.get(e.code);
          const selected = qty != null;
          const meta = [e.damage && `dano ${e.damage}`, e.damageType, e.range]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={e.code}>
              <SelectableCard
                selected={selected}
                onToggle={() => (selected ? onRemove(e.code) : onAdd(e.code))}
                controls={
                  selected ? (
                    <QtyStepper
                      value={qty}
                      disabled={busy}
                      onChange={(next) => onQuantity(e.code, next)}
                    />
                  ) : undefined
                }
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="font-body text-base text-ink">{e.name}</p>
                  <span className="font-display text-[9px] uppercase tracking-[0.25em] text-ice-deep">
                    {KIND_LABELS[e.kind] ?? e.kind}
                    {e.subtype ? ` · ${e.subtype.replace(/_/g, ' ')}` : ''}
                  </span>
                  {meta ? (
                    <Badge tone="neutral" variant="soft" size="xs">
                      {meta}
                    </Badge>
                  ) : null}
                </div>
                {e.shortDescription ? (
                  <Text variant="help" className="mt-0.5 line-clamp-2">
                    {e.shortDescription}
                  </Text>
                ) : null}
              </SelectableCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function QtyStepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded border border-border">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ice disabled:opacity-40"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <span className="min-w-9 px-1 text-center font-serif text-base text-ice-bright">{value}</span>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center text-ink-muted transition-colors hover:bg-bg-card-2 hover:text-ice disabled:opacity-40"
        onClick={() => onChange(Math.min(999, value + 1))}
        disabled={disabled}
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}

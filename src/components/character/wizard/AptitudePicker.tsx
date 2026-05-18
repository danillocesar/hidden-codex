'use client';

import { useMemo, useState } from 'react';
import { Field, Input, Select } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { checkAptitudePrerequisites } from '@/domain/rules/aptitudes';
import type { CharacterCore } from '@/domain/types';
import type { WizardAptitudeOption } from '@/server/queries/wizardCatalogs';
import type { CreateCharacterInput } from '@/schemas/character/create';
import {
  makeHumanizer,
  type HumanizeCatalogs,
} from '@/lib/character/humanizePrereq';
import { PrereqList } from './PrereqList';
import { SelectableCard } from './SelectableCard';
import { InfoButton } from './InfoButton';
import { InfoDrawer } from './InfoDrawer';

type AptitudeRef = CreateCharacterInput['aptitudes'][number];

const CATEGORY_ORDER = [
  'HABILIDADE',
  'COMBATE',
  'MANOBRA',
  'GERAL',
  'META',
  'RESTRITA',
] as const;
type CategoryFilter = 'ALL' | (typeof CATEGORY_ORDER)[number];

/**
 * Picker de aptidoes com pre-reqs em tempo real.
 *
 * Renderiza catalogo filtravel (busca + categoria). Cada item mostra:
 *   - nome + categoria + custo
 *   - PrereqList (motor `checkAptitudePrerequisites`) — verde/vermelho/amarelo
 *   - botao Adicionar / Remover
 *
 * Aptidoes ja selecionadas aparecem no topo com badge "selecionada".
 * Aptidoes concedidas pela origem aparecem com badge "gratis" e nao podem
 * ser removidas pelo usuario.
 */
export function AptitudePicker({
  catalog,
  selected,
  freeAptitudeCodes,
  freeStartingCodes,
  characterForPrereqCheck,
  humanizeCatalogs,
  onChange,
}: {
  catalog: ReadonlyArray<WizardAptitudeOption>;
  selected: ReadonlyArray<AptitudeRef>;
  freeAptitudeCodes: ReadonlyArray<string>;
  /**
   * Codes das aptidoes COMPRADAS que sao grátis pela regra de NC inicial
   * (3 primeiras). Removiveis (diferente de `freeAptitudeCodes` que vem de
   * origem e e read-only), mas marcadas com badge "grátis".
   */
  freeStartingCodes: ReadonlyArray<string>;
  characterForPrereqCheck: CharacterCore;
  /** Catalogos pra humanizar pre-reqs (Aptidao: X, Cla: Y, etc). */
  humanizeCatalogs: HumanizeCatalogs;
  onChange: (next: ReadonlyArray<AptitudeRef>) => void;
}) {
  const humanize = useMemo(() => makeHumanizer(humanizeCatalogs), [humanizeCatalogs]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [showOnlyMet, setShowOnlyMet] = useState(true);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [drawerCode, setDrawerCode] = useState<string | null>(null);
  const drawerEntry = drawerCode ? catalog.find((a) => a.code === drawerCode) : null;

  const selectedSet = useMemo(() => new Set(selected.map((a) => a.code)), [selected]);
  const freeSet = useMemo(() => new Set(freeAptitudeCodes), [freeAptitudeCodes]);
  const freeStartingSet = useMemo(() => new Set(freeStartingCodes), [freeStartingCodes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((apt) => {
      if (category !== 'ALL' && apt.category !== category) return false;
      if (q && !apt.name.toLowerCase().includes(q) && !apt.code.includes(q)) return false;
      return true;
    });
  }, [catalog, category, search]);

  // Pre-calcula checks de cada aptidao do catalogo (todos os 180) — barato
  // porque o motor e puro e roda sub-ms cada.
  const checksByCode = useMemo(() => {
    const map = new Map<string, ReturnType<typeof checkAptitudePrerequisites>>();
    for (const apt of catalog) {
      const prereqs = (apt.prerequisites ?? {}) as Parameters<
        typeof checkAptitudePrerequisites
      >[0];
      map.set(apt.code, checkAptitudePrerequisites(prereqs, characterForPrereqCheck));
    }
    return map;
  }, [catalog, characterForPrereqCheck]);

  const visible = useMemo(() => {
    let list = filtered;
    if (showOnlySelected) {
      list = list.filter((apt) => selectedSet.has(apt.code) || freeSet.has(apt.code));
    }
    if (showOnlyMet) {
      list = list.filter(
        (apt) =>
          checksByCode.get(apt.code)?.allMet === true ||
          // ja selecionadas/free aparecem mesmo se perderem pre-req depois
          selectedSet.has(apt.code) ||
          freeSet.has(apt.code),
      );
    }
    return list;
  }, [filtered, showOnlyMet, showOnlySelected, checksByCode, selectedSet, freeSet]);

  const selectedCount = selected.length + freeAptitudeCodes.length;

  const toggle = (code: string) => {
    if (freeSet.has(code)) return; // free e read-only
    if (selectedSet.has(code)) {
      onChange(selected.filter((a) => a.code !== code));
    } else {
      onChange([...selected, { code }]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Buscar" htmlFor="apt-search">
            <Input
              id="apt-search"
              placeholder="nome ou codigo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <Field label="Categoria" htmlFor="apt-category">
            <Select
              id="apt-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            >
              <option value="ALL">Todas</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <Checkbox
            checked={showOnlyMet}
            onChange={setShowOnlyMet}
            label="Apenas com pre-reqs cumpridos"
          />
          <Checkbox
            checked={showOnlySelected}
            onChange={setShowOnlySelected}
            label={`Apenas selecionadas${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
          />
        </div>
      </div>

      <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted">
        {visible.length} de {catalog.length} aptidoes
      </p>

      <ul className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
        {visible.map((apt) => {
          const isSelected = selectedSet.has(apt.code);
          const isFree = freeSet.has(apt.code);
          const isFreeStarting = !isFree && freeStartingSet.has(apt.code);
          const checks = checksByCode.get(apt.code)!;
          return (
            <li key={apt.code}>
              <SelectableCard
                selected={isSelected}
                locked={isFree}
                lockedLabel="origem"
                tagLabel={isFreeStarting ? 'grátis' : undefined}
                onToggle={() => toggle(apt.code)}
              >
                <div className="flex flex-wrap items-baseline gap-2 pr-16">
                  <p className="font-body text-sm text-ink">{apt.name}</p>
                  <span className="font-display text-[9px] uppercase tracking-[0.3em] text-ice-deep">
                    {apt.category}
                  </span>
                  <span className="font-display text-[9px] uppercase tracking-[0.3em] text-ink-muted">
                    {apt.costPoints} pt
                  </span>
                  <InfoButton
                    ariaLabel={`Ver descricao de ${apt.name}`}
                    onClick={() => setDrawerCode(apt.code)}
                  />
                </div>
                {apt.shortDescription ? (
                  <p className="mt-1 text-sm text-ink-muted">{apt.shortDescription}</p>
                ) : null}
                <div className="mt-2">
                  <PrereqList result={checks} humanize={humanize} />
                </div>
              </SelectableCard>
            </li>
          );
        })}
      </ul>

      <InfoDrawer
        open={!!drawerEntry}
        onClose={() => setDrawerCode(null)}
        title={drawerEntry?.name ?? ''}
        subtitle={
          drawerEntry
            ? `Aptidao · ${drawerEntry.category} · ${drawerEntry.costPoints} pt`
            : null
        }
      >
        {drawerEntry ? (
          <p className="whitespace-pre-wrap">{drawerEntry.description}</p>
        ) : null}
      </InfoDrawer>
    </div>
  );
}

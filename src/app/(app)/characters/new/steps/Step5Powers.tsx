'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Label, Select } from '@/components/ui/field';
import { BudgetBadge } from '@/components/character/wizard/BudgetBadge';
import { PowerLevelStepper } from '@/components/character/wizard/PowerLevelStepper';
import { SelectableCard } from '@/components/character/wizard/SelectableCard';
import { InfoButton } from '@/components/character/wizard/InfoButton';
import { InfoDrawer } from '@/components/character/wizard/InfoDrawer';
import { Alert } from '@/components/ui/alert';
import { getPowerLimit } from '@/domain/rules/attributeLimits';
import { getPowerBudget } from '@/domain/rules/pointsBudget';
import {
  FREE_STARTING_APTITUDES,
  calculateAptitudeCost,
  calculateTotalPowerCost,
} from '@/domain/rules/powers';
import {
  applyOriginBenefits,
  getEffectiveFreePowerLevels,
} from '@/lib/character/applyOriginBenefits';
import { checkAptitudePrerequisites } from '@/domain/rules/aptitudes';
import { PrereqList } from '@/components/character/wizard/PrereqList';
import { makeHumanizer } from '@/lib/character/humanizePrereq';
import type { CharacterCore } from '@/domain/types';
import type { WizardCatalogs, WizardPowerOption } from '@/server/queries/wizardCatalogs';
import type { WizardAction, WizardState } from '../wizardState';

const CATEGORY_LABELS: Record<string, string> = {
  COMUM: 'Comum',
  RESTRITO: 'Restrito',
  RESTRITO_CLA: 'Restrito (cla)',
  KEKKEI_GENKAI: 'Hijutsu',
  HIJUTSU: 'Hijutsu',
};

// Linhagens (ex-"Kekkei Genkai") e tecnicas secretas de cla sao exibidas
// como uma unica categoria "Hijutsu" pro jogador, embora internamente
// continuem sendo categorias distintas (KEKKEI_GENKAI / HIJUTSU).
const HIJUTSU_CATEGORIES = ['KEKKEI_GENKAI', 'HIJUTSU'];

/**
 * Step 5 — Poderes (vem DEPOIS de Aptidoes pra que efeitos com prereq de
 * aptidao tenham os dados certos no Step 6 Efeitos).
 *
 * Layout em coluna unica de cards filtraveis. Cada card representa um poder
 * disponivel (filtrados por cla / KG efetiva) e mostra:
 *   - Nome + categoria + elemento
 *   - Selected/Not selected (botao toggle direto no card)
 *   - Stepper de nivel inline (quando selecionado)
 *   - Niveis grátis em badge separado
 *
 * Sem `<details>` ou botao "+ Adicionar" — toda a lista e visivel com
 * filtros de categoria + busca.
 */
export function Step5Powers({
  state,
  dispatch,
  catalogs,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  catalogs: WizardCatalogs;
}) {
  const nc = state.identity.campaignLevel;
  const budget = getPowerBudget(nc);
  const powerLimit = getPowerLimit(nc);

  const clan = state.identity.clanCode
    ? catalogs.clans.find((c) => c.code === state.identity.clanCode) ?? null
    : null;
  const kekkeiGenkai = state.identity.kekkeiGenkaiCode
    ? catalogs.kekkeiGenkais.find((k) => k.code === state.identity.kekkeiGenkaiCode) ?? null
    : null;
  const village = state.identity.villageCode
    ? catalogs.villages.find((v) => v.code === state.identity.villageCode) ?? null
    : null;

  const origin = useMemo(
    () => applyOriginBenefits({ clan, kekkeiGenkai, village }),
    [clan, kekkeiGenkai, village],
  );

  // Niveis gratis SO valem se o personagem ja tem o poder principal do KG
  // (ex.: Hyouton precisa estar comprado pra Fuuton/Suiton virarem gratis).
  const effectiveFree = useMemo(
    () => getEffectiveFreePowerLevels(origin, state.powers),
    [origin, state.powers],
  );

  // Filtra poderes disponiveis com base na origem.
  const availablePowers = useMemo<ReadonlyArray<WizardPowerOption>>(
    () =>
      catalogs.powers.filter((p) => {
        if (p.category === 'COMUM') return true;
        // Hijutsus (categoria HIJUTSU) sao compraveis como poder normal, sem
        // exigir cla/KG — o gate real e o pre-requisito proprio do poder
        // (bloqueia o card quando nao cumprido). Tambem selecionaveis pelo
        // atalho "Hijutsu" no Step 1.
        if (p.category === 'HIJUTSU') return true;
        if (
          p.category === 'KEKKEI_GENKAI' &&
          p.associatedKekkeiGenkai === origin.effectiveKekkeiGenkaiCode
        ) {
          return true;
        }
        if (p.category === 'RESTRITO_CLA' && clan && p.associatedClan === clan.code) {
          return true;
        }
        return false;
      }),
    [catalogs.powers, clan, origin.effectiveKekkeiGenkaiCode],
  );

  // Categorias presentes na lista disponivel. KEKKEI_GENKAI e HIJUTSU sao
  // agrupadas em uma unica opcao "Hijutsu" no filtro.
  const categoriesPresent = useMemo(() => {
    const set = new Set<string>();
    for (const p of availablePowers) {
      set.add(HIJUTSU_CATEGORIES.includes(p.category) ? 'HIJUTSU' : p.category);
    }
    return Array.from(set);
  }, [availablePowers]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | string>('ALL');
  const [drawerCode, setDrawerCode] = useState<string | null>(null);
  const drawerEntry = drawerCode ? catalogs.powers.find((p) => p.code === drawerCode) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availablePowers.filter((p) => {
      if (category !== 'ALL') {
        const matchesCategory =
          category === 'HIJUTSU'
            ? HIJUTSU_CATEGORIES.includes(p.category)
            : p.category === category;
        if (!matchesCategory) return false;
      }
      if (q) {
        const blob = `${p.name} ${p.translation ?? ''} ${p.code}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [availablePowers, category, search]);

  const selectedByCode = useMemo(
    () => new Map(state.powers.map((p) => [p.code, p])),
    [state.powers],
  );

  // Sincroniza poderes auto-concedidos pela origem (KG/cla):
  //   - Adiciona/ajusta poderes que entraram em `effectiveFree` no nivel min
  //     concedido (ex.: KG Hyouton + poder Hyouton comprado → Fuuton 1 + Suiton 1).
  //   - Remove poderes que SAIRAM do free quando ainda estao no nivel
  //     grátis (user nao subiu). Se subiu, preserva — provavelmente quis comprar.
  // Usa ref pra comparar o estado anterior do free e detectar saidas.
  const prevFreeRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const free = effectiveFree;
    const prev = prevFreeRef.current;
    let next = state.powers.slice();
    let changed = false;

    // Remove os que sairam do free e ainda estao no nivel auto-concedido.
    for (const [code, prevLevel] of Object.entries(prev)) {
      if (free[code] !== undefined) continue;
      const idx = next.findIndex((p) => p.code === code);
      if (idx === -1) continue;
      if (next[idx]!.level <= prevLevel) {
        next = next.filter((_, i) => i !== idx);
        changed = true;
      }
    }

    // Adiciona/ajusta os atuais.
    for (const [code, minLevel] of Object.entries(free)) {
      const idx = next.findIndex((p) => p.code === code);
      if (idx === -1) {
        next.push({ code, level: minLevel });
        changed = true;
      } else if (next[idx]!.level < minLevel) {
        next[idx] = { code, level: minLevel };
        changed = true;
      }
    }

    if (changed) dispatch({ type: 'setPowers', powers: next });
    prevFreeRef.current = free;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveFree]);

  const powerCost = useMemo(
    () => calculateTotalPowerCost(state.powers, effectiveFree),
    [state.powers, effectiveFree],
  );
  const aptCost = calculateAptitudeCost(
    state.aptitudes.map((a) => ({
      code: a.code,
      parameter: a.parameter ?? undefined,
      isFreeFromOrigin: !a.parameter && origin.freeAptitudeCodes.includes(a.code),
    })),
    FREE_STARTING_APTITUDES,
  );
  const totalSpent = powerCost + aptCost;

  // Personagem "virtual" pra rodar pre-req de poderes em tempo real (igual
  // ao Step 5 faz pra aptidoes). Pre-reqs vivem em `power.rules.prerequisites`
  // e seguem o mesmo vocabulario canonico (`AptitudePrerequisites`).
  const characterForPrereqCheck: CharacterCore = useMemo(
    () => ({
      campaignLevel: nc,
      attributes: state.attributes,
      bases: state.bases,
      pericias: state.pericias,
      aptitudes: state.aptitudes.map((a) => ({
        code: a.code,
        parameter: a.parameter ?? undefined,
        isFreeFromOrigin:
          !a.parameter && origin.freeAptitudeCodes.includes(a.code),
      })),
      powers: state.powers,
      learnedEffects: [],
      narrativeFlags: [],
      clan: clan ? { code: clan.code } : undefined,
      kekkeiGenkai: origin.effectiveKekkeiGenkaiCode
        ? { code: origin.effectiveKekkeiGenkaiCode }
        : undefined,
      currentVitality: 0,
      currentChakra: 0,
      socialCarisma: 0,
      socialManipulacao: 0,
    }),
    [
      nc,
      state.attributes,
      state.bases,
      state.pericias,
      state.aptitudes,
      state.powers,
      origin.freeAptitudeCodes,
      origin.effectiveKekkeiGenkaiCode,
      clan,
    ],
  );

  const humanize = useMemo(() => makeHumanizer(catalogs), [catalogs]);

  // Pre-calcula checks de pre-req de cada poder do catalogo.
  const prereqChecks = useMemo(() => {
    const map = new Map<string, ReturnType<typeof checkAptitudePrerequisites>>();
    for (const p of availablePowers) {
      const rules = (p.rules ?? {}) as Record<string, unknown>;
      const prereqs = (rules.prerequisites ?? {}) as Parameters<
        typeof checkAptitudePrerequisites
      >[0];
      map.set(p.code, checkAptitudePrerequisites(prereqs, characterForPrereqCheck));
    }
    return map;
  }, [availablePowers, characterForPrereqCheck]);

  const togglePower = (code: string) => {
    if (selectedByCode.has(code)) {
      dispatch({ type: 'setPowers', powers: state.powers.filter((p) => p.code !== code) });
    } else {
      dispatch({ type: 'setPowers', powers: [...state.powers, { code, level: 1 }] });
    }
  };
  const setLevel = (code: string, level: number) => {
    dispatch({
      type: 'setPowers',
      powers: state.powers.map((p) => (p.code === code ? { ...p, level } : p)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-muted">
          NC {nc}: nivel maximo por poder = <b className="text-ice">{powerLimit}</b>.
          Cada poder custa <b className="text-ice">{powerCost} ponto(s)</b>.
        </p>
        <div data-tour="power-budget">
          <BudgetBadge label="Pontos de poder" spent={totalSpent} budget={budget} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="power-search">Buscar</Label>
          <Input
            id="power-search"
            placeholder="nome, código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="power-category">Categoria</Label>
          <Select
            id="power-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ALL">Todas ({availablePowers.length})</option>
            {categoriesPresent.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
        {filtered.length} de {availablePowers.length} poderes disponiveis
      </p>

      <ul className="grid gap-2" data-tour="power-list">
        {filtered.map((p) => {
          const selected = selectedByCode.get(p.code);
          const free = effectiveFree[p.code] ?? 0;
          const isFree = free > 0;
          const isSelected = !!selected || isFree;
          const checks = prereqChecks.get(p.code)!;
          // Pre-req cumprido? Bloqueia selecao se NAO cumprido e usuario ainda
          // nao tem selecionado (poder ja adicionado nao desabilita — usuario
          // perdeu pre-req depois mas ja escolheu; ele decide remover).
          const prereqMet = checks.checks.length === 0 || checks.allMet;
          const blockedByPrereq = !prereqMet && !isSelected;
          return (
            <li key={p.code}>
              <SelectableCard
                selected={isSelected}
                locked={isFree}
                disabled={blockedByPrereq}
                onToggle={() => togglePower(p.code)}
                controls={
                  isSelected && selected ? (
                    <PowerLevelStepper
                      ariaLabel={`${p.name} nivel`}
                      value={selected.level}
                      min={Math.max(1, free)}
                      max={powerLimit}
                      onChange={(level) => setLevel(p.code, level)}
                    />
                  ) : undefined
                }
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="font-body text-base text-ink">{p.name}</p>
                  {p.translation ? (
                    <span className="font-body text-xs italic text-ice">
                      {p.translation}
                    </span>
                  ) : null}
                  <span className="font-display text-[9px] uppercase tracking-[0.25em] text-ice-deep">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                    {p.element ? ` · ${p.element}` : ''}
                  </span>
                  {isFree ? (
                    <span className="font-display text-[9px] uppercase tracking-[0.3em] text-success">
                      gratis
                    </span>
                  ) : null}
                  <InfoButton
                    ariaLabel={`Ver descricao de ${p.name}`}
                    onClick={() => setDrawerCode(p.code)}
                  />
                </div>
                {p.shortDescription ? (
                  <p className="mt-1 text-sm text-ink-muted">{p.shortDescription}</p>
                ) : null}
                {checks.checks.length > 0 ? (
                  <div className="mt-2">
                    <PrereqList result={checks} humanize={humanize} />
                  </div>
                ) : null}
              </SelectableCard>
            </li>
          );
        })}
      </ul>

      {totalSpent > budget ? (
        <Alert tone="danger">
          Estourou o orcamento de poder ({totalSpent}/{budget}). Reduza algum nivel.
        </Alert>
      ) : null}

      <InfoDrawer
        open={!!drawerEntry}
        onClose={() => setDrawerCode(null)}
        title={drawerEntry?.name ?? ''}
        subtitle={
          drawerEntry
            ? `Poder · ${CATEGORY_LABELS[drawerEntry.category] ?? drawerEntry.category}${
                drawerEntry.element ? ` · ${drawerEntry.element}` : ''
              }`
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

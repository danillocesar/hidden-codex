'use client';

import { useEffect, useMemo } from 'react';
import { ATTRIBUTES } from '@/domain/catalog/attributes';
import { COMBAT_SKILLS } from '@/domain/catalog/combatSkills';
import { getAttributeLimits } from '@/domain/rules/attributeLimits';
import { getAttrBudget } from '@/domain/rules/pointsBudget';
import { validateCombatBases } from '@/domain/rules/combatBases';
import {
  calculateCC,
  calculateCD,
  calculateESQ,
  calculateLM,
  calculateMaxChakra,
  calculateMaxVitality,
} from '@/domain/rules/derivedStats';
import { ATTRIBUTE_KEYS, COMBAT_SKILL_KEYS } from '@/domain/types';
import { BudgetBadge } from '@/components/character/wizard/BudgetBadge';
import { AttributeCard } from '@/components/character/wizard/AttributeCard';
import { Alert } from '@/components/ui/alert';
import { Tooltip } from '@/components/ui/tooltip';
import type { WizardAction, WizardState } from '../wizardState';

const INITIAL_BASES = { cc: 3, cd: 3, esq: 3, lm: 3 } as const;
const MAX_REMANEJAMENTO = 2;

/**
 * Step 2 — Atributos + Bases de combate.
 *
 * **Contagem RAW da tabela de evolucao:** `attrPoints(NC)` representa pontos
 * LIVRES gastos acima do minimo do NC. Cada atributo comeca em `min(NC)`
 * automaticamente; subir cada nivel acima do min gasta 1 ponto extra.
 *
 * Cada atributo mostra "min + extras" decomposto pra deixar visivel que o
 * baseline foi preenchido sem cobrar pontos. Badge "X / Y extras" reflete
 * apenas o que foi gasto acima do min.
 */
export function Step2Attributes({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const nc = state.identity.campaignLevel;
  const { min: attrMin, max: attrMax } = getAttributeLimits(nc);
  const budget = getAttrBudget(nc);

  // Normaliza atributos abaixo do min quando NC muda (Step 1 alterou NC).
  useEffect(() => {
    const needsFix = ATTRIBUTE_KEYS.some((k) => state.attributes[k] < attrMin);
    if (!needsFix) return;
    const fixed: typeof state.attributes = { ...state.attributes };
    for (const k of ATTRIBUTE_KEYS) {
      if (fixed[k] < attrMin) fixed[k] = attrMin;
    }
    dispatch({ type: 'setAttributes', attributes: fixed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attrMin]);

  // `attrBudget` (tabela RAW do Livro Basico) e o total de pontos a distribuir
  // INCLUINDO o min auto-preenchido. Ex.: NC 6 = 24 pontos totais, com min 1
  // em todos (consome 7) e 17 livres.
  const attrSum = ATTRIBUTE_KEYS.reduce((acc, k) => acc + state.attributes[k], 0);
  const overspent = attrSum > budget;

  const basesResult = useMemo(() => validateCombatBases(state.bases), [state.bases]);
  const basesMovedFrom = COMBAT_SKILL_KEYS.reduce((acc, k) => {
    const d = state.bases[k] - INITIAL_BASES[k];
    return d < 0 ? acc + Math.abs(d) : acc;
  }, 0);
  const basesMovedTo = COMBAT_SKILL_KEYS.reduce((acc, k) => {
    const d = state.bases[k] - INITIAL_BASES[k];
    return d > 0 ? acc + d : acc;
  }, 0);

  const aptitudeCodes: string[] = [];
  const combatInput = {
    attributes: state.attributes,
    bases: state.bases,
    aptitudeCodes,
  };
  const derived = {
    cc: calculateCC(combatInput),
    cd: calculateCD(combatInput),
    esq: calculateESQ(combatInput),
    lm: calculateLM(combatInput),
    vit: calculateMaxVitality(state.attributes.vig, nc),
    chakra: calculateMaxChakra(state.attributes.esp),
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted">
            Atributos
          </h3>
          <BudgetBadge label="Pontos totais" spent={attrSum} budget={budget} />
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Mínimo <b className="text-ice">{attrMin}</b> por atributo
          (preenchido automaticamente), máximo <b className="text-ice">{attrMax}</b>.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {ATTRIBUTES.map((attr) => (
            <AttributeCard
              key={attr.code}
              label={attr.abbreviation}
              name={attr.name}
              kanji={attr.kanji}
              value={state.attributes[attr.code]}
              min={attrMin}
              max={attrMax}
              ariaLabel={attr.name}
              onChange={(v) => dispatch({ type: 'setAttribute', key: attr.code, value: v })}
            />
          ))}
        </div>
        {overspent ? (
          <Alert tone="danger" className="mt-3">
            Limite de atributos excedido: {attrSum}/{budget}. Reduza um ou mais atributos.
          </Alert>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted">
            Bases de combate
          </h3>
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            remanejou {Math.max(basesMovedFrom, basesMovedTo)} de {MAX_REMANEJAMENTO}
          </span>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Inicia 3/3/3/3. Pode mover ate 2 pontos entre as bases.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COMBAT_SKILLS.map((cs) => (
            <AttributeCard
              key={cs.code}
              label={cs.abbreviation}
              name={cs.name}
              kanji={cs.kanji}
              value={state.bases[cs.code]}
              min={0}
              max={5}
              ariaLabel={cs.name}
              onChange={(v) => dispatch({ type: 'setBase', key: cs.code, value: v })}
            />
          ))}
        </div>
        {!basesResult.ok ? (
          <Alert tone="danger" className="mt-3">
            {basesResult.error}
          </Alert>
        ) : null}
      </section>

      <section className="rounded border border-border bg-bg-paper p-4">
        <h3 className="mb-3 font-display text-xs uppercase tracking-[0.3em] text-ink-muted">
          Preview (sem aptidoes)
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-6">
          {(
            [
              ['CC', derived.cc, 'For + base CC'],
              ['CD', derived.cd, 'Des + base CD'],
              ['ESQ', derived.esq, 'Agi + base ESQ'],
              ['LM', derived.lm, 'Per + base LM'],
              ['VIT', derived.vit, '10 + 3·Vig + 5·NC'],
              ['CHA', derived.chakra, '10 + 3·Esp'],
            ] as const
          ).map(([label, value, formula]) => (
            <Tooltip key={label} content={formula} className="w-full">
              <div className="w-full cursor-help rounded bg-bg-card-2 px-3 py-2">
                <p className="font-display text-[10px] uppercase tracking-[0.3em] text-ice-deep">
                  {label}
                </p>
                <p className="font-serif text-2xl font-medium text-ice-bright">{value}</p>
              </div>
            </Tooltip>
          ))}
        </div>
      </section>
    </div>
  );
}

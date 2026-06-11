'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { InfoButton } from './InfoButton';
import { InfoDrawer } from './InfoDrawer';
import { isPrimaryAttribute, type PericiaAttribute } from '@/domain/catalog/pericias';
import { roundUp } from '@/domain/rules/math';
import type { Attributes } from '@/domain/types';

/**
 * Tabela editorial de pericias do Step 3 do wizard.
 *
 * Aprovada em /components (variante "S3.1"). Cada linha mostra:
 *   - Nome + tag do atributo + flags + InfoButton (?) que abre drawer com descricao completa
 *   - TOTAL (nivel calculado) em Cormorant grande
 *   - = sinal discreto
 *   - 1/2 ATTR (metade do atributo, ⌈/2⌉) — fixo, nao editavel
 *   - + sinal discreto
 *   - PONTOS — stepper vertical (▲ acima, numero, ▼ abaixo)
 *
 * Pericias sociais (atributo `car`/`man`) ficam desabilitadas — calculo
 * social ainda nao implementado no motor.
 */

export type PericiaTableItem = {
  code: string;
  name: string;
  attribute: PericiaAttribute;
  trained: boolean;
  doubleTrained: boolean;
  shortDescription: string | null;
  description: string;
};

// Grid 6 colunas: nome | TOTAL | = | 1/2 ATTR | + | PONTOS
const FORMULA_COLS =
  'grid-cols-[1fr_3.5rem_1rem_4rem_1rem_3rem] gap-x-3 sm:gap-x-4';

export function PericiaTable({
  pericias,
  attributes,
  points,
  maxPerPericia,
  remainingBudget,
  onChange,
}: {
  pericias: ReadonlyArray<PericiaTableItem>;
  attributes: Attributes;
  points: Readonly<Record<string, number>>;
  maxPerPericia: number;
  /**
   * Pontos restantes do orcamento total. Quando <= 0, bloqueia o `▲` de TODAS
   * as pericias (impede estouro). `▼` continua livre.
   */
  remainingBudget: number;
  onChange: (code: string, points: number) => void;
}) {
  const budgetExhausted = remainingBudget <= 0;
  const [drawerCode, setDrawerCode] = useState<string | null>(null);
  const periciaByCode = useMemo(
    () => new Map(pericias.map((p) => [p.code, p])),
    [pericias],
  );
  const drawerEntry = drawerCode ? periciaByCode.get(drawerCode) ?? null : null;

  return (
    <div>
      <div
        className={cn(
          'grid items-baseline pb-2 font-display text-[9px] uppercase tracking-[0.3em] text-ink-faint',
          FORMULA_COLS,
        )}
      >
        <span />
        <span className="whitespace-nowrap text-center">Total</span>
        <span />
        <span className="whitespace-nowrap text-center">½ Attr</span>
        <span />
        <span className="whitespace-nowrap text-center">Pontos</span>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {pericias.map((p) => {
          const pts = points[p.code] ?? 0;
          const primaryAttr = isPrimaryAttribute(p.attribute) ? p.attribute : null;
          const attrValue = primaryAttr ? attributes[primaryAttr] : null;
          const halfAttr = attrValue !== null ? roundUp(attrValue / 2) : null;
          const total =
            primaryAttr && halfAttr !== null && !(p.trained && pts === 0)
              ? halfAttr + pts
              : null;
          return (
            <li
              key={p.code}
              className={cn('grid items-center py-3', FORMULA_COLS)}
            >
              {/* Coluna 1: nome + tag + flags + ? */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="font-body text-sm text-ink">{p.name}</p>
                  <span
                    className={cn(
                      'font-display text-[9px] uppercase tracking-[0.25em]',
                      primaryAttr ? 'text-ice-deep' : 'text-ink-muted',
                    )}
                  >
                    {primaryAttr ? primaryAttr.toUpperCase() : 'SOCIAL'}
                  </span>
                  {p.trained ? (
                    <span
                      title="Treinada: nivel zero sem pontos investidos."
                      className="font-display text-[9px] uppercase tracking-[0.3em] text-warning"
                    >
                      treinada
                    </span>
                  ) : null}
                  {p.doubleTrained ? (
                    <span
                      title="Requer aptidao especial pra ser comprada."
                      className="font-display text-[9px] uppercase tracking-[0.3em] text-seal"
                    >
                      restrita
                    </span>
                  ) : null}
                  <InfoButton
                    ariaLabel={`Ver descricao de ${p.name}`}
                    onClick={() => setDrawerCode(p.code)}
                  />
                </div>
                {p.shortDescription ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                    {p.shortDescription}
                  </p>
                ) : null}
              </div>

              {/* Coluna 2: TOTAL */}
              <p
                className="text-center font-serif text-3xl font-medium leading-none tabular-nums text-ice-bright"
                title={total === null ? 'sem treino' : `nivel ${total}`}
              >
                {total === null ? '—' : total}
              </p>

              {/* Coluna 3: = */}
              <span aria-hidden className="text-center text-base text-ink-faint">=</span>

              {/* Coluna 4: 1/2 ATTR */}
              <p className="text-center font-mono text-base tabular-nums text-ink">
                {halfAttr ?? '—'}
              </p>

              {/* Coluna 5: + */}
              <span aria-hidden className="text-center text-base text-ink-faint">+</span>

              {/* Coluna 6: stepper vertical */}
              <VerticalStepper
                value={pts}
                min={0}
                max={maxPerPericia}
                disabled={!primaryAttr}
                cannotIncrease={budgetExhausted}
                ariaLabel={`${p.name} pontos`}
                onChange={(n) => onChange(p.code, n)}
              />
            </li>
          );
        })}
      </ul>

      <InfoDrawer
        open={!!drawerEntry}
        onClose={() => setDrawerCode(null)}
        title={drawerEntry?.name ?? ''}
        subtitle={drawerEntry ? `Pericia · ${drawerEntry.attribute.toUpperCase()}` : null}
      >
        {drawerEntry ? (
          <p className="whitespace-pre-wrap">{drawerEntry.description}</p>
        ) : null}
      </InfoDrawer>
    </div>
  );
}

// ── Stepper vertical (▲ em cima, numero, ▼ embaixo) ────────────────────────
function VerticalStepper({
  value,
  min,
  max,
  ariaLabel,
  disabled,
  cannotIncrease,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  disabled?: boolean;
  /** Bloqueia o ▲ por motivo externo (ex: budget global esgotado). */
  cannotIncrease?: boolean;
  onChange: (n: number) => void;
}) {
  const canInc = !disabled && value < max && !cannotIncrease;
  const canDec = !disabled && value > min;
  return (
    <div className="flex flex-col items-center leading-none">
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={!canInc}
        aria-label={`${ariaLabel} aumentar`}
        className={cn(
          'grid h-4 w-6 place-items-center transition-colors',
          canInc
            ? 'text-ink-muted hover:text-ice focus-visible:text-ice focus-visible:outline-none'
            : 'cursor-not-allowed text-ink-faint',
        )}
      >
        <Chevron direction="up" />
      </button>
      <span
        className={cn(
          'font-mono text-sm tabular-nums',
          disabled ? 'text-ink-faint' : 'text-ink',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={!canDec}
        aria-label={`${ariaLabel} diminuir`}
        className={cn(
          'grid h-4 w-6 place-items-center transition-colors',
          canDec
            ? 'text-ink-muted hover:text-ice focus-visible:text-ice focus-visible:outline-none'
            : 'cursor-not-allowed text-ink-faint',
        )}
      >
        <Chevron direction="down" />
      </button>
    </div>
  );
}

function Chevron({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className={cn('h-3 w-3', direction === 'down' && 'rotate-180')}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4-4 4 4" />
    </svg>
  );
}

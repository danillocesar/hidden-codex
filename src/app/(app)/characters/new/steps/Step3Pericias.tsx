'use client';

import { useMemo } from 'react';
import { PERICIAS } from '@/domain/catalog/pericias';
import { getPericaLimit } from '@/domain/rules/attributeLimits';
import { getPericaBudget } from '@/domain/rules/pointsBudget';
import { sumPericiaPoints } from '@/domain/rules/skills';
import { BudgetBadge } from '@/components/character/wizard/BudgetBadge';
import {
  PericiaTable,
  type PericiaTableItem,
} from '@/components/character/wizard/PericiaTable';
import { Alert } from '@/components/ui/alert';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import type { WizardAction, WizardState } from '../wizardState';

/**
 * Step 3 — Pericias.
 *
 * Layout aprovado em /components (variante "S3.1"). Tabela editorial com
 * formula explicita (TOTAL = ½ ATTR + PONTOS) renderizada via
 * `<PericiaTable>`. Drawer de descricao integrado via InfoButton no nome.
 */
export function Step3Pericias({
  state,
  dispatch,
  catalogs,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  catalogs: WizardCatalogs;
}) {
  const nc = state.identity.campaignLevel;
  const budget = getPericaBudget(nc);
  const maxPer = getPericaLimit(nc);
  const spent = useMemo(() => sumPericiaPoints(state.pericias), [state.pericias]);

  // Junta catalogo TS (PERICIAS, com attribute/trained/etc) com descricao
  // completa do banco (catalogs.pericias.description) pra montar o drawer.
  const items = useMemo<ReadonlyArray<PericiaTableItem>>(() => {
    const dbByCode = new Map(catalogs.pericias.map((p) => [p.code, p]));
    return PERICIAS.map((p) => ({
      code: p.code,
      name: p.name,
      attribute: p.attribute,
      trained: p.trained,
      doubleTrained: p.doubleTrained,
      shortDescription: p.shortDescription,
      description: dbByCode.get(p.code)?.description ?? '',
    }));
  }, [catalogs.pericias]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-muted">
          NC {nc}: max <b className="text-ice">{maxPer}</b> pts por pericia. Nivel
          inicial = <code className="text-ice">⌈atributo/2⌉</code>; pontos investidos
          somam ao nivel.
        </p>
        <BudgetBadge label="Pericias" spent={spent} budget={budget} />
      </div>

      <PericiaTable
        pericias={items}
        attributes={state.attributes}
        points={state.pericias}
        maxPerPericia={maxPer}
        remainingBudget={budget - spent}
        onChange={(code, points) => dispatch({ type: 'setPericia', code, points })}
      />

      {/* Estouro de budget e impossivel via UI (steppers bloqueiam ao chegar
          no limite). Alert mantido como defesa em profundidade caso o state
          inicie inconsistente. */}
      {spent > budget ? (
        <Alert tone="danger">
          Estourou o orcamento de pericias ({spent}/{budget}).
        </Alert>
      ) : null}
    </div>
  );
}

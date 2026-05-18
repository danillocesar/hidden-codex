'use client';

import { useMemo } from 'react';
import { BudgetBadge } from '@/components/character/wizard/BudgetBadge';
import { AptitudePicker } from '@/components/character/wizard/AptitudePicker';
import { getPowerBudget } from '@/domain/rules/pointsBudget';
import {
  APTITUDE_COST,
  FREE_STARTING_APTITUDES,
  calculateAptitudeCost,
  calculateTotalPowerCost,
} from '@/domain/rules/powers';
import {
  applyOriginBenefits,
  getEffectiveFreePowerLevels,
} from '@/lib/character/applyOriginBenefits';
import { Alert } from '@/components/ui/alert';
import type { CharacterCore } from '@/domain/types';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import type { WizardAction, WizardState } from '../wizardState';

/**
 * Step 4 — Aptidoes (vem ANTES de Poderes/Efeitos pra que efeitos cujos
 * pre-reqs sao aptidoes sejam validados corretamente no Step 6).
 *
 * Picker com pre-reqs em tempo real. Budget unificado mostra
 * poder + aptidoes pagas.
 */
export function Step4Aptitudes({
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

  const aptitudesFinal = useMemo(() => {
    const listedCodes = new Set(state.aptitudes.filter((a) => !a.parameter).map((a) => a.code));
    const granted = origin.freeAptitudeCodes
      .filter((code) => !listedCodes.has(code))
      .map((code) => ({ code, isFreeFromOrigin: true }));
    const user = state.aptitudes.map((a) => ({
      code: a.code,
      parameter: a.parameter ?? undefined,
      isFreeFromOrigin: !a.parameter && origin.freeAptitudeCodes.includes(a.code),
    }));
    return [...user, ...granted];
  }, [state.aptitudes, origin.freeAptitudeCodes]);

  const characterForPrereqCheck: CharacterCore = useMemo(
    () => ({
      campaignLevel: nc,
      attributes: state.attributes,
      bases: state.bases,
      pericias: state.pericias,
      aptitudes: aptitudesFinal,
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
      aptitudesFinal,
      clan,
      nc,
      origin.effectiveKekkeiGenkaiCode,
      state.attributes,
      state.bases,
      state.pericias,
      state.powers,
    ],
  );

  const effectiveFree = useMemo(
    () => getEffectiveFreePowerLevels(origin, state.powers),
    [origin, state.powers],
  );

  // 3 primeiras aptidoes COMPRADAS (nao-origem) sao grátis por regra de NC
  // inicial — recebem badge "grátis" no picker mas continuam removiveis.
  const freeStartingCodes = useMemo(() => {
    const codes: string[] = [];
    const originSet = new Set(origin.freeAptitudeCodes);
    for (const a of state.aptitudes) {
      if (!a.parameter && originSet.has(a.code)) continue;
      codes.push(a.code);
      if (codes.length >= FREE_STARTING_APTITUDES) break;
    }
    return codes;
  }, [state.aptitudes, origin.freeAptitudeCodes]);

  const powerCost = useMemo(
    () => calculateTotalPowerCost(state.powers, effectiveFree),
    [state.powers, effectiveFree],
  );
  const aptCost = calculateAptitudeCost(aptitudesFinal, FREE_STARTING_APTITUDES);
  const totalSpent = powerCost + aptCost;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-muted">
          Cada aptidão custa <b className="text-ice">{APTITUDE_COST} ponto(s)</b> — as{' '}
          <b className="text-ice">{FREE_STARTING_APTITUDES} primeiras</b> são gratuitas na
          criação.
        </p>
        <BudgetBadge label="Pontos de poder" spent={totalSpent} budget={budget} />
      </div>

      <AptitudePicker
        catalog={catalogs.aptitudes}
        selected={state.aptitudes}
        freeAptitudeCodes={origin.freeAptitudeCodes}
        freeStartingCodes={freeStartingCodes}
        characterForPrereqCheck={characterForPrereqCheck}
        humanizeCatalogs={catalogs}
        onChange={(next) =>
          dispatch({
            type: 'setAptitudes',
            aptitudes: next.map((a) => ({ code: a.code, parameter: a.parameter ?? null })),
          })
        }
      />

      {totalSpent > budget ? (
        <Alert tone="danger">
          Estourou o orcamento ({totalSpent}/{budget}). Volte e reduza poderes OU remova
          aptidoes.
        </Alert>
      ) : null}
    </div>
  );
}

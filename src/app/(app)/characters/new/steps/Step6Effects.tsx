'use client';

import { useMemo } from 'react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { SelectableCard } from '@/components/character/wizard/SelectableCard';
import { PrereqList } from '@/components/character/wizard/PrereqList';
import { InfoButton } from '@/components/character/wizard/InfoButton';
import { InfoDrawer } from '@/components/character/wizard/InfoDrawer';
import { applyOriginBenefits } from '@/lib/character/applyOriginBenefits';
import { checkEffectPrerequisites, type EffectDef } from '@/domain/rules/effects';
import { makeHumanizer } from '@/lib/character/humanizePrereq';
import type { CharacterCore } from '@/domain/types';
import type {
  WizardCatalogs,
  WizardPowerEffectOption,
  WizardPowerOption,
} from '@/server/queries/wizardCatalogs';
import { useState } from 'react';
import type { WizardAction, WizardState } from '../wizardState';

/**
 * Step 6 — Efeitos (jutsus). Roda apos Aptidoes (Step 4) e Poderes (Step 5)
 * pra ter dados completos pra checar pre-reqs de efeito (que podem exigir
 * aptidoes especificas, ex: Quimico pra Veneno Toxico).
 *
 * Cada poder concede N slots (N = nivel do poder). Player escolhe N efeitos
 * daquele poder. Efeitos que falham pre-req aparecem mas nao podem ser
 * selecionados.
 *
 * Slots sao obrigatorios — bloqueia "Proximo" enquanto algum poder tem
 * `selected.length !== power.level`.
 */
export function Step6Effects({
  state,
  dispatch,
  catalogs,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  catalogs: WizardCatalogs;
}) {
  const humanize = useMemo(() => makeHumanizer(catalogs), [catalogs]);
  const [drawerCode, setDrawerCode] = useState<string | null>(null);
  const drawerEffect = drawerCode
    ? catalogs.powerEffects.find((e) => e.code === drawerCode) ?? null
    : null;

  // Personagem virtual usado pra checar prereqs em tempo real. Inclui
  // aptidoes ja escolhidas + efeitos JA selecionados em OUTROS poderes
  // (caso algum prereq de efeito dependa de outro efeito).
  const character: CharacterCore = useMemo(() => {
    const benefits = applyOriginBenefits({
      clan: state.identity.clanCode
        ? catalogs.clans.find((c) => c.code === state.identity.clanCode) ?? null
        : null,
      kekkeiGenkai: state.identity.kekkeiGenkaiCode
        ? catalogs.kekkeiGenkais.find((k) => k.code === state.identity.kekkeiGenkaiCode) ??
          null
        : null,
      village: state.identity.villageCode
        ? catalogs.villages.find((v) => v.code === state.identity.villageCode) ?? null
        : null,
    });
    const aptitudes = state.aptitudes.map((a) => ({
      code: a.code,
      parameter: a.parameter ?? undefined,
      isFreeFromOrigin: !a.parameter && benefits.freeAptitudeCodes.includes(a.code),
    }));
    for (const code of benefits.freeAptitudeCodes) {
      if (!state.aptitudes.some((a) => a.code === code && !a.parameter)) {
        aptitudes.push({ code, parameter: undefined, isFreeFromOrigin: true });
      }
    }
    return {
      campaignLevel: state.identity.campaignLevel,
      attributes: state.attributes,
      bases: state.bases,
      pericias: state.pericias,
      aptitudes,
      powers: state.powers,
      learnedEffects: Object.values(state.effectsByPower).flat(),
      narrativeFlags: [],
      clan: state.identity.clanCode ? { code: state.identity.clanCode } : undefined,
      kekkeiGenkai: benefits.effectiveKekkeiGenkaiCode
        ? { code: benefits.effectiveKekkeiGenkaiCode }
        : undefined,
      currentVitality: 0,
      currentChakra: 0,
      socialCarisma: 0,
      socialManipulacao: 0,
    };
  }, [state, catalogs]);

  if (state.powers.length === 0) {
    return (
      <EmptyState
        title="Nenhum poder selecionado"
        description="Volte ao step Poderes pra escolher pelo menos um — depois retorne aqui pra distribuir os efeitos."
      />
    );
  }

  return (
    <Stack gap="lg">
      <Text variant="muted">
        Cada nivel em um poder concede <b className="text-ice">1 efeito</b> daquele
        poder. Escolha exatamente {''}<b className="text-ice">N efeitos</b> por poder (N =
        nivel total).
      </Text>

      {state.powers.map((power) => {
        const powerDef = catalogs.powers.find((p) => p.code === power.code);
        const selected = state.effectsByPower[power.code] ?? [];
        // Slot = nivel do poder. `power.level` ja inclui niveis gratuitos da
        // origem (regra do reducer/state) — NAO somar `effectiveFreeLevels`
        // de novo aqui (dobrava o valor pros Fuuton/Suiton via Hyouton).
        const availableEffects = catalogs.powerEffects.filter(
          (e) => e.availableFor.includes(power.code) && e.minLevel <= power.level,
        );
        return (
          <PowerSection
            key={power.code}
            power={power}
            powerDef={powerDef ?? null}
            selected={selected}
            availableEffects={availableEffects}
            character={character}
            humanize={humanize}
            onOpenDrawer={setDrawerCode}
            onToggle={(effectCode) => {
              const next = selected.includes(effectCode)
                ? selected.filter((c) => c !== effectCode)
                : [...selected, effectCode];
              dispatch({
                type: 'setEffectsForPower',
                powerCode: power.code,
                effectCodes: next,
              });
            }}
          />
        );
      })}

      <InfoDrawer
        open={!!drawerEffect}
        onClose={() => setDrawerCode(null)}
        title={drawerEffect?.name ?? ''}
        subtitle={
          drawerEffect ? `Efeito · nivel min ${drawerEffect.minLevel}` : null
        }
      >
        {drawerEffect ? (
          <p className="whitespace-pre-wrap">{drawerEffect.description}</p>
        ) : null}
      </InfoDrawer>
    </Stack>
  );
}

function PowerSection({
  power,
  powerDef,
  selected,
  availableEffects,
  character,
  humanize,
  onToggle,
  onOpenDrawer,
}: {
  power: { code: string; level: number };
  powerDef: WizardPowerOption | null;
  selected: ReadonlyArray<string>;
  availableEffects: ReadonlyArray<WizardPowerEffectOption>;
  character: CharacterCore;
  humanize: ReturnType<typeof makeHumanizer>;
  onToggle: (effectCode: string) => void;
  onOpenDrawer: (effectCode: string) => void;
}) {
  const slots = power.level;
  const remaining = slots - selected.length;
  const overflow = remaining < 0;

  // Pre-calcula prereqs de cada efeito disponivel.
  const checksByCode = useMemo(() => {
    const map = new Map<string, ReturnType<typeof checkEffectPrerequisites>>();
    for (const e of availableEffects) {
      const def: EffectDef = {
        code: e.code,
        name: e.name,
        minLevel: e.minLevel,
        availableFor: e.availableFor,
        rules: e.rules as EffectDef['rules'],
      };
      map.set(e.code, checkEffectPrerequisites(def, character));
    }
    return map;
  }, [availableEffects, character]);

  return (
    <section>
      <header className="mb-3 flex flex-wrap items-baseline gap-2 border-b border-border pb-2">
        <span className="font-serif text-lg font-medium text-ink">
          {powerDef?.name ?? power.code}
        </span>
        {powerDef?.translation ? (
          <span className="font-body text-xs italic text-ice-deep">
            {powerDef.translation}
          </span>
        ) : null}
        <Badge
          tone={remaining === 0 ? 'success' : overflow ? 'danger' : 'warning'}
          size="xs"
        >
          {selected.length}/{slots} slots
        </Badge>
        <span className="ml-auto font-serif text-2xl font-medium leading-none text-ice-bright">
          {power.level}
        </span>
      </header>

      {availableEffects.length === 0 ? (
        <Text variant="muted" size="sm">
          Nenhum efeito catalogado para este poder ainda.
        </Text>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {availableEffects.map((effect) => {
            const isSelected = selected.includes(effect.code);
            const checks = checksByCode.get(effect.code);
            const prereqMet = checks?.allMet ?? true;
            const slotsFull = !isSelected && remaining <= 0;
            const disabled = (!prereqMet && !isSelected) || slotsFull;
            return (
              <li key={effect.code} className="flex">
                <SelectableCard
                  selected={isSelected}
                  disabled={disabled}
                  onToggle={() => {
                    if (disabled) return;
                    onToggle(effect.code);
                  }}
                  className="h-full w-full"
                >
                  <div className="flex flex-wrap items-baseline gap-2 pr-2">
                    <p className="font-body text-sm text-ink">{effect.name}</p>
                    <span className="font-display text-[9px] uppercase tracking-[0.3em] text-ink-muted">
                      min {effect.minLevel}
                    </span>
                    <InfoButton
                      ariaLabel={`Ver descricao de ${effect.name}`}
                      onClick={() => onOpenDrawer(effect.code)}
                    />
                  </div>
                  {effect.shortDescription ? (
                    <p className="mt-1 text-sm text-ink-muted">
                      {effect.shortDescription}
                    </p>
                  ) : null}
                  {checks && checks.checks.length > 0 ? (
                    <div className="mt-2">
                      <PrereqList result={checks} humanize={humanize} />
                    </div>
                  ) : null}
                </SelectableCard>
              </li>
            );
          })}
        </ul>
      )}

      {overflow ? (
        <Alert tone="danger" className="mt-3">
          Voce selecionou mais efeitos do que slots disponiveis para {powerDef?.name ?? power.code}.
          Remova {Math.abs(remaining)} efeito(s).
        </Alert>
      ) : null}
    </section>
  );
}

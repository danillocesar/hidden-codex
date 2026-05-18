'use client';

import { useMemo } from 'react';
import {
  CharacterSummary,
  type SummaryAptitude,
  type SummaryPericia,
  type SummaryPower,
} from '@/components/character/ficha/CharacterSummary';
import { PERICIAS, isPrimaryAttribute } from '@/domain/catalog/pericias';
import {
  calculateCC,
  calculateCD,
  calculateESQ,
  calculateLM,
  calculateMaxChakra,
  calculateMaxVitality,
} from '@/domain/rules/derivedStats';
import { calculatePericiaLevel } from '@/domain/rules/skills';
import {
  applyOriginBenefits,
  getEffectiveFreePowerLevels,
} from '@/lib/character/applyOriginBenefits';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import type { WizardState } from '../wizardState';

/**
 * Step 7 — Summary (revisao final) do wizard. Adapta `WizardState` + catalogos
 * pro `CharacterSummary` (componente burro reusado pela pagina de ficha).
 *
 * Normaliza:
 *   - Aptidoes selecionadas + freeAptitudeCodes da origem (marcadas isFree)
 *   - Pericias: TODAS as 20 do livro (zero pontos renderiza com opacity 0.4)
 *   - Poderes: extrai translation + freeLevel (Hyouton → +1 Fuuton/Suiton)
 */
export function Step7Summary({
  state,
  catalogs,
}: {
  state: WizardState;
  catalogs: WizardCatalogs;
}) {
  const { identity, attributes, bases, pericias, powers, aptitudes } = state;
  const nc = identity.campaignLevel;

  const clan = identity.clanCode
    ? catalogs.clans.find((c) => c.code === identity.clanCode) ?? null
    : null;
  const kekkeiGenkai = identity.kekkeiGenkaiCode
    ? catalogs.kekkeiGenkais.find((k) => k.code === identity.kekkeiGenkaiCode) ?? null
    : null;
  const village = identity.villageCode
    ? catalogs.villages.find((v) => v.code === identity.villageCode) ?? null
    : null;

  const origin = useMemo(
    () => applyOriginBenefits({ clan, kekkeiGenkai, village }),
    [clan, kekkeiGenkai, village],
  );

  const effectiveFreeLevels = useMemo(
    () => getEffectiveFreePowerLevels(origin, powers),
    [origin, powers],
  );

  const aptitudeCodesForRules = useMemo(() => {
    const codes = new Set(aptitudes.map((a) => a.code));
    for (const c of origin.freeAptitudeCodes) codes.add(c);
    return Array.from(codes);
  }, [aptitudes, origin.freeAptitudeCodes]);

  const combatInput = { attributes, bases, aptitudeCodes: aptitudeCodesForRules };
  const derived = {
    cc: calculateCC(combatInput),
    cd: calculateCD(combatInput),
    esq: calculateESQ(combatInput),
    lm: calculateLM(combatInput),
    vit: calculateMaxVitality(attributes.vig, nc),
    chakra: calculateMaxChakra(attributes.esp),
  };

  // Aptidoes: selecionadas (com parametro) + concedidas pela origem.
  // Dedup por code+parameter pra evitar duplicar quando user adicionou uma que
  // tambem viria gratis (mantemos o item do user, sem badge gratis nesse caso —
  // o que o user pagou e que conta pro budget).
  const summaryAptitudes: SummaryAptitude[] = useMemo(() => {
    const items: SummaryAptitude[] = [];
    const seen = new Set<string>();
    for (const a of aptitudes) {
      const def = catalogs.aptitudes.find((c) => c.code === a.code);
      const key = a.code + (a.parameter ?? '');
      seen.add(key);
      items.push({
        name:
          (def?.name ?? a.code) + (a.parameter ? ` (${humanizeParameter(a.parameter)})` : ''),
        category: def?.category.toLowerCase() ?? '—',
        description: def?.shortDescription ?? def?.description ?? '',
        isFree: false,
      });
    }
    for (const code of origin.freeAptitudeCodes) {
      if (seen.has(code)) continue;
      const def = catalogs.aptitudes.find((c) => c.code === code);
      items.push({
        name: def?.name ?? code,
        category: def?.category.toLowerCase() ?? '—',
        description: def?.shortDescription ?? def?.description ?? '',
        isFree: true,
      });
    }
    return items;
  }, [aptitudes, origin.freeAptitudeCodes, catalogs.aptitudes]);

  // Pericias: TODAS as 20, com pontos investidos (0 = nao treinada → opacity 0.4).
  const summaryPericias: SummaryPericia[] = useMemo(() => {
    return PERICIAS.map((def) => {
      const points = pericias[def.code] ?? 0;
      let level = 0;
      if (isPrimaryAttribute(def.attribute)) {
        level = calculatePericiaLevel(points, attributes[def.attribute], def.trained);
      }
      // Pericias sociais (`car`/`man`): nivel 0 ate termos os atributos sociais.
      return { name: def.name, points, level };
    });
  }, [pericias, attributes]);

  // Poderes: nivel total + niveis gratis da origem (efetivamente concedidos).
  const summaryPowers: SummaryPower[] = useMemo(() => {
    return powers.map((p) => {
      const def = catalogs.powers.find((c) => c.code === p.code);
      const freeLevel = effectiveFreeLevels[p.code] ?? 0;
      return {
        name: def?.name ?? p.code,
        translation: def?.translation ?? null,
        level: p.level,
        freeLevel,
        description: def?.shortDescription ?? def?.description ?? '',
      };
    });
  }, [powers, catalogs.powers, effectiveFreeLevels]);

  const clanName = clan?.name ?? identity.customClanName ?? null;
  const villageName = village?.name ?? identity.customVillageName ?? null;
  const kekkeiGenkaiName =
    kekkeiGenkai?.name ??
    (origin.effectiveKekkeiGenkaiCode
      ? catalogs.kekkeiGenkais.find((k) => k.code === origin.effectiveKekkeiGenkaiCode)?.name ??
        origin.effectiveKekkeiGenkaiCode
      : null);

  return (
    <CharacterSummary
      clanName={clanName}
      villageName={villageName}
      name={identity.name}
      portraitUrl={identity.portraitUrl ?? null}
      kekkeiGenkaiName={kekkeiGenkaiName}
      age={identity.age ?? null}
      gender={identity.gender ?? null}
      campaignLevel={nc}
      attributes={attributes}
      derived={derived}
      aptitudes={summaryAptitudes}
      pericias={summaryPericias}
      powers={summaryPowers}
    />
  );
}

function humanizeParameter(parameter: string): string {
  return parameter.replace(/_/g, ' ');
}

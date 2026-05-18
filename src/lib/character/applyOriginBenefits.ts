/**
 * Resolve beneficios de cla / kekkei genkai / vila pra um personagem
 * recem-criado. Roda no SERVIDOR antes do `prisma.create` no wizard P0.2.
 *
 * Regras (RAW Livro Basico + Livro de Hijutsus):
 *   1. Vila: por enquanto sem `freeAptitudes` reais (todas as 5 grandes
 *      vilas seedaram `[]`). Mantemos o caminho aberto pra quando entrarem.
 *   2. Cla: `benefits.kekkeiGenkai` (quando presente) AUTO-vincula o KG ao
 *      personagem se ele nao escolheu um conflitante. `restrictedAptitudes`
 *      sao "exclusivas do cla pra COMPRAR", NAO gratuitas.
 *   3. KG: `benefits.freePowerLevelsByElement` concede niveis gratuitos em
 *      poderes elementais (ex.: Hyouton concede +1 Fuuton + +1 Suiton).
 *      `benefits.mainPowerCode` indica o poder principal do KG (Hyouton
 *      para a KG Hyouton); o personagem ainda PAGA pelos niveis comprados.
 *      `benefits.linkedAptitudes` (quando declarado) sao gratuitas.
 *
 * Decisao explicita: aptidoes ou poderes que o jogador JA listou no input
 * tem prioridade sobre os "auto" deste helper — se o jogador comprou Hyouton
 * nivel 4 e o KG aplicaria nivel 3 main, o resultado e nivel 4. Helpers
 * downstream (validacao de budget) precisam separar `freeLevels` de `paidLevels`.
 */

import type { Prisma } from '@prisma/client';

export type OriginBenefits = {
  /**
   * Codes de aptidoes concedidas gratuitamente (com `isFreeFromOrigin: true`).
   * Nao revalidamos pre-req destas — sao explicitamente isentas (RAW).
   */
  freeAptitudeCodes: ReadonlyArray<string>;
  /**
   * Niveis gratuitos por poder. Ex.: `{ fuuton: 1, suiton: 1 }` para um
   * personagem Yuki/Hyouton. Niveis comprados acima destes contam pro budget.
   */
  freePowerLevels: Readonly<Record<string, number>>;
  /**
   * Poder principal "garantido" pelo KG (ex.: hyouton pra KG Hyouton). Quando
   * presente, o personagem TEM acesso ao poder mesmo que nao seja COMUM. Nao
   * concede nivel — apenas elegibilidade.
   */
  kekkeiGenkaiMainPowerCode: string | null;
  /**
   * Codigo da KG efetivamente vinculada (pode vir do input ou ser derivada
   * via cla). Quando null, personagem nao tem KG.
   */
  effectiveKekkeiGenkaiCode: string | null;
};

type JsonBenefits = Prisma.JsonValue | null | undefined;

type ClanInput = {
  code: string;
  benefits: JsonBenefits;
} | null;

type KekkeiGenkaiInput = {
  code: string;
  benefits: JsonBenefits;
} | null;

type VillageInput = {
  code: string;
  benefits: JsonBenefits;
} | null;

export type ApplyOriginInput = {
  clan: ClanInput;
  /** KG escolhido explicitamente pelo usuario, OU null pra deixar o cla decidir. */
  kekkeiGenkai: KekkeiGenkaiInput;
  village: VillageInput;
};

function asRecord(value: JsonBenefits): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

function asPositiveIntRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0 && Number.isInteger(v)) {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Filtra `freePowerLevels` pra retornar SO o que e efetivamente concedido
 * dado o estado atual de poderes do personagem.
 *
 * Regra: niveis gratis do KG (ex: Fuuton+Suiton via Hyouton) so valem se o
 * personagem TIVER o `kekkeiGenkaiMainPowerCode` (ex: Hyouton) na lista de
 * poderes comprados. Sem o poder principal, nenhum nivel gratis e aplicado.
 *
 * Quando o KG nao tem `mainPowerCode` (raro), retorna `freePowerLevels`
 * direto.
 */
export function getEffectiveFreePowerLevels(
  benefits: Pick<OriginBenefits, 'freePowerLevels' | 'kekkeiGenkaiMainPowerCode'>,
  characterPowers: ReadonlyArray<{ code: string }>,
): Readonly<Record<string, number>> {
  const main = benefits.kekkeiGenkaiMainPowerCode;
  if (!main) return benefits.freePowerLevels;
  const hasMain = characterPowers.some((p) => p.code === main);
  return hasMain ? benefits.freePowerLevels : {};
}

export function applyOriginBenefits(input: ApplyOriginInput): OriginBenefits {
  const clanBenefits = asRecord(input.clan?.benefits);
  const kgBenefits = asRecord(input.kekkeiGenkai?.benefits);
  const villageBenefits = asRecord(input.village?.benefits);

  // 1. KG efetivo: input.kekkeiGenkai tem prioridade; senao deriva do cla.
  const derivedKgFromClan =
    typeof clanBenefits.kekkeiGenkai === 'string' ? clanBenefits.kekkeiGenkai : null;
  const effectiveKekkeiGenkaiCode = input.kekkeiGenkai?.code ?? derivedKgFromClan ?? null;

  // 2. Free aptitudes: uniao de vila + KG (`linkedAptitudes`) + cla
  //    (`freeAptitudes` se existir — campo ainda nao usado no seed, mas
  //    reservado pra futuras adicoes). Cla.restrictedAptitudes NAO entra.
  const freeAptitudeSet = new Set<string>();
  for (const code of asStringArray(villageBenefits.freeAptitudes)) freeAptitudeSet.add(code);
  for (const code of asStringArray(kgBenefits.linkedAptitudes)) freeAptitudeSet.add(code);
  for (const code of asStringArray(clanBenefits.freeAptitudes)) freeAptitudeSet.add(code);

  // 3. Free power levels: vem do KG (freePowerLevelsByElement).
  const freePowerLevels = asPositiveIntRecord(kgBenefits.freePowerLevelsByElement);

  // 4. Main power do KG (ex.: hyouton).
  const kekkeiGenkaiMainPowerCode =
    typeof kgBenefits.mainPowerCode === 'string' ? kgBenefits.mainPowerCode : null;

  return {
    freeAptitudeCodes: Array.from(freeAptitudeSet).sort(),
    freePowerLevels: { ...freePowerLevels },
    kekkeiGenkaiMainPowerCode,
    effectiveKekkeiGenkaiCode,
  };
}

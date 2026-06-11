/**
 * Converte um `PrerequisiteCheck` (motor) num texto amigavel em pt-BR,
 * resolvendo codes contra catalogos do banco.
 *
 *   { type: 'attribute', code: 'esp', value: 8 }              → "Espirito 8"
 *   { type: 'pericia',   code: 'medicina', value: 1 }          → "Medicina"
 *   { type: 'pericia',   code: 'medicina', value: 5 }          → "Medicina nv 5"
 *   { type: 'power',     code: 'hyouton',  value: 3 }          → "Hyouton 3"
 *   { type: 'aptitude',  code: 'acuidade' }                    → "Aptidao: Acuidade"
 *   { type: 'clan',      code: 'yuki' }                        → "Cla: Yuki"
 *   { type: 'mutuallyExclusive', code: 'senjutsu' }            → "Nao pode ter Senjutsu"
 */

import { ATTRIBUTES } from '@/domain/catalog/attributes';
import { COMBAT_SKILLS } from '@/domain/catalog/combatSkills';
import { getPericiaByCode } from '@/domain/catalog/pericias';
import type { PrerequisiteCheck } from '@/domain/rules/aptitudes';
import type { AttributeKey, CombatSkillKey } from '@/domain/types';

export type HumanizeCatalogs = {
  aptitudes: ReadonlyArray<{ code: string; name: string }>;
  powers: ReadonlyArray<{ code: string; name: string }>;
  clans: ReadonlyArray<{ code: string; name: string }>;
  kekkeiGenkais: ReadonlyArray<{ code: string; name: string }>;
};

type NameLookup = (code: string) => string;

function makeLookup(items: ReadonlyArray<{ code: string; name: string }>): NameLookup {
  const map = new Map(items.map((i) => [i.code, i.name]));
  return (code) => map.get(code) ?? prettifyCode(code);
}

/** Fallback quando nao acha no catalogo: `usar_arma_katana` → "Usar Arma Katana". */
function prettifyCode(code: string): string {
  return code
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function attributeName(code: string): string {
  const attr = ATTRIBUTES.find((a) => a.code === (code as AttributeKey));
  return attr?.name ?? code.toUpperCase();
}

function combatSkillName(code: string): string {
  const cs = COMBAT_SKILLS.find((s) => s.code === (code as CombatSkillKey));
  return cs?.name ?? code.toUpperCase();
}

function periciaName(code: string): string {
  const p = getPericiaByCode(code);
  return p?.name ?? prettifyCode(code);
}

function periciaLabel(code: string, value: number | undefined): string {
  const name = periciaName(code);
  // Pericia em nivel 1 (treinada) — o nivel 1 e implicito ao ter a pericia,
  // entao mostramos so o nome ("Medicina"). Acima de 1, mostra o nivel.
  if (value === undefined || value <= 1) return name;
  return `${name} nv ${value}`;
}

/**
 * Cria um humanizer pronto pra usar (closure sobre os catalogos). Retorna
 * `(check) => string`. Cai pra `check.detail` quando nao consegue resolver.
 */
export function makeHumanizer(catalogs: HumanizeCatalogs) {
  const aptName = makeLookup(catalogs.aptitudes);
  const powerName = makeLookup(catalogs.powers);
  const clanName = makeLookup(catalogs.clans);
  const kgName = makeLookup(catalogs.kekkeiGenkais);

  return function humanize(check: PrerequisiteCheck): string {
    switch (check.type) {
      case 'attribute':
        if (check.code && check.value !== undefined) {
          return `${attributeName(check.code)} ${check.value}`;
        }
        break;
      case 'attribute_one_of':
        if (check.codes && check.values) {
          return check.codes
            .map((c, i) => `${attributeName(c)} ${check.values![i]}`)
            .join(' ou ');
        }
        break;
      case 'combatSkill':
        if (check.code && check.value !== undefined) {
          return `${combatSkillName(check.code)} ${check.value}`;
        }
        break;
      case 'combatSkill_one_of':
        if (check.codes && check.values) {
          return check.codes
            .map((c, i) => `${combatSkillName(c)} ${check.values![i]}`)
            .join(' ou ');
        }
        break;
      case 'pericia':
        if (check.code) return periciaLabel(check.code, check.value);
        break;
      case 'pericia_one_of':
        if (check.codes && check.values) {
          return check.codes
            .map((c, i) => periciaLabel(c, check.values![i]))
            .join(' ou ');
        }
        break;
      case 'power':
        if (check.code && check.value !== undefined) {
          return `${powerName(check.code)} ${check.value}`;
        }
        break;
      case 'power_one_of':
        if (check.codes && check.values) {
          return check.codes
            .map((c, i) => `${powerName(c)} ${check.values![i]}`)
            .join(' ou ');
        }
        break;
      case 'aptitude':
        if (check.code) return `${aptName(check.code)}`;
        break;
      case 'aptitude_one_of':
        if (check.codes) {
          return `${check.codes.map(aptName).join(' ou ')}`;
        }
        break;
      case 'effect':
        if (check.code) return `Efeito: ${prettifyCode(check.code)}`;
        break;
      case 'kekkei':
        if (check.code) return `Hijutsu: ${kgName(check.code)}`;
        break;
      case 'clan':
        if (check.code) return `Cla: ${clanName(check.code)}`;
        break;
      case 'clan_one_of':
        if (check.codes) {
          return `Cla: ${check.codes.map(clanName).join(' ou ')}`;
        }
        break;
      case 'mutuallyExclusive':
      case 'incompatible':
        if (check.code) return `Nao pode ter ${aptName(check.code)}`;
        break;
      case 'narrative':
        return `Aprovacao do mestre: ${prettifyCode(check.code ?? check.detail)}`;
      case 'custom':
        return check.detail;
      case 'alternative':
        return check.detail; // ja descreve "[nome] ok OU [nome] falha"
    }
    return check.detail; // fallback
  };
}

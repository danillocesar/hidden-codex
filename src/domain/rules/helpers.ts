import type { CharacterCore } from '../types';

/**
 * Constrói o mapa de níveis grátis de poderes para um personagem, somando
 * benefícios de Kekkei Genkai e Clã.
 *
 * Exemplo (Satsuki / Hyouton):
 *   - kekkei `hyouton` concede 1 nível de `fuuton` e 1 de `suiton`.
 *   - clã `yuki` pode conceder `hyouton` nível 1 grátis.
 *   Resultado: `{ fuuton: 1, suiton: 1, hyouton: 1 }`.
 */
export function getFreePowerLevelsFromOrigin(
  character: Pick<CharacterCore, 'clan' | 'kekkeiGenkai'>,
): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};

  if (character.kekkeiGenkai?.freePowerLevelsByElement) {
    for (const [code, level] of Object.entries(character.kekkeiGenkai.freePowerLevelsByElement)) {
      result[code] = (result[code] ?? 0) + level;
    }
  }

  if (character.clan?.freePowers) {
    for (const fp of character.clan.freePowers) {
      result[fp.code] = (result[fp.code] ?? 0) + fp.level;
    }
  }

  return result;
}

/** Códigos de aptidões grátis (origem) usados em validações de pré-req. */
export function getFreeAptitudesFromOrigin(
  character: Pick<CharacterCore, 'clan'>,
): ReadonlyArray<string> {
  return character.clan?.freeAptitudes ?? [];
}

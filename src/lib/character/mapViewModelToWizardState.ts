import type { CreateCharacterInput } from '@/schemas/character/create';
import type { CharacterViewModel } from '@/lib/character/mapPrismaToCore';

/**
 * Converte o `CharacterViewModel` (carregado do banco) de volta pra forma do
 * input do wizard — usado pelo modo EDICAO, que reaproveita o wizard de criacao
 * pre-preenchido.
 *
 * Pontos criticos pra round-trip estavel (sem duplicar beneficios de origem):
 *   - Aptidoes grátis da origem sao EXCLUIDAS (o save as re-adiciona server-side
 *     via `resolveAndValidateCharacterInput`; inclui-las contaria duas vezes).
 *   - Niveis de poder NAO subtraem os grátis — `core.powers[].level` ja e o total
 *     (o budget desconta os grátis internamente). Round-trip preserva o valor.
 *   - Efeitos vem de `display.effectsByPowerCode` (ja agrupados por poder), nao do
 *     `core.learnedEffects` (flat, perderia o agrupamento por slot).
 *   - Inventario fica de fora (gerido ao vivo na ficha, com compartimentos).
 */
export function mapViewModelToWizardState(vm: CharacterViewModel): CreateCharacterInput {
  const { core, display } = vm;

  const effectsByPower: Record<string, string[]> = {};
  for (const [powerCode, effects] of Object.entries(display.effectsByPowerCode)) {
    effectsByPower[powerCode] = effects.map((e) => e.code);
  }

  return {
    identity: {
      name: display.name,
      age: display.age,
      gender: display.gender,
      campaignLevel: core.campaignLevel,
      // Vila/Cla: canonico OU custom (nunca ambos — schema refina isso).
      villageCode: display.villageCode,
      customVillageName: display.villageCode ? null : display.villageName,
      clanCode: display.clanCode,
      customClanName: display.clanCode ? null : display.clanName,
      kekkeiGenkaiCode: display.kekkeiGenkaiCode,
      portraitUrl: display.portraitUrl,
    },
    attributes: { ...core.attributes },
    bases: { ...core.bases },
    pericias: { ...core.pericias },
    powers: core.powers.map((p) => ({ code: p.code, level: p.level })),
    effectsByPower,
    aptitudes: core.aptitudes
      .filter((a) => !a.isFreeFromOrigin)
      .map((a) => ({ code: a.code, parameter: a.parameter ?? null })),
    inventory: [],
    ryos: vm.display.ryos,
  };
}

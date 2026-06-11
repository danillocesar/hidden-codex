/**
 * Backfill de `Character.learnedEffects` para fichas criadas ANTES da migration
 * `add_character_learned_effects` (que têm `{}` mas já possuem jutsus reais).
 *
 * Deriva o mapa `{ [powerCode]: effectCode[] }` a partir dos `CharacterJutsu`
 * legados (powerId → code, powerEffectId → code). Só toca em fichas com
 * `learnedEffects` vazio E que tenham ao menos um jutsu — idempotente e seguro
 * de rodar mais de uma vez.
 *
 * Uso:
 *   pnpm tsx scripts/backfill-learned-effects.ts            # dry-run (só mostra)
 *   pnpm tsx scripts/backfill-learned-effects.ts --apply    # aplica no banco
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

function isEmptyLearned(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return true;
  return Object.keys(value as Record<string, unknown>).length === 0;
}

async function main(): Promise<void> {
  const [powers, effects, characters] = await Promise.all([
    prisma.power.findMany({ select: { id: true, code: true } }),
    prisma.powerEffect.findMany({ select: { id: true, code: true } }),
    prisma.character.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        learnedEffects: true,
        jutsus: { select: { powerId: true, powerEffectId: true } },
      },
    }),
  ]);

  const powerCodeById = new Map(powers.map((p) => [p.id, p.code]));
  const effectCodeById = new Map(effects.map((e) => [e.id, e.code]));

  let touched = 0;
  for (const c of characters) {
    if (!isEmptyLearned(c.learnedEffects) || c.jutsus.length === 0) continue;

    const map: Record<string, string[]> = {};
    for (const j of c.jutsus) {
      const powerCode = powerCodeById.get(j.powerId);
      const effectCode = effectCodeById.get(j.powerEffectId);
      if (!powerCode || !effectCode) continue;
      const list = (map[powerCode] ??= []);
      if (!list.includes(effectCode)) list.push(effectCode);
    }
    if (Object.keys(map).length === 0) continue;

    touched += 1;
    console.warn(`${APPLY ? 'apply' : 'dry '} · ${c.name} (${c.id}) → ${JSON.stringify(map)}`);
    if (APPLY) {
      await prisma.character.update({ where: { id: c.id }, data: { learnedEffects: map } });
    }
  }

  console.warn(
    `\n${touched} ficha(s) ${APPLY ? 'atualizada(s)' : 'a atualizar (dry-run)'}.` +
      (APPLY ? '' : ' Rode com --apply pra persistir.'),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

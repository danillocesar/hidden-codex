/**
 * Prisma seed entry point.
 *
 * Em F0 não há catálogos seedados ainda — a extração estruturada do livro
 * (aptidões, poderes, efeitos, clãs, vilas, kekkei genkais, equipamentos)
 * acontece em F2.3 conforme `arcana-forge-spec/07-SEED-DATA-PLAN.md`.
 *
 * Por enquanto este script é um no-op idempotente: pode ser rodado sem
 * efeitos colaterais. Deixar funcional desde o início mantém o pipeline
 * `pnpm prisma db seed` testável.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.info('[seed] no seed data yet — F2.3 will populate catalogs');
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

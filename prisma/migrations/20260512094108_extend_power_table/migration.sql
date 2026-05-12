-- Lote 3 (powers.json) + fechamento de Lote 2 (clans/kekkei-genkais):
-- estende `Power`, `Clan`, `KekkeiGenkai` com campos exigidos pelos JSONs do
-- seed e adiciona `customClanName` em `Character` (paralelo a `customVillageName`).
--
-- Refazer o enum `PowerCategory`:
--   NINPOU/TAIJUTSU/GENJUTSU/HIJUTSU saem (não bate com o livro).
--   COMUM/RESTRITO/RESTRITO_CLA mantém KEKKEI_GENKAI.
-- Operação segura: tabela `powers` está vazia (nada referencia os valores antigos).
-- Generated via `prisma migrate diff` e aplicado manualmente porque o Prisma
-- CLI requer confirmação interativa para remoções de enum.

-- AlterEnum
BEGIN;
CREATE TYPE "PowerCategory_new" AS ENUM ('COMUM', 'RESTRITO', 'RESTRITO_CLA', 'KEKKEI_GENKAI');
ALTER TABLE "powers" ALTER COLUMN "category" TYPE "PowerCategory_new" USING ("category"::text::"PowerCategory_new");
ALTER TYPE "PowerCategory" RENAME TO "PowerCategory_old";
ALTER TYPE "PowerCategory_new" RENAME TO "PowerCategory";
DROP TYPE "PowerCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "custom_clan_name" TEXT;

-- AlterTable
ALTER TABLE "clans" ADD COLUMN "village" TEXT;

-- AlterTable
ALTER TABLE "kekkei_genkais"
  ADD COLUMN "associated_clan" TEXT,
  ADD COLUMN "translation" TEXT;

-- AlterTable
ALTER TABLE "powers"
  ADD COLUMN "associated_clan" TEXT,
  ADD COLUMN "associated_kekkei_genkai" TEXT,
  ADD COLUMN "rules" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "stats" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "translation" TEXT;

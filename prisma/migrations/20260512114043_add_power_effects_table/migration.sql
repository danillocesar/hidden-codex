-- Lote 4a: refatora `power_effects` para entidade global (M:N via array
-- `available_for`) e adiciona JSONB de `rules` e `evolutions`.
--
-- Antes: cada efeito tinha FK `power_id` (1 efeito → 1 poder, único por par).
-- Agora: efeitos são globais, `code` é unique e `availableFor` é array de
-- `Power.code` (sem constraint Prisma — mesma decisão de `Clan.village` /
-- `CharacterPericia.periciaCode`).
--
-- Tabela `power_effects` está vazia (nada foi seedado nela ainda), então
-- DROP COLUMN é seguro. Gerado via `prisma migrate diff` e aplicado
-- manualmente porque o Prisma CLI bloqueia em modo não-interativo quando
-- há warning de unique constraint nova.

-- DropForeignKey
ALTER TABLE "power_effects" DROP CONSTRAINT "power_effects_power_id_fkey";

-- DropIndex
DROP INDEX "power_effects_power_id_code_key";

-- AlterTable
ALTER TABLE "power_effects"
  DROP COLUMN "power_id",
  DROP COLUMN "tags",
  ADD COLUMN "available_for" TEXT[],
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "evolutions" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "rules" JSONB,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "power_effects_code_key" ON "power_effects"("code");

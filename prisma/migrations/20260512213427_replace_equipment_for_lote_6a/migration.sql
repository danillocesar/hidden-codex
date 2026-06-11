/*
  Warnings:

  - You are about to drop the column `base_price` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `stats` on the `equipments` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `equipments` table. All the data in the column will be lost.
  - The `category` column on the `equipments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `kind` to the `equipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `equipments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EquipmentKind" AS ENUM ('WEAPON', 'ARMOR', 'TOOL', 'CONSUMABLE', 'GENERAL', 'AMMO');

-- CreateEnum
CREATE TYPE "WeaponCategory" AS ENUM ('DESARMADO', 'LEVE', 'MEDIANA', 'LONGA', 'PESADA', 'ARREMESSO', 'DISPARO', 'LEVE_COMPLEMENTAR', 'MUNICAO');

-- AlterTable
ALTER TABLE "equipments" DROP COLUMN "base_price",
DROP COLUMN "stats",
DROP COLUMN "tags",
ADD COLUMN     "crit_range" TEXT,
ADD COLUMN     "damage" TEXT,
ADD COLUMN     "damage_type" TEXT,
ADD COLUMN     "effects" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "kind" "EquipmentKind" NOT NULL,
ADD COLUMN     "prerequisites" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "range_text" TEXT,
ADD COLUMN     "slots" JSONB,
ADD COLUMN     "subtype" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "WeaponCategory";

-- DropEnum
DROP TYPE "EquipmentCategory";

-- CreateIndex
CREATE INDEX "equipments_kind_idx" ON "equipments"("kind");

-- CreateIndex
CREATE INDEX "equipments_subtype_idx" ON "equipments"("subtype");

-- CreateIndex
CREATE INDEX "equipments_category_idx" ON "equipments"("category");

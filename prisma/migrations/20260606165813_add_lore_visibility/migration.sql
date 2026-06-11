-- CreateEnum
CREATE TYPE "LoreVisibility" AS ENUM ('GM_ONLY', 'PLAYERS');

-- AlterTable
ALTER TABLE "lore_entries" ADD COLUMN     "visibility" "LoreVisibility" NOT NULL DEFAULT 'GM_ONLY';

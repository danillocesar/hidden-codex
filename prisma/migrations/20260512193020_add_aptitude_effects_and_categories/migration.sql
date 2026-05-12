-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AptitudeCategory" ADD VALUE 'HABILIDADE';
ALTER TYPE "AptitudeCategory" ADD VALUE 'MANOBRA';
ALTER TYPE "AptitudeCategory" ADD VALUE 'META';

-- AlterTable
ALTER TABLE "aptitudes" ADD COLUMN     "effects" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "evolutions" JSONB NOT NULL DEFAULT '[]';

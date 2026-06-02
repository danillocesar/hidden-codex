-- AlterTable
ALTER TABLE "character_jutsus" ADD COLUMN     "levels" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

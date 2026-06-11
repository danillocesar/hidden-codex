-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "learned_effects" JSONB NOT NULL DEFAULT '{}';

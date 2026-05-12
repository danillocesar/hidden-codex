-- AlterEnum
ALTER TYPE "PowerCategory" ADD VALUE 'HIJUTSU';

-- AlterTable
ALTER TABLE "power_effects" ALTER COLUMN "updated_at" DROP DEFAULT;

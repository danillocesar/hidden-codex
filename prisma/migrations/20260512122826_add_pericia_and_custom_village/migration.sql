-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "custom_village_name" TEXT;

-- AlterTable
ALTER TABLE "villages" ADD COLUMN     "country" TEXT,
ADD COLUMN     "leader_title" TEXT,
ADD COLUMN     "translation" TEXT;

-- CreateTable
CREATE TABLE "pericias" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attribute" TEXT NOT NULL,
    "trained" BOOLEAN NOT NULL DEFAULT false,
    "double_trained" BOOLEAN NOT NULL DEFAULT false,
    "armor_penalty" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "short_description" TEXT,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pericias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pericias_code_key" ON "pericias"("code");

-- CreateEnum
CREATE TYPE "CharacterRank" AS ENUM ('ACADEMICO', 'GENIN', 'CHUUNIN', 'JOUNIN', 'ANBU', 'KAGE');

-- CreateEnum
CREATE TYPE "CharacterSize" AS ENUM ('MINUSCULO', 'MIUDO', 'PEQUENO', 'MEDIUM', 'GRANDE', 'ENORME', 'COLOSSAL');

-- CreateEnum
CREATE TYPE "AptitudeCategory" AS ENUM ('COMBATE', 'PODER', 'PERICIA', 'GERAL', 'RESTRITA');

-- CreateEnum
CREATE TYPE "PowerCategory" AS ENUM ('NINPOU', 'TAIJUTSU', 'GENJUTSU', 'KEKKEI_GENKAI', 'HIJUTSU');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('ARMA_CC', 'ARMA_CD', 'ARMA_ARREMESSO', 'ARMADURA', 'ESCUDO', 'ITEM_NINJA', 'CONSUMIVEL', 'MISC');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "campaign_level" INTEGER NOT NULL,
    "rank" "CharacterRank" NOT NULL DEFAULT 'GENIN',
    "tendency" TEXT,
    "size" "CharacterSize" NOT NULL DEFAULT 'MEDIUM',
    "clan_id" UUID,
    "village_id" UUID,
    "kekkei_genkai_id" UUID,
    "attr_for" INTEGER NOT NULL DEFAULT 1,
    "attr_des" INTEGER NOT NULL DEFAULT 1,
    "attr_agi" INTEGER NOT NULL DEFAULT 1,
    "attr_per" INTEGER NOT NULL DEFAULT 1,
    "attr_int" INTEGER NOT NULL DEFAULT 1,
    "attr_vig" INTEGER NOT NULL DEFAULT 1,
    "attr_esp" INTEGER NOT NULL DEFAULT 1,
    "base_cc" INTEGER NOT NULL DEFAULT 5,
    "base_cd" INTEGER NOT NULL DEFAULT 3,
    "base_esq" INTEGER NOT NULL DEFAULT 3,
    "base_lm" INTEGER NOT NULL DEFAULT 1,
    "social_carisma" INTEGER NOT NULL DEFAULT 0,
    "social_manipulacao" INTEGER NOT NULL DEFAULT 0,
    "current_vitality" INTEGER NOT NULL,
    "current_chakra" INTEGER NOT NULL,
    "biography" TEXT,
    "ui_state" JSONB NOT NULL DEFAULT '{}',
    "ryos" INTEGER NOT NULL DEFAULT 0,
    "is_public_on_profile" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_pericias" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "pericia_code" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "character_pericias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aptitudes" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AptitudeCategory" NOT NULL,
    "cost_points" INTEGER NOT NULL DEFAULT 2,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "prerequisites" JSONB NOT NULL DEFAULT '{}',
    "restrictions" JSONB NOT NULL DEFAULT '{}',
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aptitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_aptitudes" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "aptitude_id" UUID NOT NULL,
    "parameter" TEXT,
    "is_free_from_origin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "character_aptitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "powers" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PowerCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "cost_per_level" INTEGER NOT NULL DEFAULT 1,
    "restrictions" JSONB NOT NULL DEFAULT '{}',
    "element" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_effects" (
    "id" UUID NOT NULL,
    "power_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_level" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "stats" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "power_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_powers" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "power_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "character_powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_jutsus" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "power_id" UUID NOT NULL,
    "power_effect_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kanji_name" TEXT,
    "translation" TEXT,
    "flavor_text" TEXT,
    "image_url" TEXT,
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_jutsus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "stats" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "base_price" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_inventory_items" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "equipment_id" UUID,
    "custom_name" TEXT,
    "custom_stats" JSONB,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "benefits" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "benefits" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kekkei_genkais" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "benefits" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kekkei_genkais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_images" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_name" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "file_size_bytes" INTEGER,
    "label" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3),
    "tag" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "character_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "characters_user_id_idx" ON "characters"("user_id");

-- CreateIndex
CREATE INDEX "characters_deleted_at_idx" ON "characters"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "character_pericias_character_id_pericia_code_key" ON "character_pericias"("character_id", "pericia_code");

-- CreateIndex
CREATE UNIQUE INDEX "aptitudes_code_key" ON "aptitudes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "character_aptitudes_character_id_aptitude_id_parameter_key" ON "character_aptitudes"("character_id", "aptitude_id", "parameter");

-- CreateIndex
CREATE UNIQUE INDEX "powers_code_key" ON "powers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "power_effects_power_id_code_key" ON "power_effects"("power_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "character_powers_character_id_power_id_key" ON "character_powers"("character_id", "power_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_code_key" ON "equipments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clans_code_key" ON "clans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "villages_code_key" ON "villages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "kekkei_genkais_code_key" ON "kekkei_genkais"("code");

-- CreateIndex
CREATE INDEX "character_images_character_id_idx" ON "character_images"("character_id");

-- CreateIndex
CREATE INDEX "diary_entries_character_id_idx" ON "diary_entries"("character_id");

-- CreateIndex
CREATE INDEX "diary_entries_deleted_at_idx" ON "diary_entries"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_token_idx" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_character_id_idx" ON "share_links"("character_id");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_kekkei_genkai_id_fkey" FOREIGN KEY ("kekkei_genkai_id") REFERENCES "kekkei_genkais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_pericias" ADD CONSTRAINT "character_pericias_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_aptitudes" ADD CONSTRAINT "character_aptitudes_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_aptitudes" ADD CONSTRAINT "character_aptitudes_aptitude_id_fkey" FOREIGN KEY ("aptitude_id") REFERENCES "aptitudes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_effects" ADD CONSTRAINT "power_effects_power_id_fkey" FOREIGN KEY ("power_id") REFERENCES "powers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_powers" ADD CONSTRAINT "character_powers_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_powers" ADD CONSTRAINT "character_powers_power_id_fkey" FOREIGN KEY ("power_id") REFERENCES "powers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_jutsus" ADD CONSTRAINT "character_jutsus_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventory_items" ADD CONSTRAINT "character_inventory_items_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_inventory_items" ADD CONSTRAINT "character_inventory_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_images" ADD CONSTRAINT "character_images_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

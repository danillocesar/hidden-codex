-- CreateEnum
CREATE TYPE "CombatStatus" AS ENUM ('SETUP', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "ParticipantKind" AS ENUM ('PLAYER', 'GM_CHARACTER', 'GENERIC_ENEMY');

-- CreateTable
CREATE TABLE "worlds" (
    "id" UUID NOT NULL,
    "gm_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invite_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "worlds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_members" (
    "id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "character_id" UUID,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_members" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "world_member_id" UUID NOT NULL,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_npcs" (
    "id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "character_id" UUID NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_npcs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lore_folders" (
    "id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lore_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lore_entries" (
    "id" UUID NOT NULL,
    "world_id" UUID NOT NULL,
    "folder_id" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lore_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combats" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Combate',
    "status" "CombatStatus" NOT NULL DEFAULT 'SETUP',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "combats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_participants" (
    "id" UUID NOT NULL,
    "combat_id" UUID NOT NULL,
    "kind" "ParticipantKind" NOT NULL,
    "character_id" UUID,
    "enemy_name" TEXT,
    "enemy_max_hp" INTEGER,
    "enemy_current_hp" INTEGER,
    "initiative" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "combat_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "worlds_invite_token_key" ON "worlds"("invite_token");

-- CreateIndex
CREATE INDEX "worlds_gm_id_idx" ON "worlds"("gm_id");

-- CreateIndex
CREATE INDEX "world_members_world_id_idx" ON "world_members"("world_id");

-- CreateIndex
CREATE INDEX "world_members_user_id_idx" ON "world_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "world_members_world_id_user_id_key" ON "world_members"("world_id", "user_id");

-- CreateIndex
CREATE INDEX "campaigns_world_id_idx" ON "campaigns"("world_id");

-- CreateIndex
CREATE INDEX "campaign_members_campaign_id_idx" ON "campaign_members"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_campaign_id_world_member_id_key" ON "campaign_members"("campaign_id", "world_member_id");

-- CreateIndex
CREATE INDEX "world_npcs_world_id_idx" ON "world_npcs"("world_id");

-- CreateIndex
CREATE UNIQUE INDEX "world_npcs_world_id_character_id_key" ON "world_npcs"("world_id", "character_id");

-- CreateIndex
CREATE INDEX "lore_folders_world_id_idx" ON "lore_folders"("world_id");

-- CreateIndex
CREATE INDEX "lore_folders_parent_id_idx" ON "lore_folders"("parent_id");

-- CreateIndex
CREATE INDEX "lore_entries_world_id_idx" ON "lore_entries"("world_id");

-- CreateIndex
CREATE INDEX "lore_entries_folder_id_idx" ON "lore_entries"("folder_id");

-- CreateIndex
CREATE INDEX "combats_campaign_id_idx" ON "combats"("campaign_id");

-- CreateIndex
CREATE INDEX "combat_participants_combat_id_idx" ON "combat_participants"("combat_id");

-- AddForeignKey
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_gm_id_fkey" FOREIGN KEY ("gm_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_members" ADD CONSTRAINT "world_members_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_members" ADD CONSTRAINT "world_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_members" ADD CONSTRAINT "world_members_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_world_member_id_fkey" FOREIGN KEY ("world_member_id") REFERENCES "world_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_npcs" ADD CONSTRAINT "world_npcs_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_npcs" ADD CONSTRAINT "world_npcs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_folders" ADD CONSTRAINT "lore_folders_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_folders" ADD CONSTRAINT "lore_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "lore_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_entries" ADD CONSTRAINT "lore_entries_world_id_fkey" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_entries" ADD CONSTRAINT "lore_entries_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "lore_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_participants" ADD CONSTRAINT "combat_participants_combat_id_fkey" FOREIGN KEY ("combat_id") REFERENCES "combats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_participants" ADD CONSTRAINT "combat_participants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

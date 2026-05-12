-- Constraints adicionais ao schema base.
-- Defesa em profundidade: Zod no client, Zod no server, CHECKs no banco.
-- Referência: arcana-forge-spec/03-DATA-MODEL.md §"Constraints e validações no banco"
-- e arcana-forge-spec/04-RULES-ENGINE.md §"Tabela de evolução".

ALTER TABLE "characters"
  ADD CONSTRAINT "campaign_level_range"
  CHECK ("campaign_level" >= 1 AND "campaign_level" <= 30);

ALTER TABLE "characters"
  ADD CONSTRAINT "current_vit_lower_bound"
  CHECK ("current_vitality" >= -50);

ALTER TABLE "characters"
  ADD CONSTRAINT "current_chk_nonneg"
  CHECK ("current_chakra" >= 0);

ALTER TABLE "characters"
  ADD CONSTRAINT "attr_min"
  CHECK (
    "attr_for" >= 0 AND "attr_des" >= 0 AND "attr_agi" >= 0 AND
    "attr_per" >= 0 AND "attr_int" >= 0 AND "attr_vig" >= 0 AND "attr_esp" >= 0
  );

ALTER TABLE "characters"
  ADD CONSTRAINT "attr_max"
  CHECK (
    "attr_for" <= 30 AND "attr_des" <= 30 AND "attr_agi" <= 30 AND
    "attr_per" <= 30 AND "attr_int" <= 30 AND "attr_vig" <= 30 AND "attr_esp" <= 30
  );

ALTER TABLE "characters"
  ADD CONSTRAINT "ryos_nonneg"
  CHECK ("ryos" >= 0);

ALTER TABLE "characters"
  ADD CONSTRAINT "social_nonneg"
  CHECK ("social_carisma" >= 0 AND "social_manipulacao" >= 0);

ALTER TABLE "character_pericias"
  ADD CONSTRAINT "pericia_points_nonneg"
  CHECK ("points" >= 0);

ALTER TABLE "character_powers"
  ADD CONSTRAINT "power_level_range"
  CHECK ("level" >= 1 AND "level" <= 15);

ALTER TABLE "character_inventory_items"
  ADD CONSTRAINT "quantity_positive"
  CHECK ("quantity" >= 1);

-- Índices condicionais com WHERE — performance em queries comuns.
CREATE INDEX "idx_characters_user_active"
  ON "characters" ("user_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_diary_character_recent"
  ON "diary_entries" ("character_id", "created_at" DESC)
  WHERE "deleted_at" IS NULL;

CREATE INDEX "idx_share_links_active"
  ON "share_links" ("token")
  WHERE "is_active" = true;

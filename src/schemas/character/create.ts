import { z } from 'zod';
import { ATTRIBUTE_KEYS, COMBAT_SKILL_KEYS } from '@/domain/types';
import { PERICIAS } from '@/domain/catalog/pericias';

/**
 * Schema canonico do input do wizard de criacao de personagem (P0.2).
 *
 * Espelha as regras do motor (src/domain/rules/*) — validacao de campo basica
 * fica aqui (tipos, ranges, NC, len de strings); validacao SEMANTICA (budget,
 * pre-reqs de aptidoes, limites por NC) acontece no server action chamando
 * o motor. Defesa em profundidade: client usa este schema pra UX, server
 * reusa pra seguranca, motor valida regras de RPG.
 *
 * Fonte: arcana-forge-spec/04-RULES-ENGINE.md + 06-MVP-ROADMAP.md F2.4.
 */

const NC_MIN = 4;
const NC_MAX = 30; // tabela vai ate 20 + extrapolacao; cap generoso.
const NAME_MAX = 80;
const TEXT_MAX = 60;

const attributeValueSchema = z.number().int().min(0).max(NC_MAX);
const attributesSchema = z.object(
  Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, attributeValueSchema])) as Record<
    (typeof ATTRIBUTE_KEYS)[number],
    typeof attributeValueSchema
  >,
);

const baseValueSchema = z.number().int().min(0).max(10);
const combatBasesSchema = z.object(
  Object.fromEntries(COMBAT_SKILL_KEYS.map((k) => [k, baseValueSchema])) as Record<
    (typeof COMBAT_SKILL_KEYS)[number],
    typeof baseValueSchema
  >,
);

const PERICIA_CODES = new Set(PERICIAS.map((p) => p.code));
const periciaPointsSchema = z.number().int().min(0).max(20);
const periciasRecordSchema = z.record(z.string(), periciaPointsSchema).superRefine((value, ctx) => {
  for (const code of Object.keys(value)) {
    if (!PERICIA_CODES.has(code)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Pericia desconhecida: ${code}`,
        path: [code],
      });
    }
  }
});

const powerLevelSchema = z.number().int().min(1).max(30);
const powersInputSchema = z.array(
  z.object({
    code: z.string().min(1).max(60),
    level: powerLevelSchema,
  }),
);

/**
 * Efeitos selecionados agrupados por codigo do poder. Cada nivel de poder
 * concede 1 slot → array de codes do mesmo tamanho que `power.level`.
 * Validacao SEMANTICA (count, availableFor, minLevel, prereqs) acontece
 * no motor `validateEffectSelection`, nao aqui.
 */
const effectsByPowerSchema = z
  .record(z.string().min(1).max(60), z.array(z.string().min(1).max(80)).max(30))
  .default({});

const aptitudesInputSchema = z.array(
  z.object({
    code: z.string().min(1).max(60),
    /**
     * Parametro pra aptidoes parametrizadas (perito_medicina,
     * usar_arma_katana). `null` para aptidoes nao-parametrizadas.
     */
    parameter: z.string().min(1).max(40).nullable().optional(),
  }),
);

/**
 * Itens de inventario escolhidos no step final do wizard. Cada item referencia
 * um `equipmentCode` do catalogo (equipments.json). `equipped` marca armas em
 * uso (alimenta o card "Combate Rapido" da ficha). Validacao de existencia do
 * code acontece no server action (lookup no banco).
 */
const inventoryInputSchema = z
  .array(
    z.object({
      equipmentCode: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(9999).default(1),
      equipped: z.boolean().default(false),
      notes: z.string().trim().max(280).nullable().optional(),
    }),
  )
  .max(200)
  .default([]);

const identitySchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatorio.').max(NAME_MAX),
  age: z.number().int().min(0).max(999).nullable().optional(),
  gender: z.string().trim().max(TEXT_MAX).nullable().optional(),
  campaignLevel: z
    .number()
    .int()
    .min(NC_MIN, `NC minimo e ${NC_MIN}.`)
    .max(NC_MAX, `NC maximo e ${NC_MAX}.`),
  /**
   * Vila canonica (`code` em villages.json) OU customVillageName. Excludente
   * via refinement no schema final.
   */
  villageCode: z.string().min(1).max(60).nullable().optional(),
  customVillageName: z.string().trim().max(NAME_MAX).nullable().optional(),
  /**
   * Cla canonico (`code` em clans.json) OU customClanName.
   */
  clanCode: z.string().min(1).max(60).nullable().optional(),
  customClanName: z.string().trim().max(NAME_MAX).nullable().optional(),
  /**
   * Kekkei Genkai opcional. Quando o cla tem `benefits.kekkeiGenkai` definido,
   * o wizard pre-preenche este campo; usuario pode confirmar/limpar.
   */
  kekkeiGenkaiCode: z.string().min(1).max(60).nullable().optional(),
  /**
   * URL relativa do retrato (`/uploads/portraits/...`). Setada pelo upload
   * via `POST /api/upload/character-portrait` antes do submit do wizard.
   */
  portraitUrl: z.string().startsWith('/uploads/portraits/').max(200).nullable().optional(),
});

export const createCharacterInputSchema = z
  .object({
    identity: identitySchema,
    attributes: attributesSchema,
    bases: combatBasesSchema,
    pericias: periciasRecordSchema,
    powers: powersInputSchema,
    effectsByPower: effectsByPowerSchema,
    aptitudes: aptitudesInputSchema,
    inventory: inventoryInputSchema,
  })
  .superRefine((input, ctx) => {
    const id = input.identity;
    if (id.villageCode && id.customVillageName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identity', 'customVillageName'],
        message: 'Use OU villageCode OU customVillageName, nao ambos.',
      });
    }
    if (id.clanCode && id.customClanName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identity', 'customClanName'],
        message: 'Use OU clanCode OU customClanName, nao ambos.',
      });
    }
  });

export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;

export type CreateCharacterIdentity = z.infer<typeof identitySchema>;

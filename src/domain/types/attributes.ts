/**
 * Os 7 atributos primários do sistema Shinobi no Sho 4.1b.
 * Fonte: arcana-forge-spec/04-RULES-ENGINE.md.
 */
export const ATTRIBUTE_KEYS = ['for', 'des', 'agi', 'per', 'int', 'vig', 'esp'] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export type Attributes = Readonly<Record<AttributeKey, number>>;

export const COMBAT_SKILL_KEYS = ['cc', 'cd', 'esq', 'lm'] as const;
export type CombatSkillKey = (typeof COMBAT_SKILL_KEYS)[number];

export type CombatSkillBases = Readonly<Record<CombatSkillKey, number>>;

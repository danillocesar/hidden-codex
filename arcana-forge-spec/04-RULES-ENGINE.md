# 04 — Motor de Regras (Rules Engine)

## 🎯 Visão geral

O **motor de regras** é o coração técnico do Arcana Forge. Implementa toda a matemática e lógica do sistema Shinobi no Sho 4.1b: cálculo de pontos, atributos derivados, validações, custos, danos, etc.

### Princípios

1. **Pura função.** Sem dependência de banco, framework, ou estado global. Recebe `Character` (objeto), retorna cálculos.
2. **Determinístico.** Mesma entrada → mesma saída. Sempre.
3. **Testável isoladamente.** Cada fórmula tem teste. Cobertura alvo 90%+.
4. **Source-truth: o livro.** Fórmulas vêm do *Livro Básico 4.1b*. Desvios são exceções marcadas explicitamente.
5. **Modular.** Cada arquivo cobre uma área (atributos, perícias, dano, etc.) — fácil de navegar e modificar.

### Localização

```
src/domain/rules/
├── pointsBudget.ts       # Pontos disponíveis por NC
├── attributeLimits.ts    # Mínimos/máximos de atributos por NC
├── derivedStats.ts       # CC, CD, ESQ, LM, Vit, Chakra
├── skills.ts             # Cálculo de perícias
├── aptitudes.ts          # Validação de pré-requisitos
├── powers.ts             # Validação de poderes e níveis
├── jutsus.ts             # Custo, dano, alcance de jutsus
├── damage.ts             # Calculadora de dano (grau, crítico)
├── combat.ts             # Helpers de combate (uso de chakra, dano em vit)
├── leveling.ts           # Subida de NC
└── validation.ts         # Validador geral de ficha (consistência)
```

---

## 📊 Tabela de evolução (constante)

Esta é a tabela base do sistema — hardcoded em `src/domain/catalog/levelTable.ts`:

```typescript
export type LevelRow = {
  campaignLevel: number;
  shinobiRank: 'ESTUDANTE' | 'GENIN' | 'CHUUNIN' | 'JOUNIN_ESPECIAL' | 'JOUNIN' | 'JOUNIN_ELITE' | 'SANNIN_KAGE';
  attrPoints: number;
  pericaPoints: number;
  powerPoints: number;
  minAttribute: number;
};

export const LEVEL_TABLE: LevelRow[] = [
  { campaignLevel: 4,  shinobiRank: 'GENIN',            attrPoints: 12,  pericaPoints: 8,  powerPoints: 4,  minAttribute: 0 },
  { campaignLevel: 5,  shinobiRank: 'GENIN',            attrPoints: 18,  pericaPoints: 12, powerPoints: 6,  minAttribute: 1 },
  { campaignLevel: 6,  shinobiRank: 'GENIN',            attrPoints: 24,  pericaPoints: 16, powerPoints: 8,  minAttribute: 1 },
  { campaignLevel: 7,  shinobiRank: 'CHUUNIN',          attrPoints: 30,  pericaPoints: 20, powerPoints: 10, minAttribute: 2 },
  { campaignLevel: 8,  shinobiRank: 'CHUUNIN',          attrPoints: 36,  pericaPoints: 24, powerPoints: 12, minAttribute: 2 },
  { campaignLevel: 9,  shinobiRank: 'CHUUNIN',          attrPoints: 42,  pericaPoints: 28, powerPoints: 14, minAttribute: 3 },
  { campaignLevel: 10, shinobiRank: 'JOUNIN_ESPECIAL',  attrPoints: 48,  pericaPoints: 32, powerPoints: 16, minAttribute: 3 },
  { campaignLevel: 11, shinobiRank: 'JOUNIN_ESPECIAL',  attrPoints: 54,  pericaPoints: 36, powerPoints: 18, minAttribute: 4 },
  { campaignLevel: 12, shinobiRank: 'JOUNIN',           attrPoints: 60,  pericaPoints: 40, powerPoints: 20, minAttribute: 4 },
  { campaignLevel: 13, shinobiRank: 'JOUNIN',           attrPoints: 66,  pericaPoints: 44, powerPoints: 22, minAttribute: 5 },
  { campaignLevel: 14, shinobiRank: 'JOUNIN',           attrPoints: 72,  pericaPoints: 48, powerPoints: 24, minAttribute: 5 },
  { campaignLevel: 15, shinobiRank: 'JOUNIN_ELITE',     attrPoints: 78,  pericaPoints: 52, powerPoints: 26, minAttribute: 6 },
  { campaignLevel: 16, shinobiRank: 'JOUNIN_ELITE',     attrPoints: 84,  pericaPoints: 56, powerPoints: 28, minAttribute: 6 },
  { campaignLevel: 17, shinobiRank: 'JOUNIN_ELITE',     attrPoints: 90,  pericaPoints: 60, powerPoints: 30, minAttribute: 7 },
  { campaignLevel: 18, shinobiRank: 'SANNIN_KAGE',      attrPoints: 96,  pericaPoints: 64, powerPoints: 32, minAttribute: 7 },
  { campaignLevel: 19, shinobiRank: 'SANNIN_KAGE',      attrPoints: 102, pericaPoints: 68, powerPoints: 34, minAttribute: 8 },
  { campaignLevel: 20, shinobiRank: 'SANNIN_KAGE',      attrPoints: 108, pericaPoints: 72, powerPoints: 40, minAttribute: 8 },
];
```

### Extensão acima de NC 20

O livro diz que NC > 20 segue a mesma proporção (+6 atr, +4 per, +2 pod por nível). Função:

```typescript
export function getLevelRow(nc: number): LevelRow {
  if (nc < 4) throw new Error('NC mínimo é 4');
  if (nc <= 20) return LEVEL_TABLE.find(r => r.campaignLevel === nc)!;

  // Extrapolação acima de NC 20
  const base = LEVEL_TABLE[16]; // NC 20
  const delta = nc - 20;
  return {
    campaignLevel: nc,
    shinobiRank: 'SANNIN_KAGE',
    attrPoints: base.attrPoints + delta * 6,
    pericaPoints: base.pericaPoints + delta * 4,
    powerPoints: base.powerPoints + delta * 2,
    minAttribute: Math.min(8 + Math.floor(delta / 2), 20),
  };
}
```

---

## 🎯 Limites por NC

```typescript
// src/domain/rules/attributeLimits.ts

export function getAttributeLimits(nc: number) {
  const row = getLevelRow(nc);
  return {
    min: row.minAttribute,
    max: nc, // Limite máximo = NC
  };
}

export function getPowerLimit(nc: number): number {
  // Limite de Poder = NC ÷ 2 (arredondado pra BAIXO — única exceção da regra de arredondamento)
  return Math.floor(nc / 2);
}

export function getPericaLimit(nc: number): number {
  // Mesma regra do limite de poder
  return Math.floor(nc / 2);
}

export function getSocialLimit(nc: number): number {
  // Carisma e Manipulação seguem limite de poder
  return Math.floor(nc / 2);
}
```

### Regra de arredondamento

O livro define: **arredondar para CIMA**, exceto **limite de poder/perícia** que arredonda para BAIXO.

```typescript
// src/domain/rules/math.ts
export const roundUp = (n: number) => Math.ceil(n);
export const roundDown = (n: number) => Math.floor(n);
```

> ⚠️ **CRÍTICO:** todos os arredondamentos em cálculos de derivados (dano, alcance, etc.) usam `roundUp`. Apenas `getPowerLimit` e `getPericaLimit` usam `roundDown`. **Se o Claude Code esquecer essa regra, fórmulas vão dar errado em casos de divisão ímpar.**

---

## ⚡ Atributos derivados

### Habilidades de Combate (CC, CD, ESQ, LM)

```typescript
// src/domain/rules/derivedStats.ts

type CharacterCore = {
  attributes: Attributes;
  baseCc: number;     // padrão 5 (após remanejamento)
  baseCd: number;     // padrão 3
  baseEsq: number;    // padrão 3
  baseLm: number;     // padrão 1
  aptitudes: string[]; // codes das aptidões compradas
};

export function calculateCC(char: CharacterCore, opts?: { weaponCategory?: WeaponCategory; weaponKind?: string }): number {
  const hasAcuidade = char.aptitudes.includes('acuidade');
  const allowsAcuidade = ['leve', 'arremesso'].includes(opts?.weaponCategory ?? 'leve') || !opts?.weaponCategory;

  const attribute = (hasAcuidade && allowsAcuidade)
    ? char.attributes.des
    : char.attributes.for;

  // Especialista (categoria específica): +1 quando empunha a arma certa
  let aptitudeBonus = 0;
  if (opts?.weaponKind) {
    const especialistaCode = `especialista_${opts.weaponKind}`;
    if (char.aptitudes.includes(especialistaCode)) aptitudeBonus += 1;
  }

  return char.baseCc + attribute + aptitudeBonus;
}

export function calculateCD(char: CharacterCore): number {
  return char.baseCd + char.attributes.des;
}

export function calculateESQ(char: CharacterCore): number {
  const bonusReflexos = char.aptitudes.includes('reflexos') ? 1 : 0;
  return char.baseEsq + char.attributes.agi + bonusReflexos;
}

export function calculateLM(char: CharacterCore): number {
  const bonusIntuicao = char.aptitudes.includes('intuicao') ? 1 : 0;
  return char.baseLm + char.attributes.per + bonusIntuicao;
}
```

### Regra de remanejamento das bases

O personagem pode mover **até 2 pontos** entre as bases (ex: tirar 2 de LM, colocar em CC). Bases iniciais: CC=3, CD=3, ESQ=3, LM=3 (total 12).

**Validação:**
```typescript
export function validateCombatBases(bases: { cc: number; cd: number; esq: number; lm: number }): ValidationResult {
  const sum = bases.cc + bases.cd + bases.esq + bases.lm;
  if (sum !== 12) return { ok: false, error: 'Soma das bases deve ser 12.' };

  const initial = { cc: 3, cd: 3, esq: 3, lm: 3 };
  let movedFrom = 0;
  let movedTo = 0;
  for (const key of ['cc', 'cd', 'esq', 'lm'] as const) {
    const delta = bases[key] - initial[key];
    if (delta < 0) movedFrom += Math.abs(delta);
    if (delta > 0) movedTo += delta;
  }
  if (movedFrom > 2 || movedTo > 2) {
    return { ok: false, error: 'Máximo de 2 pontos podem ser remanejados.' };
  }
  return { ok: true };
}
```

### Vitalidade

> Fórmula do livro: `10 + 3 × Vigor + 5 × NC`

```typescript
export function calculateMaxVitality(vigor: number, nc: number): number {
  return 10 + (3 * vigor) + (5 * nc);
}
```

**Exemplo:** Satsuki NC 6, Vigor 5 → 10 + 15 + 30 = **55**. ✓

### Chakra

> Fórmula do livro: `10 + 3 × Espírito`

```typescript
export function calculateMaxChakra(espirito: number): number {
  return 10 + (3 * espirito);
}
```

**Exemplo:** Satsuki Espírito 3 → 10 + 9 = **19**. ✓

### Cura natural

```typescript
// Por noite de descanso (8h)
export function vitalityRecoveryPerNight(vigor: number): number {
  return 10 + (2 * vigor);
}

export function chakraRecoveryPerNight(espirito: number): number {
  return 5 + (2 * espirito);
}

// Por hora (frações de descanso, regra opcional)
export function vitalityRecoveryPerHour(vigor: number): number {
  return vitalityRecoveryPerNight(vigor) / 8;
}
```

---

## 📋 Perícias

### Cálculo de nível total

> O nível inicial de uma perícia é igual à **metade do atributo ligado** (arredondado pra CIMA). Pontos investidos somam.

```typescript
// src/domain/rules/skills.ts

export type PericiaDef = {
  code: string;
  name: string;
  attribute: AttributeKey;
  requiresTraining: boolean; // venefício e outras restritas
  forbidden_in_nc_4?: boolean; // venefício específica
};

export function calculatePericiaLevel(
  pointsInvested: number,
  attributeValue: number,
  requiresTraining: boolean = false
): number {
  // Se requer treinamento e não tem pontos, fica em "Sem treino" (0)
  if (requiresTraining && pointsInvested === 0) return 0;

  const initial = Math.ceil(attributeValue / 2);
  return initial + pointsInvested;
}
```

**Exemplos:**
- Acrobacia (Agi 6, 2 pts investidos) → ⌈6/2⌉ + 2 = 3 + 2 = **5** ✓
- Atletismo (For 1, 2 pts) → ⌈1/2⌉ + 2 = 1 + 2 = **3** ✓
- Venefício (Int 1, 0 pts, requer treino) → **0** (não pode usar)

### Limite de pontos por perícia

```typescript
export function getMaxPointsPerPericia(nc: number): number {
  return Math.floor(nc / 2); // arredondado pra baixo
}
```

**Exemplos:**
- NC 4 → max 2 pontos por perícia
- NC 6 → max 3
- NC 7 → max 3 (NC 7/2 = 3.5, arredonda pra baixo = 3)
- NC 8 → max 4

### Validação de gastos totais

```typescript
export function validatePericiaBudget(
  character: CharacterCore,
  pericias: { [code: string]: number },
  nc: number
): ValidationResult {
  const row = getLevelRow(nc);
  const maxBudget = row.pericaPoints;
  const maxPerPericia = getMaxPointsPerPericia(nc);

  let total = 0;
  for (const [code, points] of Object.entries(pericias)) {
    if (points > maxPerPericia) {
      return { ok: false, error: `Perícia ${code} excede o limite (${maxPerPericia} pts).` };
    }
    total += points;
  }

  if (total > maxBudget) {
    return { ok: false, error: `Total de pontos em perícias excede o budget (${total}/${maxBudget}).` };
  }

  return { ok: true };
}
```

---

## 🌀 Poderes

### Custo e limite

```typescript
// src/domain/rules/powers.ts

export function getPowerLevelLimit(nc: number): number {
  return Math.floor(nc / 2);
}

export function calculatePowerCost(level: number, costPerLevel: number = 1): number {
  return level * costPerLevel;
}

/**
 * Calcula o custo TOTAL de poderes, considerando níveis gratuitos
 * concedidos por kekkei genkai ou clã.
 */
export function calculateTotalPowerCost(
  characterPowers: { code: string; level: number }[],
  freeLevelsByPower: { [code: string]: number } // ex: { fuuton: 1, suiton: 1 } da kekkei Hyouton
): number {
  let total = 0;
  for (const { code, level } of characterPowers) {
    const free = freeLevelsByPower[code] ?? 0;
    const paid = Math.max(0, level - free);
    total += paid;
  }
  return total;
}
```

**Exemplo (Satsuki NC 6):**
- Hyouton 3 (3 pts pagos)
- Suiton 2 (1 nível gratuito da Hyouton, 1 nível pago = 1 pt)
- Fuuton 1 (1 nível gratuito, 0 pago)
- Aptidões compradas: Velocista (2 pts) + Lutar às Cegas (2 pts) = 4 pts

Total: 3 + 1 + 0 + 4 = **8 pts**. ✓ (cabe no orçamento NC 6 = 8)

### Validação completa

```typescript
export function validatePowersAndAptitudes(
  character: CharacterCore,
  characterPowers: { code: string; level: number }[],
  characterAptitudes: { aptitudeCode: string; isFreeFromOrigin: boolean }[],
  freeLevelsByPower: { [code: string]: number },
  nc: number
): ValidationResult {
  const row = getLevelRow(nc);
  const limit = getPowerLevelLimit(nc);

  // 1. Cada poder respeita limite de nível
  for (const { code, level } of characterPowers) {
    if (level > limit) {
      return { ok: false, error: `Poder ${code} nível ${level} excede limite ${limit} no NC ${nc}.` };
    }
  }

  // 2. Custo total de poderes
  const powerCost = calculateTotalPowerCost(characterPowers, freeLevelsByPower);

  // 3. Custo total de aptidões (cada aptidão comprada custa 2 pts, exceto gratuitas)
  const aptidaoCost = characterAptitudes
    .filter(a => !a.isFreeFromOrigin)
    .length * 2;

  const total = powerCost + aptidaoCost;
  if (total > row.powerPoints) {
    return { ok: false, error: `Total de pontos de poder excede budget (${total}/${row.powerPoints}).` };
  }

  return { ok: true };
}
```

---

## 🎓 Aptidões

### Validação de pré-requisitos

```typescript
// src/domain/rules/aptitudes.ts

import type { Aptitude } from '@prisma/client';
import { calculateCC, calculateCD, calculateESQ, calculateLM } from './derivedStats';
import { calculatePericiaLevel } from './skills';

type PrerequisiteCheck = {
  type: 'attribute' | 'combatSkill' | 'pericia' | 'power' | 'aptitude' | 'kekkei' | 'clan';
  detail: string;
  met: boolean;
};

export function checkAptitudePrerequisites(
  aptitude: Aptitude,
  character: FullCharacter
): { allMet: boolean; checks: PrerequisiteCheck[] } {
  const prereqs = aptitude.prerequisites as AptitudePrerequisites;
  const checks: PrerequisiteCheck[] = [];

  // Atributos
  if (prereqs.attributes) {
    for (const [attr, required] of Object.entries(prereqs.attributes)) {
      const current = character.attributes[attr as AttributeKey];
      checks.push({
        type: 'attribute',
        detail: `${attr.toUpperCase()} ≥ ${required}`,
        met: current >= required,
      });
    }
  }

  // Habilidades de combate
  if (prereqs.combatSkills) {
    const cc = calculateCC(character);
    const cd = calculateCD(character);
    const esq = calculateESQ(character);
    const lm = calculateLM(character);
    const stats = { cc, cd, esq, lm };
    for (const [skill, required] of Object.entries(prereqs.combatSkills)) {
      checks.push({
        type: 'combatSkill',
        detail: `${skill.toUpperCase()} ≥ ${required}`,
        met: stats[skill as keyof typeof stats] >= required,
      });
    }
  }

  // Poderes
  if (prereqs.powers) {
    for (const [code, required] of Object.entries(prereqs.powers)) {
      const owned = character.powers.find(p => p.code === code);
      checks.push({
        type: 'power',
        detail: `${code} nível ≥ ${required}`,
        met: (owned?.level ?? 0) >= required,
      });
    }
  }

  // Outras aptidões
  if (prereqs.aptitudes) {
    for (const code of prereqs.aptitudes) {
      checks.push({
        type: 'aptitude',
        detail: `aptidão ${code}`,
        met: character.aptitudes.some(a => a.code === code),
      });
    }
  }

  // Kekkei Genkai
  if (prereqs.kekkeiGenkai) {
    for (const kg of prereqs.kekkeiGenkai) {
      checks.push({
        type: 'kekkei',
        detail: `kekkei ${kg}`,
        met: character.kekkeiGenkai?.code === kg,
      });
    }
  }

  // Clã
  if (prereqs.clans) {
    for (const clan of prereqs.clans) {
      checks.push({
        type: 'clan',
        detail: `clã ${clan}`,
        met: character.clan?.code === clan,
      });
    }
  }

  return {
    allMet: checks.every(c => c.met),
    checks,
  };
}
```

### Casos especiais de aptidões importantes

#### Acuidade
> Permite usar Destreza no lugar de Força para CC.

- **Pré-req:** Des 3
- **Implementação:** flag em `calculateCC` (já mostrado acima)
- **Importante:** o livro diz: *"você pode utilizar o seu novo nível de CC com Acuidade para cumprir pré-requisitos de compra de aptidões ou poderes, desde que eles possam ser usados com Acuidade"*

#### Especialista
> +1 de precisão em CC com uma arma específica.

- **Pré-req:** dependente da arma escolhida
- **Implementação:** flag em `calculateCC` (verificada via `aptitudeCode = "especialista_<weaponKind>"`)
- **Daisho rule:** se a arma é katana, automaticamente também aplica em wakizashi quando empunhada via Ambidestria. Isto é hardcoded:

```typescript
// Daisho rule
function appliesEspecialistaDaisho(weapon: string, aptitudes: string[]): boolean {
  if (weapon === 'wakizashi' && aptitudes.includes('especialista_katana')) return true;
  return false;
}
```

#### Ataque Poderoso
> -1 precisão, +1 dano em CC. Declarado **antes** do ataque.

- **Pré-req:** For 3 (ou Des 3 com Acuidade)
- **Implementação:** flag opcional na função `calculateAttackDamage` e `calculateCC`. Não é toggle persistente — é escolha por ataque.

#### Ambidestria
> Permite empunhar uma arma leve em cada mão. Soma o dano das duas armas no cálculo.

- **Pré-req:** CC 12
- **Importante:** "Bônus de precisão (como da aptidão Especialista) não servem para cumprir pré-requisitos." Portanto, CC com Especialista não conta — mas CC com Acuidade conta (porque Acuidade é substituição de atributo, não bônus).

#### Ataque Múltiplo
> Permite 2-3 ataques numa ação padrão, dividindo o dano base igualmente.

- **Pré-req:** CC ou CD 11
- **Implementação:** apenas nota no cálculo de dano. Quando ativo, divide o `damageBase` pelo número de ataques (round up). Cada hit é teste separado, alvos podem ser diferentes.

```typescript
export function calculateMultiAttackDamage(damageBase: number, attackCount: 2 | 3): number {
  return Math.ceil(damageBase / attackCount);
}
```

---

## 🌊 Jutsus e efeitos de poder

### Dano de Canhão

> O livro define: dano de Canhão = **2 × nível do poder**. Substitui a fórmula padrão de Ninpou.

```typescript
// src/domain/rules/jutsus.ts

export function calculateCanhaoDamage(powerLevel: number): number {
  return 2 * powerLevel;
}
```

### Dano padrão de Ninpou (outros efeitos)

> Fórmula geral: `(Espírito ÷ 2) + nível usado do poder`

```typescript
export function calculateNinpouBaseDamage(espirito: number, powerLevelUsed: number): number {
  return Math.ceil(espirito / 2) + powerLevelUsed;
}
```

### Custo de chakra

Cada efeito tem `chakraCost: { base, perLevel }` no JSONB. Calculadora:

```typescript
export function calculateChakraCost(
  effect: PowerEffect,
  levelUsed: number,
  modifiers?: { multiplier?: number; additive?: number }
): number {
  const stats = effect.stats as CanhaoStats; // ou outro tipo
  const base = stats.chakraCost.base ?? 0;
  const perLevel = stats.chakraCost.perLevel ?? 0;
  let cost = base + (perLevel * levelUsed);

  if (modifiers?.multiplier) cost *= modifiers.multiplier;
  if (modifiers?.additive) cost += modifiers.additive;

  return Math.ceil(cost);
}
```

### Alcance

```typescript
export function calculateRange(effect: PowerEffect, espirito: number): number {
  const stats = effect.stats as CanhaoStats;
  const base = stats.range?.base ?? 0;
  const perEsp = stats.range?.perEsp ?? 0;
  return base + (perEsp * espirito);
}
```

---

## ⚔️ Dano de combate

### Dano base de ataque corporal

> Livro: `(Força ÷ 2) + dano da arma`

Mas com **Acuidade**, substitui Força por Destreza no cálculo de **CC** — mas o **dano** continua sendo Força ÷ 2 a menos que o texto da aptidão diga o contrário.

> ⚠️ **NUANCE:** *"O dano do ataque não é alterado por esta aptidão."* (Acuidade). Mas na prática, quem usa Acuidade tem Des alto e For baixo, então o dano é baixo. Algumas mesas usam regra-casa onde Acuidade também afeta dano. **Decisão de motor:** seguir RAW (Acuidade NÃO afeta dano).

> 🔶 **OBSERVAÇÃO MARCADA:** confirmar com usuário se quer aplicar regra-casa. Por padrão, não.

```typescript
// src/domain/rules/damage.ts

export type AttackInputCC = {
  attackerForce: number;
  attackerDexterity: number;
  weaponDamage: number;
  hasAcuidade: boolean;
  useAcuidade: boolean; // arma permite
  ataquePoderoso?: boolean; // +1 dano
  customBonus?: number;
};

export function calculateAttackBaseDamageCC(input: AttackInputCC): number {
  // ⚠️ Por padrão (RAW), Acuidade NÃO afeta dano. Comentado pra evidência futura:
  // const useAttr = (input.hasAcuidade && input.useAcuidade) ? input.attackerDexterity : input.attackerForce;

  // RAW: dano de CC sempre usa Força
  const baseFromAttr = Math.ceil(input.attackerForce / 2);
  let damage = baseFromAttr + input.weaponDamage;

  if (input.ataquePoderoso) damage += 1;
  if (input.customBonus) damage += input.customBonus;

  return Math.max(0, damage); // mínimo zero
}
```

> 🔶 **ABERTO:** "regra-casa Acuidade afeta dano" pode ser ativada via flag global da campanha. Não está no MVP, mas o motor já permite com mudança trivial.

### Dano base de ataque à distância

```typescript
export function calculateAttackBaseDamageCD(input: {
  attackerDexterity: number;
  weaponDamage: number;
}): number {
  return Math.ceil(input.attackerDexterity / 2) + input.weaponDamage;
}
```

### Grau de dano (tabela do 2d8)

```typescript
export type DamageGrade = 0 | 1 | 2 | 3 | 4;
//                       falha crítica, ruim, razoável, ótimo, crítico

export function getDamageGrade(d2d8Result: number, criticalRange: [number, number] = [15, 16]): DamageGrade {
  if (d2d8Result <= 3) return 0; // Falha crítica
  if (d2d8Result >= criticalRange[0] && d2d8Result <= criticalRange[1]) return 4;
  if (d2d8Result <= 8) return 1;
  if (d2d8Result <= 11) return 2;
  if (d2d8Result <= 14) return 3;
  return 4; // 15-16 default
}
```

### Calculadora de dano final por grau (para o modal)

> ⭐ **Esta é a função chave que alimenta o modal de cálculo de dano da UI.**

```typescript
export type DamageBreakdown = {
  components: {
    dda: number;          // Dano de arma
    halfEsp: number;      // ½ Espírito
    nivel: number;        // Nível do poder
    outro: number;        // Bônus custom (Ataque Poderoso, etc.)
  };
  total: number;          // Soma dos componentes
  byGrade: {
    grade1: number;
    grade2: number;
    grade3: number;
    grade4: number;
  };
};

export function calculateDamageBreakdown(opts: {
  damageType: 'cc' | 'cd_thrown' | 'ninpou_canhao' | 'ninpou_standard';
  attackerForce: number;
  attackerDexterity: number;
  attackerEspirito: number;
  weaponDamage?: number;
  powerLevel?: number;     // pra jutsus
  ataquePoderoso?: boolean;
  otherBonus?: number;     // extras (ataque poderoso, etc.)
}): DamageBreakdown {
  let dda = 0;
  let halfEsp = 0;
  let nivel = 0;
  let outro = 0;

  switch (opts.damageType) {
    case 'cc':
      dda = opts.weaponDamage ?? 0;
      // RAW: usa força no dano de CC
      // "2/ESP" no modal aqui significa "metade do atributo principal do ataque"
      // No CC, é metade da Força (não Esp). Mas o nome do componente é genérico "2/ESP" no modal — vou renomear.
      // Por compatibilidade visual com o modal: o componente "2/ESP" mostra metade do atributo apropriado.
      halfEsp = Math.ceil(opts.attackerForce / 2);
      break;
    case 'cd_thrown':
      dda = opts.weaponDamage ?? 0;
      halfEsp = Math.ceil(opts.attackerDexterity / 2);
      break;
    case 'ninpou_canhao':
      nivel = 2 * (opts.powerLevel ?? 0); // dano = 2 × nível
      break;
    case 'ninpou_standard':
      halfEsp = Math.ceil(opts.attackerEspirito / 2);
      nivel = opts.powerLevel ?? 0;
      break;
  }

  if (opts.ataquePoderoso) outro += 1;
  if (opts.otherBonus) outro += opts.otherBonus;

  const total = dda + halfEsp + nivel + outro;

  return {
    components: { dda, halfEsp, nivel, outro },
    total,
    byGrade: {
      grade1: total * 1,
      grade2: total * 2,
      grade3: total * 3,
      grade4: total * 4,
    },
  };
}
```

**Exemplo — Satsuki ataca com Tachi:**
```typescript
const breakdown = calculateDamageBreakdown({
  damageType: 'cc',
  attackerForce: 1,
  attackerDexterity: 6,
  attackerEspirito: 3,
  weaponDamage: 2,  // tachi +2
});
// Componentes: dda=2, halfEsp=1 (For 1/2 round up), nivel=0, outro=0
// Total: 3
// byGrade: { 1:3, 2:6, 3:9, 4:12 }
```

> ⚠️ **Discrepância com a UI atual da Satsuki:** Hoje mostramos "Dano Base 5" para Tachi. Isso usa Acuidade afetando dano (regra-casa). Em RAW, seria 3. **Precisamos resolver** isso antes do MVP.

> 🔶 **DECISÃO PARA O USUÁRIO:** quer regra-casa de "Acuidade afeta dano" ativada? Se sim, fica como flag de campanha.

**Exemplo — Hyouton: Gekkōken (Canhão nv 3):**
```typescript
const breakdown = calculateDamageBreakdown({
  damageType: 'ninpou_canhao',
  attackerForce: 1, attackerDexterity: 6, attackerEspirito: 3,
  powerLevel: 3,
});
// Componentes: dda=0, halfEsp=0, nivel=6, outro=0
// Total: 6
// byGrade: { 1:6, 2:12, 3:18, 4:24 }
```

### Sangramento por crítico

Acerto crítico (grau 4) sempre aplica condição **sangrando** (1 nível). Acumula com hits múltiplos:

```typescript
export function applyCriticalEffects(currentBleedingLevel: number, criticalCount: number = 1): number {
  return currentBleedingLevel + criticalCount;
}
```

---

## 🆙 Subida de Nível de Campanha

### Pontos ganhos

```typescript
// src/domain/rules/leveling.ts

export function getLevelUpDelta(fromNc: number, toNc: number) {
  const from = getLevelRow(fromNc);
  const to = getLevelRow(toNc);
  return {
    attrPointsGained: to.attrPoints - from.attrPoints,
    pericaPointsGained: to.pericaPoints - from.pericaPoints,
    powerPointsGained: to.powerPoints - from.powerPoints,
    minAttributeDelta: to.minAttribute - from.minAttribute,
    rankChanged: from.shinobiRank !== to.shinobiRank,
    newRank: to.shinobiRank,
  };
}
```

### Bônus de sociais por aumento de mínimo

> "A partir do NC 7, sempre que o limite mínimo de atributo aumentar, conceda 2 pontos para serem colocados em Carisma ou Manipulação."

```typescript
export function getSocialBonusOnLevelUp(fromNc: number, toNc: number): number {
  if (toNc < 7) return 0;
  const from = getLevelRow(fromNc);
  const to = getLevelRow(toNc);
  return to.minAttribute > from.minAttribute ? 2 : 0;
}
```

### Atributos abaixo do mínimo após levelup

```typescript
export function findAttributesBelowMin(
  attributes: Attributes,
  nc: number
): { key: AttributeKey; current: number; required: number }[] {
  const { min } = getAttributeLimits(nc);
  const belowMin: { key: AttributeKey; current: number; required: number }[] = [];
  for (const key of attributeKeys) {
    if (attributes[key] < min) {
      belowMin.push({ key, current: attributes[key], required: min });
    }
  }
  return belowMin;
}
```

A UI mostra esses atributos como "obrigatórios" durante a distribuição.

### Validação completa de levelup

```typescript
export function validateLevelUp(
  fromCharacter: FullCharacter,
  toCharacter: FullCharacter
): ValidationResult {
  // 1. NC só pode subir (ou ficar igual em casos de revisão)
  if (toCharacter.campaignLevel < fromCharacter.campaignLevel) {
    return { ok: false, error: 'NC não pode diminuir.' };
  }

  const delta = getLevelUpDelta(fromCharacter.campaignLevel, toCharacter.campaignLevel);

  // 2. Verificar gasto exato dos novos pontos
  const attrSpent = sumAttributeDifference(fromCharacter.attributes, toCharacter.attributes);
  if (attrSpent > delta.attrPointsGained) {
    return { ok: false, error: 'Gastou mais pontos de atributo do que ganhou.' };
  }

  // 3. Mínimos respeitados
  const below = findAttributesBelowMin(toCharacter.attributes, toCharacter.campaignLevel);
  if (below.length > 0) {
    return { ok: false, error: `Atributos abaixo do mínimo: ${below.map(b => b.key).join(', ')}` };
  }

  // 4. Limite máximo respeitado
  const { max } = getAttributeLimits(toCharacter.campaignLevel);
  for (const key of attributeKeys) {
    if (toCharacter.attributes[key] > max) {
      return { ok: false, error: `${key} ultrapassa máximo (${toCharacter.attributes[key]}/${max}).` };
    }
  }

  // 5. ... outras validações (perícias, poder, aptidões)
  return { ok: true };
}
```

### Permitir pontos não gastos

> O livro: *"Embora na criação de personagem você seja obrigado a gastar todos os pontos, isso não acontece na evolução. Você pode guardar seus pontos."*

**Implementação:** o motor permite estado "tem pontos não gastos" como válido. A UI mostra um badge ("3 pontos não gastos") mas não bloqueia uso da ficha.

---

## 🎲 Uso da ficha em mesa

### Gastar chakra (usar jutsu)

```typescript
// src/domain/rules/combat.ts

export function spendChakra(
  currentChakra: number,
  cost: number
): { newChakra: number; exhausted: boolean; error?: string } {
  if (currentChakra < cost) {
    return { newChakra: currentChakra, exhausted: false, error: 'Chakra insuficiente.' };
  }
  const newChakra = currentChakra - cost;
  return {
    newChakra,
    exhausted: newChakra === 0,
  };
}
```

### Tomar dano

```typescript
export type DamageState = {
  newVitality: number;
  status: 'normal' | 'outOfCombat' | 'unconscious' | 'dying' | 'dead';
  bleeding: boolean;
};

export function takeDamage(
  currentVitality: number,
  damage: number,
  isCritical: boolean = false
): DamageState {
  const newVitality = currentVitality - damage;

  let status: DamageState['status'] = 'normal';
  if (newVitality <= -21) status = 'dead';
  else if (newVitality <= -11) status = 'dying';
  else if (newVitality <= -1) status = 'unconscious';
  else if (newVitality <= 0) status = 'outOfCombat';

  return {
    newVitality,
    status,
    bleeding: isCritical,
  };
}
```

### Recuperar vitalidade (cura)

```typescript
export function heal(currentVitality: number, maxVitality: number, amount: number): number {
  return Math.min(currentVitality + amount, maxVitality);
}
```

### Recuperar chakra

```typescript
export function restoreChakra(currentChakra: number, maxChakra: number, amount: number): number {
  return Math.min(currentChakra + amount, maxChakra);
}
```

---

## 🛡️ Validador global de ficha

```typescript
// src/domain/rules/validation.ts

export type FichaValidationReport = {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  category: 'attributes' | 'pericias' | 'powers' | 'aptitudes' | 'combat' | 'energy';
  field?: string;
  message: string;
};

export type ValidationWarning = {
  category: string;
  message: string;
};

export function validateFullCharacter(character: FullCharacter): FichaValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Atributos
  const attrErrors = validateAttributes(character.attributes, character.campaignLevel);
  errors.push(...attrErrors);

  // 2. Bases de combate
  const baseRes = validateCombatBases(character);
  if (!baseRes.ok) errors.push({ category: 'combat', message: baseRes.error! });

  // 3. Perícias
  const pericRes = validatePericiaBudget(character, character.pericias, character.campaignLevel);
  if (!pericRes.ok) errors.push({ category: 'pericias', message: pericRes.error! });

  // 4. Poderes + aptidões
  const powerRes = validatePowersAndAptitudes(
    character,
    character.powers,
    character.aptitudes,
    /* freeLevelsByPower */ getFreePowerLevelsFromOrigin(character),
    character.campaignLevel,
  );
  if (!powerRes.ok) errors.push({ category: 'powers', message: powerRes.error! });

  // 5. Pré-requisitos de aptidões
  for (const apt of character.aptitudes) {
    const check = checkAptitudePrerequisites(apt.definition, character);
    if (!check.allMet) {
      warnings.push({
        category: 'aptitudes',
        message: `Aptidão ${apt.definition.name} tem pré-requisitos não cumpridos.`,
      });
    }
  }

  // 6. Energias correntes
  const maxVit = calculateMaxVitality(character.attributes.vig, character.campaignLevel);
  const maxChk = calculateMaxChakra(character.attributes.esp);
  if (character.currentVitality > maxVit) {
    errors.push({ category: 'energy', message: `Vitalidade atual > máxima.` });
  }
  if (character.currentChakra > maxChk) {
    errors.push({ category: 'energy', message: `Chakra atual > máximo.` });
  }

  return { ok: errors.length === 0, errors, warnings };
}
```

---

## 🔧 Helpers utilitários

```typescript
// src/domain/rules/helpers.ts

export function getFreePowerLevelsFromOrigin(character: FullCharacter): { [code: string]: number } {
  const result: { [code: string]: number } = {};

  // Kekkei genkai concede níveis grátis em poderes elementais
  if (character.kekkeiGenkai) {
    const kgBenefits = character.kekkeiGenkai.benefits as KekkeiGenkaiBenefits;
    Object.assign(result, kgBenefits.freePowerLevelsByElement ?? {});
  }

  // Clã pode conceder poderes grátis
  if (character.clan) {
    const clanBenefits = character.clan.benefits as ClanBenefits;
    for (const fp of clanBenefits.freePowers ?? []) {
      result[fp.code] = (result[fp.code] ?? 0) + fp.level;
    }
  }

  return result;
}
```

---

## 🧪 Testes do motor

### Estrutura

```
tests/unit/domain/
├── derivedStats.test.ts
├── skills.test.ts
├── pointsBudget.test.ts
├── aptitudes.test.ts
├── jutsus.test.ts
├── damage.test.ts
├── leveling.test.ts
└── fixtures/
    ├── satsuki-nc6.ts        # Personagem completo de teste
    ├── naruto-genin.ts
    └── ...
```

### Exemplo de teste com fixture

```typescript
// tests/unit/domain/fixtures/satsuki-nc6.ts
export const satsukiNC6: FullCharacter = {
  name: 'Satsuki Yuki',
  campaignLevel: 6,
  attributes: { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
  baseCc: 5, baseCd: 3, baseEsq: 3, baseLm: 1,
  pericias: {
    acrobacia: 2, atletismo: 2, escapar: 2, furtividade: 2,
    prestidigitacao: 2, procurar: 2, prontidao: 2, rastrear: 2,
  },
  aptitudes: [
    { code: 'especialista_katana', isFreeFromOrigin: true },
    { code: 'acuidade', isFreeFromOrigin: true },
    { code: 'ataque_poderoso', isFreeFromOrigin: true },
    { code: 'velocista', isFreeFromOrigin: false },
    { code: 'lutar_as_cegas', isFreeFromOrigin: false },
  ],
  powers: [
    { code: 'hyouton', level: 3 },
    { code: 'suiton', level: 2 },
    { code: 'fuuton', level: 1 },
  ],
  clan: { code: 'yuki' },
  kekkeiGenkai: {
    code: 'hyouton',
    benefits: { freePowerLevelsByElement: { fuuton: 1, suiton: 1 } },
  },
  currentVitality: 55,
  currentChakra: 19,
};
```

```typescript
// tests/unit/domain/derivedStats.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCC, calculateMaxVitality, calculateMaxChakra } from '@/domain/rules/derivedStats';
import { satsukiNC6 } from './fixtures/satsuki-nc6';

describe('Satsuki NC 6 - Stats derivados', () => {
  it('CC com katana = 12 (5 base + 6 Des via Acuidade + 1 Especialista)', () => {
    expect(calculateCC(satsukiNC6, { weaponCategory: 'mediana', weaponKind: 'katana' })).toBe(12);
  });

  it('CC sem katana = 11 (sem bônus de Especialista)', () => {
    expect(calculateCC(satsukiNC6, { weaponCategory: 'leve', weaponKind: 'dagger' })).toBe(11);
  });

  it('Vitalidade máxima = 55', () => {
    expect(calculateMaxVitality(satsukiNC6.attributes.vig, satsukiNC6.campaignLevel)).toBe(55);
  });

  it('Chakra máximo = 19', () => {
    expect(calculateMaxChakra(satsukiNC6.attributes.esp)).toBe(19);
  });
});
```

---

## ⚠️ Questões abertas e decisões de motor

| # | Questão | Decisão padrão | Pode mudar? |
|:---:|---|---|:---:|
| 1 | Acuidade afeta dano? | **Não (RAW)** | Sim (flag de campanha) |
| 2 | Aptidões "Passivas" (Reflexos, Maestria) — banidas? | **Não banidas** | Sim (flag) |
| 3 | Regra opcional "3 PP por NC" do Guia Avançado | **Não aplicada** | Sim (flag) |
| 4 | Pílulas do Soldado afetam clones? | **Não** (livro explícito) | Não |
| 5 | "Trabalho Duro" empilha com bônus naturais? | **Sim** (livro permite) | Não |
| 6 | Personagens podem ter NC menor que 4? | **Não** (criação mínima é 4) | Sim (modo "Estudante") |
| 7 | Subir NC sem gastar tudo é válido? | **Sim** (livro permite acúmulo) | Não |

Todas essas decisões ficam configuráveis por **flag de campanha** (campo `campaignSettings: JSONB` no `Character` — em uma extensão futura, no `Campaign` quando tabela existir).

---

## 🎯 Resumo das fórmulas críticas

| Cálculo | Fórmula | Arredondamento |
|---|---|---|
| Vitalidade Max | `10 + 3 × Vig + 5 × NC` | exato |
| Chakra Max | `10 + 3 × Esp` | exato |
| CC | `baseCc + (For ou Des c/ Acuidade) + Especialista` | exato |
| CD | `baseCd + Des` | exato |
| ESQ | `baseEsq + Agi + Reflexos` | exato |
| LM | `baseLm + Per + Intuição` | exato |
| Perícia | `⌈Atr/2⌉ + pts investidos` | ↑ cima |
| Dano CC | `⌈For/2⌉ + dano arma + AP` | ↑ cima |
| Dano CD (arremesso) | `⌈Des/2⌉ + dano arma` | ↑ cima |
| Dano Ninpou padrão | `⌈Esp/2⌉ + nível usado` | ↑ cima |
| Dano Canhão | `2 × nível do poder` | exato |
| Alcance | `base + perEsp × Esp` | ↑ cima |
| Limite atributo max | `NC` | exato |
| Limite atributo min | tabela | exato |
| Limite poder | `⌊NC/2⌋` | ↓ **baixo** |
| Limite perícia | `⌊NC/2⌋` | ↓ **baixo** |
| Limite social | `⌊NC/2⌋` | ↓ **baixo** |
| Cura natural (Vit) | `10 + 2 × Vig` por noite | exato |
| Cura natural (Chk) | `5 + 2 × Esp` por noite | exato |

---

*Próximo documento: `05-UI-SPEC.md` — componentes, telas, fluxos visuais.*

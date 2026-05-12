export type SpendChakraResult =
  | { ok: true; newChakra: number; exhausted: boolean }
  | { ok: false; error: string };

/**
 * Tenta gastar `cost` de chakra. Devolve novo total e flag de exaustão se
 * zerou. Não muta entrada — caller decide quando persistir.
 */
export function spendChakra(currentChakra: number, cost: number): SpendChakraResult {
  if (!Number.isFinite(cost) || cost < 0) {
    return { ok: false, error: 'Custo de chakra inválido.' };
  }
  if (currentChakra < cost) {
    return { ok: false, error: 'Chakra insuficiente.' };
  }
  const newChakra = currentChakra - cost;
  return { ok: true, newChakra, exhausted: newChakra === 0 };
}

export type DamageStatus = 'normal' | 'outOfCombat' | 'unconscious' | 'dying' | 'dead';

export type TakeDamageResult = {
  newVitality: number;
  status: DamageStatus;
  bleeding: boolean;
};

/**
 * Aplica dano e classifica o estado.
 *
 * Faixas (Livro Básico):
 *   ≥ 1 ............ normal
 *   0 a -10 ........ fora de combate (incapacitado, mas estável)
 *   -1 a -10 ....... inconsciente (sem ação)
 *   -11 a -20 ...... agonizando (rolagens de morte)
 *   ≤ -21 .......... morto
 *
 * `bleeding=true` é setado quando o dano veio de crítico — o caller pode
 * usar essa info pra empilhar `applyCriticalEffects`.
 */
export function takeDamage(
  currentVitality: number,
  damage: number,
  isCritical = false,
): TakeDamageResult {
  if (!Number.isFinite(damage) || damage < 0) {
    return { newVitality: currentVitality, status: 'normal', bleeding: false };
  }
  const newVitality = currentVitality - damage;

  let status: DamageStatus = 'normal';
  if (newVitality <= -21) status = 'dead';
  else if (newVitality <= -11) status = 'dying';
  else if (newVitality <= -1) status = 'unconscious';
  else if (newVitality <= 0) status = 'outOfCombat';

  return { newVitality, status, bleeding: isCritical };
}

/**
 * Cura vitalidade respeitando o máximo. Cura negativa não dano — clampa a 0.
 */
export function heal(currentVitality: number, maxVitality: number, amount: number): number {
  const restored = currentVitality + Math.max(0, amount);
  return Math.min(restored, maxVitality);
}

/** Restaura chakra respeitando o máximo. Mesma semântica de `heal`. */
export function restoreChakra(currentChakra: number, maxChakra: number, amount: number): number {
  const restored = currentChakra + Math.max(0, amount);
  return Math.min(restored, maxChakra);
}

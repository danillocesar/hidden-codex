'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { adjustChakra, adjustVitality } from '@/server/actions/characters/combat';

/** Rótulos de estado de vitalidade pós-dano (não-normal). */
const STATUS_LABEL: Record<string, string> = {
  outOfCombat: 'fora de combate',
  unconscious: 'inconsciente',
  dying: 'agonizando',
  dead: 'morto',
};

/**
 * Modal de ajuste de energia — Vitalidade (tomar dano / curar) ou Chakra
 * (gastar / restaurar). Persiste via server action e revalida a ficha.
 *
 * Spec: 05-UI-SPEC.md §8 (Tomar Dano) + Fase 4 (curar/restaurar).
 */
export function EnergyAdjustModal({
  open,
  onClose,
  characterId,
  resource,
  current,
  max,
}: {
  open: boolean;
  onClose: () => void;
  characterId: string;
  resource: 'vitality' | 'chakra';
  current: number;
  max: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVit = resource === 'vitality';
  const title = isVit ? 'Vitalidade' : 'Chakra';
  const value = Number.parseInt(amount, 10);
  const valid = Number.isFinite(value) && value > 0;

  function apply(sign: 1 | -1) {
    if (!valid) return;
    setError(null);
    startTransition(async () => {
      const delta = sign * value;
      const res = isVit
        ? await adjustVitality({ characterId, delta, isCritical: sign < 0 ? isCritical : undefined })
        : await adjustChakra({ characterId, delta });
      if (res.ok) {
        if (isVit) {
          const status = res.status && res.status !== 'normal' ? ` · ${STATUS_LABEL[res.status]}` : '';
          toast(
            sign < 0
              ? `Tomou ${value} de dano · Vit ${current} → ${res.vitality}${status}`
              : `Curou ${value} · Vit ${current} → ${res.vitality}`,
            sign < 0 ? (res.status && res.status !== 'normal' ? 'danger' : 'warning') : 'success',
          );
        } else {
          toast(
            sign < 0
              ? `Gastou ${value} de chakra · Chk ${current} → ${res.chakra}`
              : `Restaurou ${value} · Chk ${current} → ${res.chakra}`,
            sign < 0 ? 'info' : 'success',
          );
        }
        setAmount('');
        setIsCritical(false);
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={`Atual: ${current}/${max}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => apply(1)}
            disabled={pending || !valid}
          >
            {isVit ? 'Curar' : 'Restaurar'}
          </Button>
          <Button size="sm" onClick={() => apply(-1)} disabled={pending || !valid}>
            {isVit ? 'Tomar Dano' : 'Gastar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          type="number"
          min={1}
          inputMode="numeric"
          autoFocus
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {isVit ? (
          <Checkbox
            checked={isCritical}
            onChange={setIsCritical}
            label="Foi crítico (causa sangrando)"
          />
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

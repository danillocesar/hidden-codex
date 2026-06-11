'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { ImageWithSkeleton } from '@/components/ui/image-with-skeleton';
import { cn } from '@/lib/utils/cn';
import { calculateDamageBreakdown } from '@/domain/rules/damage';
import { halveBreakdown } from '@/lib/character/damageDisplay';
import type { FichaJutsu } from '@/lib/character/mapPrismaToCore';
import { useJutsu as castJutsu } from '@/server/actions/characters/combat';
import { DamageCalculatorTable } from './DamageCalculatorTable';

/**
 * Modal de uso de jutsu — calculadora de dano interativa + "Usar Jutsu" (debita
 * chakra). Tabs de nível recalculam tudo; toggles de Ataque Poderoso e "Canhão
 * sem chakra" ajustam o dano/custo.
 *
 * Spec: 05-UI-SPEC.md §6.
 */
export function JutsuUseModal({
  open,
  onClose,
  jutsu,
  characterId,
  isOwner,
  attributes,
  accuracy,
  currentChakra,
  hasAtaquePoderoso,
}: {
  open: boolean;
  onClose: () => void;
  jutsu: FichaJutsu;
  characterId: string;
  isOwner: boolean;
  attributes: { for: number; des: number; esp: number };
  /** Valor de acerto resolvido (CC/CD/LM) e rótulo; null se efeito sem ataque. */
  accuracy: { value: number; label: string } | null;
  currentChakra: number;
  /** Personagem possui a aptidão Ataque Poderoso. */
  hasAtaquePoderoso: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [levelIdx, setLevelIdx] = useState(0);
  const [ataquePoderoso, setAtaquePoderoso] = useState(false);
  const [canhaoFree, setCanhaoFree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const levels = jutsu.levels;
  const selectedLevel = levels[levelIdx] ?? levels[0] ?? 1;
  const { damageType, isCanhao, chakraByLevel, elementDamageBonus } = jutsu.combat;
  // Ataque Poderoso é manobra de corpo-a-corpo (CC) e exige a aptidão — só vale
  // em jutsus CC de quem possui a habilidade. Em jutsus à distância não aparece.
  const canAtaquePoderoso = jutsu.acerto === 'cc' && hasAtaquePoderoso;

  // "Canhão sem chakra" só a partir do nível 2 do poder; ao usar, zera custo,
  // divide o dano e desabilita bônus (RAW Livro Básico p. 95).
  const canhaoFreeAvailable = isCanhao && selectedLevel >= 2;
  const freeActive = canhaoFreeAvailable && canhaoFree;

  const breakdown = useMemo(() => {
    if (!damageType) return null;
    const base = calculateDamageBreakdown({
      damageType,
      attackerForce: attributes.for,
      attackerDexterity: attributes.des,
      attackerEspirito: attributes.esp,
      powerLevel: selectedLevel,
      ataquePoderoso: freeActive ? false : canAtaquePoderoso && ataquePoderoso,
      elementDamageBonus,
    });
    return freeActive ? halveBreakdown(base) : base;
  }, [
    damageType,
    attributes,
    selectedLevel,
    ataquePoderoso,
    freeActive,
    elementDamageBonus,
    canAtaquePoderoso,
  ]);

  const baseCost = chakraByLevel[levelIdx] ?? null;
  const chakraCost = freeActive ? 0 : baseCost;
  const costKnown = chakraCost !== null;
  const enoughChakra = costKnown && currentChakra >= chakraCost;

  // Dano descritivo concreto (ex.: Flechas "2 por projétil"): mostra uma linha.
  // Efeitos sem dano direto (Névoa/Barreira = null; Criar Arma = "ver descrição")
  // não mostram nada — sem calculadora.
  const hasDescriptiveDamage = Boolean(jutsu.damage) && jutsu.damage !== 'ver descrição';

  function handleUse() {
    if (!isOwner || !costKnown) return;
    setError(null);
    startTransition(async () => {
      const res = await castJutsu({ characterId, jutsuId: jutsu.id, chakraCost });
      if (res.ok) {
        toast(
          chakraCost > 0
            ? `${jutsu.name} conjurado · Chakra ${currentChakra} → ${res.chakra}`
            : `${jutsu.name} conjurado`,
          chakraCost > 0 ? 'info' : 'success',
        );
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const subtitle = [jutsu.powerName, jutsu.effectName].filter(Boolean).join(' · ') || undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={jutsu.name}
      description={subtitle}
      size={jutsu.imageUrl ? 'xl' : 'lg'}
      footer={
        isOwner ? (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleUse}
              disabled={pending || !costKnown || !enoughChakra}
              title={
                !costKnown
                  ? 'Custo de chakra não calculável automaticamente.'
                  : !enoughChakra
                    ? 'Chakra insuficiente.'
                    : undefined
              }
            >
              {pending ? 'Usando…' : costKnown ? `Usar Jutsu (${chakraCost} Chk)` : 'Usar Jutsu'}
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Tags do efeito */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {[jutsu.action, jutsu.target, jutsu.range, jutsu.duration]
                .filter((v): v is string => Boolean(v))
                .map((v) => (
                  <Badge key={v} tone="neutral" variant="outline" size="xs">
                    {v}
                  </Badge>
                ))}
            </div>
            {jutsu.area ? <InfoLine label="Área de efeito" value={jutsu.area} /> : null}
            {jutsu.prerequisite ? (
              <InfoLine label="Pré-requisito" value={jutsu.prerequisite} />
            ) : null}
          </div>

          {/* Tabs de nível */}
          {levels.length > 1 ? (
            <div>
              <Eyebrow tone="accent" size="xs" as="div" className="mb-1.5 tracking-[0.3em]">
                Nível de uso
              </Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {levels.map((lvl, i) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelIdx(i)}
                    className={cn(
                      'h-9 w-9 border font-serif text-base transition-colors',
                      i === levelIdx
                        ? 'border-ice bg-ice-deep/40 text-ice-bright'
                        : 'border-border text-ink-muted hover:border-ice-deep',
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Acerto + chakra */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox label={accuracy ? `Acerto (${accuracy.label})` : 'Acerto'}>
              {accuracy ? accuracy.value : '—'}
            </StatBox>
            <StatBox label="Chakra">{costKnown ? chakraCost : (jutsu.chakraCost ?? '—')}</StatBox>
          </div>

          {/* Dano: calculadora quando computável; linha simples quando descritivo;
              nada quando o efeito não causa dano direto. */}
          {breakdown ? (
            <div>
              <Eyebrow tone="accent" size="xs" as="div" className="mb-2 tracking-[0.3em]">
                Calculadora de Dano
              </Eyebrow>
              <DamageCalculatorTable breakdown={breakdown} halfLabel="½ Esp" />
            </div>
          ) : hasDescriptiveDamage ? (
            <InfoLine label="Dano" value={jutsu.damage ?? ''} />
          ) : null}

          {/* Toggles — Ataque Poderoso só em CC com a aptidão; Canhão sem chakra só no Canhão nv≥2 */}
          {breakdown && (canAtaquePoderoso || canhaoFreeAvailable) ? (
            <div className="flex flex-col gap-2">
              {canAtaquePoderoso ? (
                <Checkbox
                  checked={freeActive ? false : ataquePoderoso}
                  onChange={setAtaquePoderoso}
                  disabled={freeActive}
                  label="Ataque Poderoso (+1 dano)"
                />
              ) : null}
              {canhaoFreeAvailable ? (
                <Checkbox
                  checked={canhaoFree}
                  onChange={setCanhaoFree}
                  label="Canhão sem custo de chakra (dano ÷2, sem bônus)"
                />
              ) : null}
            </div>
          ) : null}

          {error ? <Alert tone="danger">{error}</Alert> : null}
        </div>

        {jutsu.imageUrl ? (
          <div className="lg:order-first lg:w-64 lg:shrink-0">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded border border-border bg-bg-card">
              <ImageWithSkeleton
                src={jutsu.imageUrl}
                alt={jutsu.name}
                className="h-full w-full object-cover object-[center_25%]"
                style={{ filter: 'saturate(0.8) contrast(1.05) brightness(0.9)' }}
              />
              <span
                className="pointer-events-none absolute bottom-1 right-2 select-none font-serif text-4xl text-ice-bright/70"
                style={{ textShadow: '0 0 24px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.8)' }}
                aria-hidden
              >
                {jutsu.powerKanji}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function StatBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-bg-card px-3 py-2.5">
      <p className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl font-medium leading-none text-ice-bright">
        {children}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="font-body text-xs text-ink-muted">
      <span className="font-display text-[9px] uppercase tracking-[0.25em] text-ink-faint">
        {label}:
      </span>{' '}
      <span className="text-ink">{value}</span>
    </p>
  );
}

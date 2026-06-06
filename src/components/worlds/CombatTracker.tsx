'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import type { CombatView } from '@/server/queries/combats';
import { CombatCard } from '@/components/ui/CombatCard';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { Alert } from '@/components/ui/alert';
import {
  setInitiative,
  updateEnemyHp,
  activateCombat,
  endCombat,
} from '@/server/actions/worlds/combat';

interface CombatTrackerProps {
  worldId: string;
  combat: CombatView;
  isGm: boolean;
}

/**
 * Tracker de combate ao vivo. Polling a cada 5s para manter todos os
 * jogadores atualizados sem precisar de WebSockets.
 */
export function CombatTracker({ worldId, combat, isGm }: CombatTrackerProps) {
  const router = useRouter();

  // Polling — refresca os dados do Server Component a cada 5 segundos
  React.useEffect(() => {
    if (combat.status !== 'ACTIVE') return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [combat.status, router]);

  async function handleInitiative(participantId: string, value: number | null) {
    await setInitiative(worldId, combat.id, participantId, value);
    router.refresh();
  }

  async function handleHpChange(participantId: string, value: number) {
    await updateEnemyHp(worldId, combat.id, participantId, value);
    router.refresh();
  }

  async function handleActivate() {
    await activateCombat(worldId, combat.id);
    router.refresh();
  }

  async function handleEnd() {
    if (!confirm('Encerrar o combate?')) return;
    await endCombat(worldId, combat.id);
    router.refresh();
  }

  const statusLabel = { SETUP: 'Configurando', ACTIVE: 'Em andamento', ENDED: 'Encerrado' }[
    combat.status
  ];

  return (
    <Stack gap="lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Heading level={2}>{combat.name}</Heading>
          <Text variant="muted" size="sm">
            {statusLabel} · {combat.participants.length} participante
            {combat.participants.length !== 1 ? 's' : ''}
          </Text>
        </div>

        {isGm && (
          <div className="flex gap-2">
            {combat.status === 'SETUP' && (
              <Button variant="default" size="sm" onClick={handleActivate}>
                Iniciar Combate
              </Button>
            )}
            {combat.status === 'ACTIVE' && (
              <Button variant="seal" size="sm" onClick={handleEnd}>
                Encerrar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Aviso para jogadores quando SETUP */}
      {!isGm && combat.status === 'SETUP' && (
        <Alert tone="info">O Mestre está configurando o combate. Aguarde…</Alert>
      )}

      {/* Cards dos participantes */}
      {combat.participants.length === 0 ? (
        <Text variant="muted">Nenhum participante ainda.</Text>
      ) : (
        <div className="flex flex-wrap gap-4">
          {combat.participants.map((p) => {
            const isEnemy = p.kind === 'GENERIC_ENEMY' || p.kind === 'GM_CHARACTER';
            const hpHidden = isEnemy && !isGm;

            return (
              <CombatCard
                key={p.id}
                name={
                  p.kind === 'GENERIC_ENEMY'
                    ? (p.enemyName ?? 'Inimigo')
                    : (p.characterName ?? '?')
                }
                portraitUrl={p.characterPortraitUrl}
                kind={p.kind}
                currentHp={
                  hpHidden
                    ? null
                    : p.kind === 'GENERIC_ENEMY'
                      ? (p.enemyCurrentHp ?? 0)
                      : (p.characterCurrentVitality ?? 0)
                }
                maxHp={
                  hpHidden
                    ? null
                    : p.kind === 'GENERIC_ENEMY'
                      ? (p.enemyMaxHp ?? 0)
                      : (p.characterMaxVitality ?? 0)
                }
                currentChakra={p.characterCurrentChakra}
                maxChakra={p.characterMaxChakra}
                initiative={p.initiative}
                isGm={isGm}
                onInitiativeChange={isGm ? (v) => handleInitiative(p.id, v) : undefined}
                onHpChange={
                  isGm && p.kind === 'GENERIC_ENEMY'
                    ? (v) => handleHpChange(p.id, v)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </Stack>
  );
}

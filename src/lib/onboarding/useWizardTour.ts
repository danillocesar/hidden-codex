'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WizardStepId } from '@/app/(app)/characters/new/wizardValidation';
import { WIZARD_TOUR_STEPS } from './wizardTourSteps';

/**
 * Hook do tour guiado do wizard de criacao de personagem.
 *
 * O wizard renderiza apenas a aba ativa no DOM, entao o tour e "por aba": cada
 * vez que a aba ativa muda (inclusive ao avancar com "Proximo"), disparamos o
 * sub-tour daquela aba via driver.js. Passos cujo elemento nao esta no DOM
 * (UI condicional/opcional) sao filtrados antes de iniciar.
 *
 * Persistencia: flag em `localStorage` marca que o usuario ja viu — usada so
 * para NAO auto-disparar de novo. O botao manual ("Ver tour") ignora a flag.
 */

const STORAGE_KEY = 'arcana.onboarding.wizard.v1';

function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markTourSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // localStorage indisponivel (modo privado etc.) — degrada sem quebrar.
  }
}

/** Cor do overlay derivada do token `--bg-deep` (evita cor hardcoded). */
function resolveOverlayColor(): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--bg-deep').trim();
  return raw ? `rgb(${raw})` : '#0a0b0e';
}

export type WizardTourMode = 'create' | 'edit' | 'levelup';

export function useWizardTour({
  isFirstCharacter,
  mode,
  currentStepId,
}: {
  isFirstCharacter: boolean;
  mode: WizardTourMode;
  currentStepId: WizardStepId;
}) {
  const [active, setActive] = useState(false);
  // Incrementa a cada replay manual pra re-disparar o tour da aba atual mesmo
  // que `active`/`currentStepId` nao tenham mudado.
  const [runNonce, setRunNonce] = useState(0);
  const autoChecked = useRef(false);

  // Auto-dispara uma unica vez: 1o personagem, modo criacao, ainda nao visto.
  useEffect(() => {
    if (autoChecked.current) return;
    autoChecked.current = true;
    if (mode === 'create' && isFirstCharacter && !hasSeenTour()) {
      setActive(true);
    }
  }, [isFirstCharacter, mode]);

  const startTour = useCallback(() => {
    setActive(true);
    setRunNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!active) return;
    const steps = WIZARD_TOUR_STEPS[currentStepId] ?? [];
    if (steps.length === 0) return;

    let cancelled = false;
    let driverObj: { destroy: () => void } | null = null;

    // rAF garante que a aba recem-trocada ja pintou antes de medir posicoes.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const present = steps.filter((s) => document.querySelector(s.element));
      if (present.length === 0) return;

      void import('driver.js').then(({ driver }) => {
        if (cancelled) return;
        const d = driver({
          showProgress: true,
          progressText: '{{current}} de {{total}}',
          allowClose: true,
          overlayColor: resolveOverlayColor(),
          overlayOpacity: 0.7,
          stagePadding: 6,
          stageRadius: 6,
          popoverClass: 'arcana-tour',
          nextBtnText: 'Próximo',
          prevBtnText: 'Voltar',
          doneBtnText: 'Entendi',
          steps: present.map((s) => ({
            element: s.element,
            popover: {
              title: s.title,
              description: s.description,
              side: s.side,
              align: s.align,
            },
          })),
          // "x" explicito = encerra a sessao de onboarding (nao volta nas
          // proximas abas). Demais formas de fechar (ESC/concluir) so encerram
          // o tour da aba atual — o da proxima aba ainda aparece ao avancar.
          onCloseClick: () => {
            setActive(false);
            markTourSeen();
            d.destroy();
          },
          onDestroyed: () => {
            markTourSeen();
          },
        });
        driverObj = d;
        d.drive();
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      driverObj?.destroy();
    };
  }, [active, currentStepId, runNonce]);

  return { startTour, isActive: active };
}

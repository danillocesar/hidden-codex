'use client';

import { useMemo, useReducer, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { StepProgress } from '@/components/character/wizard/StepProgress';
import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import { createCharacter } from '@/server/actions/characters/create';
import type { CreateCharacterInput } from '@/schemas/character/create';
import { useFormErrors } from '@/lib/forms/useFormErrors';
import { Alert } from '@/components/ui/alert';
import { TOTAL_STEPS, initialWizardState, wizardReducer } from './wizardState';
import { validateStep } from './wizardValidation';
import { buildDevFixture } from './devFixture';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Attributes } from './steps/Step2Attributes';
import { Step3Pericias } from './steps/Step3Pericias';
import { Step4Aptitudes } from './steps/Step4Aptitudes';
import { Step5Powers } from './steps/Step5Powers';
import { Step6Effects } from './steps/Step6Effects';
import { StepInventory } from './steps/StepInventory';
import { Step7Summary } from './steps/Step7Summary';

/**
 * Steps do wizard. `kanji` e semantico do tema:
 *   名 mei — identidade · 性 sei — natureza/atributos · 技 waza — pericias
 *   才 sai — talento (aptidao) · 力 chikara — poder · 術 jutsu — efeito ·
 *   検 ken — examinar (revisar)
 *
 * Ordem: Aptidoes ANTES de Poderes/Efeitos pra que pre-reqs de efeitos que
 * exijam aptidoes (ex: Veneno Toxico requer Quimico) sejam validados.
 */
const STEPS = [
  { id: 'identity', label: 'Identidade', kanji: '名' },
  { id: 'attributes', label: 'Atributos', kanji: '性' },
  { id: 'pericias', label: 'Pericias', kanji: '技' },
  { id: 'aptitudes', label: 'Aptidoes', kanji: '才' },
  { id: 'powers', label: 'Poderes', kanji: '力' },
  { id: 'effects', label: 'Efeitos', kanji: '術' },
  { id: 'inventory', label: 'Inventario', kanji: '道具' },
  { id: 'summary', label: 'Revisar', kanji: '検' },
] as const;

if (STEPS.length !== TOTAL_STEPS) {
  throw new Error('STEPS desalinhado com TOTAL_STEPS');
}

/**
 * Orquestra o wizard. State central via useReducer; validacao por step em
 * `wizardValidation.ts`. UX de erro segue padrao generico (touched on blur +
 * reveal on submit attempt) via `useFormErrors`.
 */
export function WizardClient({ catalogs }: { catalogs: WizardCatalogs }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(wizardReducer, undefined, initialWizardState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formErrors = useFormErrors();

  const stepDef = STEPS[state.step]!;

  const currentValidation = useMemo(
    () => validateStep(state.step, state, catalogs),
    [state, catalogs],
  );

  const visibleFieldErrors = useMemo(
    () => formErrors.visible(currentValidation.issues),
    [formErrors, currentValidation.issues],
  );

  const goToStep = (target: number) => {
    setSubmitError(null);
    dispatch({ type: 'goto', step: target });
  };

  // Steps Aptidoes (3), Poderes (4) e Efeitos (5) compartilham contexto —
  // budget de pontos eh dividido entre Aptidoes+Poderes; Efeitos depende dos
  // poderes. User pode ir e voltar entre eles mesmo invalido pra rebalancear.
  const isReachable = (target: number) => {
    if (target <= state.step) return true;
    const sharedRange = new Set([3, 4, 5]);
    if (sharedRange.has(state.step) && sharedRange.has(target)) return true;
    return currentValidation.isValid;
  };

  const handleNext = () => {
    setSubmitError(null);
    formErrors.reset();
    dispatch({ type: 'next' });
  };

  const onSubmit = () => {
    setSubmitError(null);
    for (let i = 0; i < TOTAL_STEPS - 1; i++) {
      const v = validateStep(i, state, catalogs);
      if (!v.isValid) {
        formErrors.revealAll();
        setSubmitError(
          `Passo ${i + 1} (${STEPS[i]!.label}) tem pendencias. Volte e corrija antes de criar.`,
        );
        return;
      }
    }
    const { step: _step, ...payload } = state;
    void _step;
    startTransition(async () => {
      const result = await createCharacter(payload satisfies CreateCharacterInput);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push(`/characters/${result.characterId}`);
    });
  };

  const isLastStep = state.step === TOTAL_STEPS - 1;

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="space-y-8">
      {isDev ? (
        <div className="flex items-center justify-end gap-2 rounded border border-dashed border-warning/40 bg-warning/5 px-3 py-2">
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-warning">
            Modo dev
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'loadState', state: buildDevFixture(catalogs) })}
            title="Preenche todos os steps com fixture Satsuki NC 6"
          >
            Preencher tudo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'loadState', state: initialWizardState() })}
            title="Reset pro estado inicial vazio"
          >
            Limpar
          </Button>
        </div>
      ) : null}

      <StepProgress
        steps={STEPS}
        currentIndex={state.step}
        canAdvance={currentValidation.isValid}
        isReachable={isReachable}
        onStepClick={goToStep}
      />

      <Section>
        <div className="mb-6">
          <Eyebrow tone="deep" size="sm" as="p" className="tracking-[0.4em]">
            Passo {state.step + 1} de {TOTAL_STEPS}
          </Eyebrow>
          <Heading level={2} className="mt-1">
            {stepDef.label}
          </Heading>
        </div>

        {state.step === 0 && (
          <Step1Identity
            state={state}
            dispatch={dispatch}
            catalogs={catalogs}
            errors={visibleFieldErrors}
            onBlurField={formErrors.markTouched}
          />
        )}
        {state.step === 1 && <Step2Attributes state={state} dispatch={dispatch} />}
        {state.step === 2 && (
          <Step3Pericias state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {state.step === 3 && (
          <Step4Aptitudes state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {state.step === 4 && <Step5Powers state={state} dispatch={dispatch} catalogs={catalogs} />}
        {state.step === 5 && <Step6Effects state={state} dispatch={dispatch} catalogs={catalogs} />}
        {state.step === 6 && (
          <StepInventory state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {state.step === 7 && <Step7Summary state={state} catalogs={catalogs} />}
      </Section>

      {submitError ? <Alert tone="danger">{submitError}</Alert> : null}

      <nav className="flex items-center justify-between">
        {state.step > 0 ? (
          <Button variant="outline" disabled={isPending} onClick={() => dispatch({ type: 'prev' })}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 4L6 8l4 4" />
            </svg>
            Voltar
          </Button>
        ) : (
          // Placeholder pra manter o "Proximo" alinhado a direita.
          <span aria-hidden />
        )}
        {isLastStep ? (
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? 'Criando…' : 'Criar personagem'}
          </Button>
        ) : (
          <Button
            disabled={!isReachable(state.step + 1) || isPending}
            onClick={handleNext}
            title={
              !currentValidation.isValid
                ? currentValidation.issues.map((i) => `• ${i.message}`).join('\n')
                : undefined
            }
          >
            {state.step === TOTAL_STEPS - 2 ? 'Revisar' : 'Proximo'}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
            </svg>
          </Button>
        )}
      </nav>
    </div>
  );
}

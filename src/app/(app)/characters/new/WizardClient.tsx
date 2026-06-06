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
import { updateCharacter } from '@/server/actions/characters/update';
import type { CreateCharacterInput } from '@/schemas/character/create';
import { useFormErrors } from '@/lib/forms/useFormErrors';
import { Alert } from '@/components/ui/alert';
import { ATTRIBUTE_KEYS } from '@/domain/types';
import { getLevelUpDelta } from '@/domain/rules/leveling';
import { LevelUpBanner } from '@/components/character/wizard/LevelUpBanner';
import { TOTAL_STEPS, initialWizardState, wizardReducer, type WizardState } from './wizardState';
import { validateStepById, type WizardStepId } from './wizardValidation';
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
const STEPS_CREATE = [
  { id: 'identity', label: 'Identidade', kanji: '名' },
  { id: 'attributes', label: 'Atributos', kanji: '性' },
  { id: 'pericias', label: 'Pericias', kanji: '技' },
  { id: 'aptitudes', label: 'Aptidoes', kanji: '才' },
  { id: 'powers', label: 'Poderes', kanji: '力' },
  { id: 'effects', label: 'Efeitos', kanji: '術' },
  { id: 'inventory', label: 'Inventario', kanji: '道具' },
  { id: 'summary', label: 'Revisar', kanji: '検' },
] as const;

// Modo edicao reaproveita o wizard mas omite o step de Inventario — o inventario
// e gerido ao vivo na ficha (com compartimentos e itens custom que o schema do
// wizard nao modela). Os steps de build (indices 0-5) ficam iguais nos dois
// modos, entao `validateStep` (indexado) continua valido sem ajuste.
const STEPS_EDIT = STEPS_CREATE.filter((s) => s.id !== 'inventory');

// Modo level-up: foco no que o nivel novo concede. Sem Identidade (NC e fixo em
// atual+1) nem Inventario. Atributos primeiro (mininos forcados), depois pericias/
// aptidoes/poderes/efeitos opcionais (pontos podem ficar guardados).
const STEPS_LEVELUP = STEPS_CREATE.filter(
  (s) => s.id !== 'identity' && s.id !== 'inventory',
);

if (STEPS_CREATE.length !== TOTAL_STEPS) {
  throw new Error('STEPS desalinhado com TOTAL_STEPS');
}

type WizardMode = 'create' | 'edit' | 'levelup';

export type WizardClientProps = {
  catalogs: WizardCatalogs;
  mode?: WizardMode;
  /** Obrigatorio em `mode='edit'|'levelup'` — alvo do `updateCharacter`. */
  characterId?: string;
  /** Estado pre-preenchido (edit/level-up). Quando ausente, comeca vazio. */
  initialState?: WizardState;
  /** NC de origem no level-up (o estado ja vem com campaignLevel = origem + 1). */
  levelUpFromNc?: number;
};

/**
 * Orquestra o wizard. State central via useReducer; validacao por step em
 * `wizardValidation.ts`. UX de erro segue padrao generico (touched on blur +
 * reveal on submit attempt) via `useFormErrors`.
 */
export function WizardClient({
  catalogs,
  mode = 'create',
  characterId,
  initialState,
  levelUpFromNc,
}: WizardClientProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    wizardReducer,
    initialState,
    (init) => init ?? initialWizardState(),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formErrors = useFormErrors();

  const isEdit = mode === 'edit';
  const isLevelup = mode === 'levelup';
  // Criacao obriga gastar tudo; edit e level-up permitem guardar saldo.
  const allowBanking = mode !== 'create';
  // Edit e level-up persistem via updateCharacter (mantem estado de jogo).
  const saveViaUpdate = mode !== 'create';

  const STEPS = isLevelup ? STEPS_LEVELUP : isEdit ? STEPS_EDIT : STEPS_CREATE;
  const totalSteps = STEPS.length;

  // Baseline do level-up: atributos no inicio (piso de nao-decremento) e soma
  // pra mostrar "pontos deste nivel". `initialState` e estavel (vem do server).
  const baselineAttributes = isLevelup ? initialState?.attributes : undefined;
  const baselineAttrSum = baselineAttributes
    ? ATTRIBUTE_KEYS.reduce((acc, k) => acc + baselineAttributes[k], 0)
    : 0;
  const attrPointsGained =
    isLevelup && levelUpFromNc !== undefined
      ? getLevelUpDelta(levelUpFromNc, state.identity.campaignLevel).attrPointsGained
      : 0;

  const stepDef = STEPS[Math.min(state.step, totalSteps - 1)]!;

  const currentValidation = useMemo(
    () => validateStepById(stepDef.id, state, catalogs, allowBanking),
    [stepDef.id, state, catalogs, allowBanking],
  );

  const visibleFieldErrors = useMemo(
    () => formErrors.visible(currentValidation.issues),
    [formErrors, currentValidation.issues],
  );

  const goToStep = (target: number) => {
    setSubmitError(null);
    dispatch({ type: 'goto', step: target });
  };

  // Steps Aptidoes/Poderes/Efeitos compartilham contexto — budget de pontos eh
  // dividido entre Aptidoes+Poderes; Efeitos depende dos poderes. User pode ir e
  // voltar entre eles mesmo invalido pra rebalancear. Por `id` (a ordem/indice
  // muda entre os modos).
  const SHARED_IDS: ReadonlySet<WizardStepId> = new Set(['aptitudes', 'powers', 'effects']);
  const isReachable = (target: number) => {
    if (target <= state.step) return true;
    const curId = STEPS[state.step]?.id;
    const tgtId = STEPS[target]?.id;
    if (curId && tgtId && SHARED_IDS.has(curId) && SHARED_IDS.has(tgtId)) return true;
    return currentValidation.isValid;
  };

  const handleNext = () => {
    setSubmitError(null);
    formErrors.reset();
    dispatch({ type: 'next' });
  };

  const verb = isLevelup ? 'concluir' : isEdit ? 'salvar' : 'criar';

  const onSubmit = () => {
    setSubmitError(null);
    for (let i = 0; i < totalSteps - 1; i++) {
      const def = STEPS[i]!;
      const v = validateStepById(def.id, state, catalogs, allowBanking);
      if (!v.isValid) {
        formErrors.revealAll();
        setSubmitError(
          `Passo ${i + 1} (${def.label}) tem pendencias. Volte e corrija antes de ${verb}.`,
        );
        return;
      }
    }
    const { step: _step, ...payload } = state;
    void _step;
    startTransition(async () => {
      const result = saveViaUpdate
        ? await updateCharacter(characterId!, payload satisfies CreateCharacterInput)
        : await createCharacter(payload satisfies CreateCharacterInput);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push(`/characters/${result.characterId}`);
    });
  };

  const isLastStep = state.step === totalSteps - 1;

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="space-y-8">
      {isLevelup && levelUpFromNc !== undefined ? (
        <LevelUpBanner fromNc={levelUpFromNc} toNc={state.identity.campaignLevel} />
      ) : null}

      {isDev && mode === 'create' ? (
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
            Passo {state.step + 1} de {totalSteps}
          </Eyebrow>
          <Heading level={2} className="mt-1">
            {stepDef.label}
          </Heading>
        </div>

        {stepDef.id === 'identity' && (
          <Step1Identity
            state={state}
            dispatch={dispatch}
            catalogs={catalogs}
            errors={visibleFieldErrors}
            onBlurField={formErrors.markTouched}
          />
        )}
        {stepDef.id === 'attributes' && (
          <Step2Attributes
            state={state}
            dispatch={dispatch}
            hideBases={isLevelup}
            attributeFloors={baselineAttributes}
            levelUp={
              isLevelup
                ? { baselineSum: baselineAttrSum, pointsGained: attrPointsGained }
                : undefined
            }
          />
        )}
        {stepDef.id === 'pericias' && (
          <Step3Pericias state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {stepDef.id === 'aptitudes' && (
          <Step4Aptitudes state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {stepDef.id === 'powers' && (
          <Step5Powers state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {stepDef.id === 'effects' && (
          <Step6Effects state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {stepDef.id === 'inventory' && (
          <StepInventory state={state} dispatch={dispatch} catalogs={catalogs} />
        )}
        {stepDef.id === 'summary' && <Step7Summary state={state} catalogs={catalogs} />}
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
            {isLevelup
              ? isPending
                ? 'Salvando…'
                : 'Concluir level up'
              : isEdit
                ? isPending
                  ? 'Salvando…'
                  : 'Salvar alterações'
                : isPending
                  ? 'Criando…'
                  : 'Criar personagem'}
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
            {state.step === totalSteps - 2 ? 'Revisar' : 'Proximo'}
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

import type { CreateCharacterInput } from '@/schemas/character/create';
import type { ATTRIBUTE_KEYS } from '@/domain/types';
import { getStartingRyos } from '@/domain/rules/money';

/**
 * Estado interno do wizard de criacao (P0.2). Espelha 1:1 a forma do
 * `CreateCharacterInput` mais um `step` que controla a navegacao. Reducer
 * mantem este state mutavel via actions discriminadas — sem RHF, sem context.
 */
export type WizardState = CreateCharacterInput & { step: number };

export type WizardAction =
  | { type: 'goto'; step: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'loadState'; state: WizardState }
  | { type: 'patchIdentity'; patch: Partial<CreateCharacterInput['identity']> }
  | { type: 'setAttribute'; key: (typeof ATTRIBUTE_KEYS)[number]; value: number }
  | { type: 'setAttributes'; attributes: CreateCharacterInput['attributes'] }
  | { type: 'setBase'; key: keyof CreateCharacterInput['bases']; value: number }
  | { type: 'setPericia'; code: string; points: number }
  | { type: 'setPowers'; powers: CreateCharacterInput['powers'] }
  | { type: 'setEffectsForPower'; powerCode: string; effectCodes: ReadonlyArray<string> }
  | { type: 'setAptitudes'; aptitudes: CreateCharacterInput['aptitudes'] }
  | { type: 'setInventory'; inventory: CreateCharacterInput['inventory'] }
  | { type: 'setRyos'; ryos: number };

// 1 Identity · 2 Attr · 3 Pericias · 4 Aptidoes · 5 Poderes · 6 Efeitos ·
// 7 Inventario · 8 Summary
export const TOTAL_STEPS = 8;

export function initialWizardState(): WizardState {
  return {
    step: 0,
    identity: {
      name: '',
      age: null,
      gender: null,
      campaignLevel: 4,
      villageCode: null,
      customVillageName: null,
      clanCode: null,
      customClanName: null,
      kekkeiGenkaiCode: null,
      portraitUrl: null,
    },
    attributes: { for: 0, des: 0, agi: 0, per: 0, int: 0, vig: 0, esp: 0 },
    bases: { cc: 3, cd: 3, esq: 3, lm: 3 },
    pericias: {},
    powers: [],
    effectsByPower: {},
    aptitudes: [],
    inventory: [],
    // Sugestao inicial = dinheiro do posto Genin (NC 4). O step de Inventario
    // reajusta a sugestao conforme o NC escolhido; o jogador pode sobrescrever.
    ryos: getStartingRyos(4),
  };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'goto':
      return { ...state, step: Math.min(TOTAL_STEPS - 1, Math.max(0, action.step)) };
    case 'next':
      return { ...state, step: Math.min(TOTAL_STEPS - 1, state.step + 1) };
    case 'prev':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'loadState':
      return action.state;
    case 'patchIdentity':
      return { ...state, identity: { ...state.identity, ...action.patch } };
    case 'setAttribute':
      return {
        ...state,
        attributes: { ...state.attributes, [action.key]: action.value },
      };
    case 'setAttributes':
      return { ...state, attributes: action.attributes };
    case 'setBase':
      return { ...state, bases: { ...state.bases, [action.key]: action.value } };
    case 'setPericia': {
      const next = { ...state.pericias };
      if (action.points <= 0) {
        delete next[action.code];
      } else {
        next[action.code] = action.points;
      }
      return { ...state, pericias: next };
    }
    case 'setPowers': {
      // Quando o jogador remove um poder ou abaixa o nivel, limpamos
      // efeitos orfaos (selecionados > novo nivel) pra nao manter slots
      // invalidos no state.
      const next: typeof state.effectsByPower = {};
      const newPowerByCode = new Map(action.powers.map((p) => [p.code, p]));
      for (const [code, codes] of Object.entries(state.effectsByPower)) {
        const power = newPowerByCode.get(code);
        if (!power) continue; // poder removido → some
        next[code] = codes.slice(0, power.level);
      }
      return { ...state, powers: action.powers, effectsByPower: next };
    }
    case 'setEffectsForPower': {
      const next = { ...state.effectsByPower };
      if (action.effectCodes.length === 0) {
        delete next[action.powerCode];
      } else {
        next[action.powerCode] = [...action.effectCodes];
      }
      return { ...state, effectsByPower: next };
    }
    case 'setAptitudes':
      return { ...state, aptitudes: action.aptitudes };
    case 'setInventory':
      return { ...state, inventory: action.inventory };
    case 'setRyos':
      return { ...state, ryos: Math.max(0, Math.floor(action.ryos)) };
    default:
      return state;
  }
}

import type { WizardCatalogs } from '@/server/queries/wizardCatalogs';
import { initialWizardState, type WizardState } from './wizardState';

/**
 * Modo dev: gera um `WizardState` 100% preenchido baseado no catalogo
 * carregado, pra acelerar testes manuais do wizard. Escolhe codes que
 * existem efetivamente no banco (Hyouton/Fuuton/Suiton se disponiveis) e
 * cai pra fallbacks genericos quando nao.
 *
 * Personagem-base: Satsuki Yuki NC 6 (Yuki/Hyouton).
 *
 * NAO usar em producao — funcao chamada apenas pelo botao "Dev: preencher"
 * que so renderiza quando `process.env.NODE_ENV !== 'production'`.
 */
export function buildDevFixture(catalogs: WizardCatalogs): WizardState {
  const base = initialWizardState();
  const nc = 6;

  // ── Identidade ────────────────────────────────────────────────────────
  const yuki = catalogs.clans.find((c) => c.code === 'yuki') ?? null;
  const kiri = catalogs.villages.find((v) => v.code === 'kiri') ?? null;
  const hyoutonKg = catalogs.kekkeiGenkais.find((k) => k.code === 'hyouton') ?? null;

  // ── Powers (Hyouton 3 → Fuuton+Suiton vem grátis automaticamente) ─────
  // Hyouton dá +1 Fuuton + +1 Suiton via origem. Setamos os 3 com nivel
  // total ja incluindo grátis — eh assim que o state representa.
  const hyouton = catalogs.powers.find((p) => p.code === 'hyouton');
  const fuuton = catalogs.powers.find((p) => p.code === 'fuuton');
  const suiton = catalogs.powers.find((p) => p.code === 'suiton');
  const powers: WizardState['powers'] = [];
  if (hyouton) powers.push({ code: 'hyouton', level: 3 });
  if (fuuton) powers.push({ code: 'fuuton', level: 1 });
  if (suiton) powers.push({ code: 'suiton', level: 1 });

  // ── Efeitos: N primeiros disponiveis por poder ────────────────────────
  const effectsByPower: WizardState['effectsByPower'] = {};
  for (const p of powers) {
    const available = catalogs.powerEffects
      .filter((e) => e.availableFor.includes(p.code) && e.minLevel <= p.level)
      .slice(0, p.level)
      .map((e) => e.code);
    if (available.length === p.level) {
      effectsByPower[p.code] = available;
    }
    // Se nao ha efeitos suficientes pro nivel, deixa vazio (user resolve)
  }

  // ── Aptidoes: 3 primeiras com costPoints=2 sem prereqs estranhos ──────
  // Picks "seguros" pra fixture: acuidade, ataque_poderoso, velocista.
  // Se nao acharmos esses, pega as primeiras 3 do catalog.
  const preferredAptitudes = ['acuidade', 'ataque_poderoso', 'velocista'];
  const aptitudes: WizardState['aptitudes'] = [];
  for (const code of preferredAptitudes) {
    if (catalogs.aptitudes.some((a) => a.code === code)) {
      aptitudes.push({ code, parameter: null });
    }
  }
  if (aptitudes.length === 0) {
    for (const a of catalogs.aptitudes.slice(0, 3)) {
      aptitudes.push({ code: a.code, parameter: null });
    }
  }

  // ── Pericias: gasta budget NC 6 (12 pontos) em pericias chave ─────────
  // Distribuicao Satsuki: acrobacia 3, atletismo 2, furtividade 3,
  // prestidigitacao 3, procurar 1 = 12. Codes confirmados no catalog do livro.
  const periciaCodes = ['acrobacia', 'atletismo', 'furtividade', 'prestidigitacao', 'procurar'];
  const periciaDist: Record<string, number> = {
    acrobacia: 3,
    atletismo: 2,
    furtividade: 3,
    prestidigitacao: 3,
    procurar: 1,
  };
  const pericias: WizardState['pericias'] = {};
  for (const code of periciaCodes) {
    if (catalogs.pericias.some((p) => p.code === code)) {
      pericias[code] = periciaDist[code]!;
    }
  }

  // ── Inventario: 2 primeiras armas do catalogo (1a equipada) p/ demonstrar
  //    o card "Combate Rapido" da ficha. Codes garantidamente reais.
  const weapons = catalogs.equipment.filter((e) => e.kind === 'WEAPON').slice(0, 2);
  const inventory: WizardState['inventory'] = weapons.map((w, i) => ({
    equipmentCode: w.code,
    quantity: 1,
    equipped: i === 0,
  }));

  return {
    ...base,
    step: 0,
    identity: {
      name: 'Satsuki Yuki (DEV)',
      age: 14,
      gender: 'feminino',
      campaignLevel: nc,
      villageCode: kiri?.code ?? null,
      customVillageName: kiri ? null : 'Kiri (custom)',
      clanCode: yuki?.code ?? null,
      customClanName: yuki ? null : null,
      kekkeiGenkaiCode: hyoutonKg?.code ?? null,
      portraitUrl: null,
    },
    // For 1, Des 6, Agi 6, Per 2, Int 1, Vig 5, Esp 3 = 24 (budget NC 6)
    attributes: { for: 1, des: 6, agi: 6, per: 2, int: 1, vig: 5, esp: 3 },
    bases: { cc: 5, cd: 3, esq: 3, lm: 1 }, // remanejou 2 pts pra CC
    pericias,
    powers,
    effectsByPower,
    aptitudes,
    inventory,
    ryos: 850, // valor custom pra exercitar o campo de Ryos no step
  };
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { loadCharacterById } from '@/server/queries/characterById';
import { FichaHeader } from '@/components/character/ficha/FichaHeader';
import { HeroSection } from '@/components/character/ficha/HeroSection';
import { AttributesGrid } from '@/components/character/ficha/AttributesGrid';
import {
  EnergyPanel,
  CombatSkillsPanel,
  SocialPanel,
  type CombatStat,
} from '@/components/character/ficha/MechanicsPanel';
import { QuickCombatPanel } from '@/components/character/ficha/QuickCombatPanel';
import { EnergyAdjuster } from '@/components/character/ficha/EnergyAdjuster';
import { JutsusSection } from '@/components/character/ficha/JutsusSection';
import { InventoryPanel } from '@/components/character/ficha/InventoryPanel';
import { FichaBackground } from '@/components/character/ficha/FichaBackground';
import { FichaBackgroundButton } from '@/components/character/ficha/FichaBackgroundButton';
import { SectionDivider } from '@/components/character/ficha/SectionDivider';
import {
  TrainingPanel,
  type FichaAptitude,
  type FichaPericia,
  type FichaPower,
} from '@/components/character/ficha/TrainingPanel';
import { Button } from '@/components/ui/button';
import { PERICIAS, isPrimaryAttribute } from '@/domain/catalog/pericias';
import {
  calculateCC,
  calculateCD,
  calculateESQ,
  calculateLM,
  calculateMaxChakra,
  calculateMaxVitality,
} from '@/domain/rules/derivedStats';
import {
  calculatePericiaLevelByCode,
  calculateSocialPericiaLevel,
  sumPericiaPoints,
} from '@/domain/rules/skills';
import { getPericaBudget } from '@/domain/rules/pointsBudget';

/**
 * Ficha read-only — `/characters/[id]`.
 *
 * Server Component. Faz auth + ownership check + fetch + mapeia pra view
 * model. Renderiza progressivamente os componentes da ficha (Header, Hero,
 * Attributes hoje; resto entra nos proximos dias).
 *
 * Personagens publicos (`isPublicOnProfile`) sao acessiveis sem ser dono.
 * 404 quando nao encontrado OU sem permissao (nao vaza existencia).
 */
export default async function CharacterFichaPage({ params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  const result = await loadCharacterById(params.id, session?.user.id ?? null);

  if (!result.ok) notFound();

  const { core, display, lookup } = result.viewModel;
  const aptitudeCodes = core.aptitudes.flatMap((a) =>
    a.parameter ? [a.code, `${a.code}_${a.parameter}`] : [a.code],
  );
  const combatInput = {
    attributes: core.attributes,
    bases: core.bases,
    aptitudeCodes,
  };
  const combatStats: CombatStat[] = [
    {
      code: 'cc',
      value: calculateCC(combatInput),
      base: core.bases.cc,
      attributeLabel:
        aptitudeCodes.includes('acuidade') || aptitudeCodes.includes('acuidade_homebrew')
          ? `Des ${core.attributes.des}`
          : `For ${core.attributes.for}`,
    },
    {
      code: 'cd',
      value: calculateCD(combatInput),
      base: core.bases.cd,
      attributeLabel: `Des ${core.attributes.des}`,
    },
    {
      code: 'esq',
      value: calculateESQ(combatInput),
      base: core.bases.esq,
      attributeLabel: `Agi ${core.attributes.agi}`,
    },
    {
      code: 'lm',
      value: calculateLM(combatInput),
      base: core.bases.lm,
      attributeLabel: `Per ${core.attributes.per}`,
    },
  ];
  const maxVitality = calculateMaxVitality(core.attributes.vig, core.campaignLevel);
  const maxChakra = calculateMaxChakra(core.attributes.esp);
  // Todas as pericias aparecem: as nao-treinadas tem base do atributo mesmo com
  // 0 pontos (igual a referencia). Treinadas sem pontos ficam "sem treino" (sem
  // base usavel) e sao ocultadas. Ordenadas por nivel desc.
  const pericias: FichaPericia[] = PERICIAS.flatMap<FichaPericia>((def) => {
    const points = core.pericias[def.code] ?? 0;
    if (def.trained && points === 0) return [];
    let level: number | null;
    try {
      level = isPrimaryAttribute(def.attribute)
        ? calculatePericiaLevelByCode(def.code, core.attributes, points)
        : calculateSocialPericiaLevel(def.code, core.attributes, {
            carisma: core.socialCarisma,
            manipulacao: core.socialManipulacao,
          });
    } catch {
      level = null;
    }
    return [{ code: def.code, name: def.name, points, level }];
  }).sort((a, b) => (b.level ?? -1) - (a.level ?? -1));
  const periciasCountLabel = `${sumPericiaPoints(core.pericias)}/${getPericaBudget(core.campaignLevel)}`;
  const aptitudes: FichaAptitude[] = core.aptitudes.map((item) => {
    const def = lookup.aptitudeByCode.get(item.code);
    return {
      code: item.code,
      name: def?.name ?? humanizeCode(item.code),
      category: def?.category ?? 'APTIDAO',
      parameter: item.parameter,
      isFree: item.isFreeFromOrigin,
    };
  });
  const powers: FichaPower[] = core.powers.map((item) => {
    const def = lookup.powerByCode.get(item.code);
    return {
      code: item.code,
      name: def?.name ?? humanizeCode(item.code),
      translation: def?.translation ?? null,
      category: def?.category ?? 'PODER',
      level: item.level,
      freeLevel: display.freePowerLevels[item.code] ?? 0,
      effects: (display.effectsByPowerCode[item.code] ?? []).map((e) => e.name),
    };
  });
  // Poderes com efeitos aprendidos — base pra criar jutsus (poder + efeito + níveis).
  const jutsuPowerOptions = core.powers
    .map((p) => ({
      code: p.code,
      name: lookup.powerByCode.get(p.code)?.name ?? humanizeCode(p.code),
      level: p.level,
      effects: display.effectsByPowerCode[p.code] ?? [],
    }))
    .filter((p) => p.effects.length > 0);

  return (
    <article className="relative mx-auto max-w-[1340px]">
      <FichaBackground url={display.fichaBackground} />
      <div className="relative z-10">
        <FichaHeader
          clanName={display.clanName}
          villageName={display.villageName}
          clanKanji={undefined}
          villageKanji={undefined}
        />

        <HeroSection
          characterId={display.id}
          canEdit={display.isOwner}
          name={display.name}
          subtitle={null}
          overline={
            display.kekkeiGenkaiName
              ? `Kekkei Genkai · ${display.kekkeiGenkaiName}`
              : display.clanName
                ? `Cla · ${display.clanName}`
                : null
          }
          age={display.age}
          rank={display.rank}
          campaignLevel={core.campaignLevel}
          tendency={display.tendency}
          imageUrl={display.portraitUrl}
          lowerContent={
            <div className="flex flex-col gap-[18px]">
              <AttributesGrid attributes={core.attributes} />
              <div className="grid gap-[18px] lg:grid-cols-[1.1fr_1.5fr_1fr]">
                {display.isOwner ? (
                  <EnergyAdjuster
                    characterId={display.id}
                    vitality={{ current: core.currentVitality, max: maxVitality }}
                    chakra={{ current: core.currentChakra, max: maxChakra }}
                  />
                ) : (
                  <EnergyPanel
                    vitality={{ current: core.currentVitality, max: maxVitality }}
                    chakra={{ current: core.currentChakra, max: maxChakra }}
                  />
                )}
                <CombatSkillsPanel combatStats={combatStats} />
                <SocialPanel
                  social={{ carisma: core.socialCarisma, manipulacao: core.socialManipulacao }}
                />
              </div>
              <QuickCombatPanel
                weapons={display.equippedWeapons}
                jutsus={display.jutsus}
                cc={combatStats.find((s) => s.code === 'cc')?.value ?? 0}
                cd={combatStats.find((s) => s.code === 'cd')?.value ?? 0}
                lm={combatStats.find((s) => s.code === 'lm')?.value ?? 0}
                characterId={display.id}
                isOwner={display.isOwner}
                attributes={{
                  for: core.attributes.for,
                  des: core.attributes.des,
                  esp: core.attributes.esp,
                }}
                currentChakra={core.currentChakra}
                abilities={{
                  ataquePoderoso: core.aptitudes.some((a) => a.code === 'ataque_poderoso'),
                  ataqueMultiplo: core.aptitudes.some((a) => a.code === 'ataque_multiplo'),
                  acuidadeHomebrew: core.aptitudes.some((a) => a.code === 'acuidade_homebrew'),
                }}
              />
            </div>
          }
          placeholderKanji={display.clanCode === 'yuki' ? '雪' : undefined}
        />

        <SectionDivider
          number="01"
          title="Talentos e Perícias"
          kanji="才能 · 技能"
          imageUrl={display.sectionCovers.talentos}
          position={display.sectionCoverPositions.talentos}
          zoom={display.sectionCoverZooms.talentos}
          coverKey="talentos"
          characterId={display.id}
          canEdit={display.isOwner}
          images={display.images}
        />

        <TrainingPanel
          pericias={pericias}
          periciasCountLabel={periciasCountLabel}
          aptitudes={aptitudes}
          powers={powers}
        />

        <SectionDivider
          number="02"
          title="Técnicas"
          kanji="術"
          imageUrl={display.sectionCovers.tecnicas}
          position={display.sectionCoverPositions.tecnicas}
          zoom={display.sectionCoverZooms.tecnicas}
          coverKey="tecnicas"
          characterId={display.id}
          canEdit={display.isOwner}
          images={display.images}
        />

        <section className="px-6 py-12 md:px-12">
          <JutsusSection
            characterId={display.id}
            jutsus={display.jutsus}
            powers={jutsuPowerOptions}
            images={display.images}
            acertoValues={{
              cc: combatStats.find((s) => s.code === 'cc')?.value ?? 0,
              cd: combatStats.find((s) => s.code === 'cd')?.value ?? 0,
              lm: combatStats.find((s) => s.code === 'lm')?.value ?? 0,
            }}
            canEdit={display.isOwner}
          />
        </section>

        <SectionDivider
          number="03"
          title="Arquivo"
          kanji="道具 · 記"
          imageUrl={display.sectionCovers.arquivo}
          position={display.sectionCoverPositions.arquivo}
          zoom={display.sectionCoverZooms.arquivo}
          coverKey="arquivo"
          characterId={display.id}
          canEdit={display.isOwner}
          images={display.images}
        />

        <section className="px-6 py-12 md:px-12">
          <InventoryPanel items={display.inventory} canEdit={display.isOwner} />
        </section>

        {display.isOwner ? (
          <nav className="sticky bottom-4 mx-auto mt-8 flex w-fit items-center gap-3 rounded-full border border-border bg-bg-card/95 px-4 py-2 backdrop-blur">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Voltar</Link>
            </Button>
            <FichaBackgroundButton
              characterId={display.id}
              current={display.fichaBackground}
              images={display.images}
            />
            <Button asChild size="sm" disabled title="Editor entra em P0.4.">
              <span>Editar (em breve)</span>
            </Button>
          </nav>
        ) : null}
      </div>
    </article>
  );
}

function humanizeCode(code: string): string {
  return code
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

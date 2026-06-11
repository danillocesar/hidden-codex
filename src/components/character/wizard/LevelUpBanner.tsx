import { getLevelUpDelta } from '@/domain/rules/leveling';
import { SHINOBI_RANK_LABELS as RANK_LABELS } from '@/domain/catalog/ranks';
import { Section } from '@/components/ui/section';
import { Heading } from '@/components/ui/heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Cluster, Stack } from '@/components/ui/stack';

/**
 * Cabecalho do wizard de level-up: resume o que o NC novo concede (deltas de
 * pontos, vitalidade, posto) e orienta o jogador. Pontos sociais e posto sao
 * informativos por enquanto (ainda nao editaveis na ficha).
 */
export function LevelUpBanner({ fromNc, toNc }: { fromNc: number; toNc: number }) {
  const delta = getLevelUpDelta(fromNc, toNc);

  return (
    <Section tone="accent">
      <Stack gap="sm">
        <div>
          <Eyebrow tone="deep" size="sm">
            Subindo de nível
          </Eyebrow>
          <Heading level={2} italic accent className="mt-1">
            NC {fromNc} → NC {toNc}
          </Heading>
        </div>

        <Cluster gap="sm" align="center">
          <Badge tone="info">+{delta.attrPointsGained} atributos</Badge>
          <Badge tone="info">+{delta.pericaPointsGained} perícias</Badge>
          <Badge tone="info">+{delta.powerPointsGained} poder</Badge>
          <Badge tone="neutral">+5 vitalidade máx.</Badge>
          {delta.rankChanged ? (
            <Badge tone="success">Novo posto: {RANK_LABELS[delta.newRank]}</Badge>
          ) : null}
          {delta.socialBonus > 0 ? (
            <Badge tone="warning">+{delta.socialBonus} sociais (Car/Man)</Badge>
          ) : null}
        </Cluster>

        <Text variant="muted">
          Distribua os pontos de atributo respeitando o novo mínimo — atributos não podem
          diminuir. Perícias, aptidões e poderes são opcionais: pontos não gastos ficam
          guardados para depois.
          {delta.socialBonus > 0
            ? ' Os pontos sociais e o novo posto ainda são ajustados manualmente.'
            : delta.rankChanged
              ? ' O novo posto ainda é ajustado manualmente.'
              : ''}
        </Text>
      </Stack>
    </Section>
  );
}

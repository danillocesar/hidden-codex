import Link from 'next/link';

import type { WorldListItem } from '@/server/queries/worlds';
import { Badge } from '@/components/ui/badge';
import { Surface } from '@/components/ui/section';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Cluster } from '@/components/ui/stack';

interface WorldCardProps {
  world: WorldListItem;
}

export function WorldCard({ world }: WorldCardProps) {
  return (
    <Link href={`/worlds/${world.id}`} className="block">
      <Surface
        tone="elevated"
        interactive
        padding="md"
        className="flex flex-col gap-2 transition-colors hover:border-ice/40"
      >
        <div className="flex items-start justify-between gap-2">
          <Heading level={3} className="line-clamp-1">
            {world.name}
          </Heading>
          <Badge tone={world.role === 'gm' ? 'accent' : 'neutral'} variant="soft" size="xs">
            {world.role === 'gm' ? 'Mestre' : 'Jogador'}
          </Badge>
        </div>

        {world.description && (
          <Text variant="muted" size="sm" className="line-clamp-2">
            {world.description}
          </Text>
        )}

        <Cluster gap="sm" className="mt-auto pt-1">
          <Text variant="muted" size="sm">
            {world.campaignCount} campanha{world.campaignCount !== 1 ? 's' : ''}
          </Text>
          <span className="text-border">·</span>
          <Text variant="muted" size="sm">
            {world.memberCount} membro{world.memberCount !== 1 ? 's' : ''}
          </Text>
        </Cluster>
      </Surface>
    </Link>
  );
}

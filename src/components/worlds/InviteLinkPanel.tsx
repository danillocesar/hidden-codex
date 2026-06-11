'use client';

import * as React from 'react';

import { Surface } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { regenerateInviteToken } from '@/server/actions/worlds/world';

interface InviteLinkPanelProps {
  worldId: string;
  inviteToken: string;
  isGm: boolean;
}

export function InviteLinkPanel({ worldId, inviteToken, isGm }: InviteLinkPanelProps) {
  const [token, setToken] = React.useState(inviteToken);
  const [copied, setCopied] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [origin, setOrigin] = React.useState('');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const path = `/join/${token}`;
  const link = origin ? `${origin}${path}` : path;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    if (!confirm('Isso vai invalidar o link atual. Continuar?')) return;
    setRegenerating(true);
    const result = await regenerateInviteToken(worldId);
    if (result.ok) setToken(result.data.inviteToken);
    setRegenerating(false);
  }

  return (
    <Surface tone="sunken" padding="md" className="flex flex-col gap-3">
      <Eyebrow tone="faint">Link de Convite</Eyebrow>

      <div className="flex items-center gap-2 rounded border border-border bg-bg-card px-3 py-2">
        <Text variant="mono" size="sm" className="flex-1 truncate text-ink-muted">
          {link}
        </Text>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>

      {isGm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          disabled={regenerating}
          className="self-start text-ink-muted hover:text-danger"
        >
          {regenerating ? 'Regenerando…' : 'Gerar novo link'}
        </Button>
      )}
    </Surface>
  );
}

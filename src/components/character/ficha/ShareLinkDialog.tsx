'use client';

import { useEffect, useState, useTransition } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import {
  createShareLink,
  revokeShareLink,
  type ShareLinkInfo,
} from '@/server/actions/characters/share';

/**
 * Modal (controlado) pra compartilhar a ficha com o mestre. Gera um link
 * read-only revogavel (`/share/<token>`). Modelo de um unico link ativo por
 * ficha: revogar + gerar de novo rotaciona o token.
 */
export function ShareLinkDialog({
  open,
  onClose,
  characterId,
  initialLink,
}: {
  open: boolean;
  onClose: () => void;
  characterId: string;
  initialLink: ShareLinkInfo | null;
}) {
  const [link, setLink] = useState<ShareLinkInfo | null>(initialLink);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = link ? `${origin}/share/${link.token}` : '';

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createShareLink(characterId);
      if (result.ok) setLink(result.link);
      else setError(result.error);
    });
  };

  const revoke = () => {
    setError(null);
    startTransition(async () => {
      const result = await revokeShareLink(characterId);
      if (result.ok) {
        setLink(null);
        setCopied(false);
      } else {
        setError(result.error);
      }
    });
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Nao foi possivel copiar — selecione e copie manualmente.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compartilhar ficha"
      description="Link somente leitura"
      size="sm"
    >
      <Stack gap="md">
        <Text variant="muted">
          Gere um link pra qualquer pessoa ver esta ficha em modo somente leitura — sem precisar de
          conta e sem poder editar. Ideal pra mandar pro mestre.
        </Text>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        {link ? (
          <Stack gap="sm">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Link de compartilhamento"
              />
              <Button variant="outline" size="sm" onClick={copy} disabled={!url}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copiar
                  </>
                )}
              </Button>
            </div>

            <Text variant="help">{formatViews(link)}</Text>

            <div className="flex justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={revoke} disabled={isPending}>
                Revogar acesso
              </Button>
            </div>
          </Stack>
        ) : (
          <Button onClick={generate} disabled={isPending}>
            {isPending ? 'Gerando…' : 'Gerar link de compartilhamento'}
          </Button>
        )}
      </Stack>
    </Modal>
  );
}

function formatViews(link: ShareLinkInfo): string {
  if (link.viewCount === 0) return 'Ainda não foi acessado.';
  const times = link.viewCount === 1 ? 'vez' : 'vezes';
  if (!link.lastViewedAt) return `Visto ${link.viewCount} ${times}.`;
  const when = new Date(link.lastViewedAt).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return `Visto ${link.viewCount} ${times} · última em ${when}.`;
}

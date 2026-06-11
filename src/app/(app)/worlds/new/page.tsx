'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Section } from '@/components/ui/section';
import { Stack } from '@/components/ui/stack';
import { Heading } from '@/components/ui/heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { createWorld } from '@/server/actions/worlds/world';

export default function NewWorldPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const formData = new FormData(e.currentTarget);
    const result = await createWorld(formData);

    if (!result.ok) {
      setError(result.error);
      setCreating(false);
      return;
    }

    router.push(`/worlds/${result.data.worldId}`);
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Stack gap="lg">
        <div>
          <Eyebrow tone="deep" size="sm" className="tracking-[0.4em]">
            Novo Mundo
          </Eyebrow>
          <Heading level={1} className="mt-1">
            Criar um <span className="italic text-ice-bright">Mundo</span>
          </Heading>
        </div>

        <Section tone="default" padded>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Field label="Nome do Mundo" htmlFor="name" required>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={80}
                  placeholder="Ex.: Shinobi World"
                />
              </Field>

              <Field label="Descrição (opcional)" htmlFor="description">
                <Textarea
                  id="description"
                  name="description"
                  maxLength={500}
                  rows={3}
                  placeholder="Uma breve descrição do seu mundo..."
                />
              </Field>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando…' : 'Criar Mundo'}
                </Button>
              </div>
            </Stack>
          </form>
        </Section>
      </Stack>
    </main>
  );
}

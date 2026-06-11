import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginButton } from '@/components/auth/LoginButton';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';

/**
 * Tela de login. O middleware redireciona direto pra `/dashboard` quando já há
 * cookie de sessão, então essa tela só é renderizada para visitantes anônimos.
 *
 * `LoginButton` é client component — usa Firebase Client SDK pra abrir o popup
 * do Google e Server Action `loginWithGoogle` pra criar a sessão.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-20">
      <Image
        src="/brand/hidden-codex-wordmark-transparent-no-brush.svg"
        alt="Hidden Codex"
        width={1400}
        height={1400}
        className="w-64 max-w-full"
        priority
        unoptimized
      />
      <Section
        as="div"
        tone="default"
        className="relative z-10 w-full max-w-md p-10 text-center shadow-hero"
      >
        <Text variant="muted" className="font-body leading-relaxed">
          Use sua conta Google. A sessão dura 7 dias.
        </Text>

        <div className="mt-8">
          <Suspense fallback={null}>
            <LoginButton />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block font-display text-[10px] uppercase tracking-[0.4em] text-ink-muted transition-colors hover:text-ice"
        >
          ← Voltar
        </Link>
      </Section>
    </main>
  );
}

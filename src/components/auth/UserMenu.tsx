'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { logout } from '@/lib/auth/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

type Props = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

/**
 * Avatar com dropdown — atalho de perfil, configurações e logout.
 * O `Image` do `next/image` cobre o caso de fotos do Google (subdomínio
 * lh3.googleusercontent.com já é aceito pelo Next em remotePatterns padrão
 * para `https`, mas precisamos garantir via `next.config.mjs`).
 */
export function UserMenu({ email, displayName, avatarUrl, isAdmin }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const res = await logout();
      try {
        await signOut(getFirebaseAuth());
      } catch {
        // ignore — server já invalidou
      }
      router.replace(res.redirectTo);
      router.refresh();
    });
  }

  const initials = computeInitials(displayName, email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-3 outline-none focus-visible:ring-1 focus-visible:ring-ice"
        aria-label="Menu da conta"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 border border-border object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center border border-border bg-bg-card font-display text-xs uppercase tracking-[0.2em] text-ice-bright"
          >
            {initials}
          </span>
        )}
        {isAdmin ? (
          <span className="hidden font-display text-[9px] uppercase tracking-[0.4em] text-ice-deep md:inline">
            admin
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5 normal-case tracking-normal">
          <span className="font-serif text-base text-ink">
            {displayName ?? 'Shinobi sem nome'}
          </span>
          <span className="font-body text-xs text-ink-muted">{email}</span>
          {isAdmin ? (
            <span className="mt-1 font-display text-[9px] uppercase tracking-[0.4em] text-ice-deep">
              admin
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">Configurações</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
          className={cn(pending && 'opacity-50')}
        >
          {pending ? 'Saindo…' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function computeInitials(displayName: string | null, email: string): string {
  const source = displayName?.trim() || email.split('@')[0] || '';
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '·';
  return parts
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

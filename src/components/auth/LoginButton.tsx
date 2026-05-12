'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth, googleAuthProvider } from '@/lib/firebase/client';
import { loginWithGoogle } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';

/**
 * Botão "Continuar com Google".
 *
 * Fluxo:
 *   1. signInWithPopup abre o popup do Google e devolve um `idToken`.
 *   2. O `idToken` é enviado para a Server Action `loginWithGoogle`, que
 *      verifica server-side, upserta o User no Postgres e seta o cookie
 *      httpOnly de sessão.
 *   3. Se OK → router.push(redirectTo) (default /dashboard, ou ?from=... se
 *      o usuário foi mandado pra cá pelo middleware).
 *
 * Mensagens de erro são intencionalmente curtas — detalhes técnicos ficam no
 * server log.
 */
export function LoginButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [popupBusy, setPopupBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  const busy = popupBusy || pending;

  async function handleClick() {
    setError(null);
    setPopupBusy(true);
    let idToken: string | null = null;
    try {
      const result = await signInWithPopup(getFirebaseAuth(), googleAuthProvider);
      idToken = await result.user.getIdToken();
    } catch (err: unknown) {
      const code = (err as { code?: string } | null)?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setPopupBusy(false);
        return;
      }
      setError('Não foi possível iniciar o login com Google.');
      setPopupBusy(false);
      return;
    }
    setPopupBusy(false);

    if (!idToken) {
      setError('Não foi possível obter o token do Google.');
      return;
    }

    startTransition(async () => {
      const res = await loginWithGoogle(idToken);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const from = searchParams.get('from');
      const target = from && from.startsWith('/') ? from : res.redirectTo;
      router.replace(target);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-3">
      <Button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="w-full"
        size="lg"
      >
        <GoogleGlyph aria-hidden />
        {busy ? 'Entrando…' : 'Continuar com Google'}
      </Button>
      {error ? (
        <p
          role="alert"
          className="font-body text-sm leading-relaxed text-seal"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Logo "G" oficial do Google. Cores hex são as do branding guide (Sign-in with
 * Google). Não trocar por filtro/grayscale — o logo manda manter colorido.
 */
function GoogleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center px-6 py-20">
      {/* Kanji watermarks — sutis, decorativos. Spec 08 §"Efeitos visuais críticos" #2 */}
      <span
        aria-hidden
        className="pointer-events-none fixed left-[-2vw] top-[10vh] select-none font-jp text-[28vw] font-bold leading-none text-ice opacity-[0.025]"
      >
        雪
      </span>
      <span
        aria-hidden
        className="pointer-events-none fixed right-[-2vw] bottom-[5vh] select-none font-jp text-[20vw] font-bold leading-none text-ice opacity-[0.025]"
      >
        皐月
      </span>

      <section className="relative z-10 flex max-w-3xl flex-col items-center gap-8 text-center">
        <span className="font-display text-[10px] uppercase tracking-[0.4em] text-ice">
          Shinobi no Sho · 4.1b
        </span>

        <h1 className="font-serif text-6xl font-light leading-none text-ink md:text-7xl">
          Arcana <span className="italic text-ice-bright">Forge</span>
        </h1>

        <p className="max-w-xl font-body text-base leading-relaxed text-ink-muted md:text-lg">
          Fichas de personagem com motor de regras, calculadora de dano e identidade visual
          cinematográfica. Para jogadores que tratam o personagem como uma lâmina forjada.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="border border-ice-deep/60 bg-bg-card px-8 py-3 font-display text-xs uppercase tracking-[0.3em] text-ink transition-colors hover:border-ice hover:bg-bg-card-2"
          >
            Entrar
          </Link>
          <a
            href="https://github.com/"
            className="font-display text-xs uppercase tracking-[0.3em] text-ink-muted transition-colors hover:text-ice"
          >
            GitHub
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-ink-faint">
          <span className="font-jp text-2xl text-ice/40">影</span>
          <span className="font-display text-[9px] uppercase tracking-[0.4em]">
            Fase F0 · Bootstrap
          </span>
        </div>
      </section>
    </main>
  );
}

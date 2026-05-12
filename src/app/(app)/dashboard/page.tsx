/**
 * Dashboard placeholder. Em F1.2 vira a lista de personagens do usuário,
 * com CTA "Criar primeiro personagem" quando vazia.
 */
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="font-serif text-4xl font-light text-ink">
        Sua <span className="italic text-ice-bright">Forja</span>
      </h1>
      <p className="mt-4 font-body text-base text-ink-muted">
        Em breve: lista de personagens e atalhos para criação.
      </p>
    </main>
  );
}

/**
 * Fundo da ficha inteira: imagem fixa (parallax) em preto e branco, bem
 * transparente, com overlays de vinheta/escurecimento por cima pra não
 * atrapalhar a leitura. Inspirado no `body::before/after` da referência.
 *
 * Renderizado dentro do `<article relative>` (z-0); o conteúdo fica em z-10.
 */
export function FichaBackground({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-fixed bg-center opacity-[0.12] grayscale"
        style={{ backgroundImage: `url(${url})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,11,14,0.55)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/40 via-transparent to-bg-deep/55" />
    </div>
  );
}

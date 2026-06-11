import { Eyebrow } from '@/components/ui/eyebrow';
import { Heading } from '@/components/ui/heading';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { ButtonPlayground } from './ButtonPlayground';
import { AttributeCardPlayground } from './AttributeCardPlayground';
import { AlertPlayground } from './AlertPlayground';
import { StepProgressPlayground } from './StepProgressPlayground';
import { PericiaCardPlayground } from './PericiaCardPlayground';
import { PowerLevelStepperPlayground } from './PowerLevelStepperPlayground';
import { CheckboxPlayground } from './CheckboxPlayground';
import { InfoButtonPlayground } from './InfoButtonPlayground';
import { SummaryPlayground } from './SummaryPlayground';

/**
 * Galeria interna de componentes UI. Lugar pra prototipar e validar novas
 * variantes antes de adotar no produto. Acessivel via `/components`.
 */
export default function ComponentsGalleryPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
      <header>
        <Eyebrow tone="deep" size="md">
          Sistema de design
        </Eyebrow>
        <Heading level={1} className="mt-2">
          Galeria de <span className="italic text-ice-bright">componentes</span>
        </Heading>
        <Text variant="muted" className="mt-3">
          Sandbox interno pra prototipar variantes visuais. Escolha as ideias que
          melhor casam com a estetica do projeto antes de promove-las pro produto.
        </Text>
      </header>

      <GallerySection title="Botoes" caption="primario + secundario">
        <ButtonPlayground />
      </GallerySection>

      <GallerySection title="Card de atributo" caption="wizard step 2">
        <AttributeCardPlayground />
      </GallerySection>

      <GallerySection title="Alertas" caption="danger · warning · info · success">
        <AlertPlayground />
      </GallerySection>

      <GallerySection title="Progresso do wizard" caption="topo do step">
        <StepProgressPlayground />
      </GallerySection>

      <GallerySection title="Card de pericia" caption="wizard step 3">
        <PericiaCardPlayground />
      </GallerySection>

      <GallerySection title="Stepper de nivel de poder" caption="wizard step 4">
        <PowerLevelStepperPlayground />
      </GallerySection>

      <GallerySection title="Checkbox / toggle" caption="filtros do app">
        <CheckboxPlayground />
      </GallerySection>

      <GallerySection title="Botao de info" caption="i que abre drawer">
        <InfoButtonPlayground />
      </GallerySection>

      <GallerySection title="Summary (Step 6)" caption="revisao final pre-criacao">
        <SummaryPlayground />
      </GallerySection>
    </main>
  );
}

function GallerySection({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <Stack gap="sm" className="mb-6">
        <Heading level={2}>
          {title}
          {caption ? (
            <>
              {' '}
              <Eyebrow tone="deep" className="align-middle">
                {caption}
              </Eyebrow>
            </>
          ) : null}
        </Heading>
      </Stack>
      {children}
    </section>
  );
}

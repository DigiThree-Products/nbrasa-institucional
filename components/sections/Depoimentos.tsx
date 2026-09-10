import { getConteudo, getDepoimentos } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";

export async function Depoimentos() {
  const [c, itens] = await Promise.all([getConteudo(), getDepoimentos()]);
  return (
    <section className="flex min-h-dvh items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
      {/*
       * "Quem veio, volta" era a linha de apoio acima do título e virou o
       * título, a pedido do cliente em 2026-09-10, quando ele tirou da tela o
       * `depoimentosTitulo` de então ("Nota 4,2 de quase 300 clientes").
       *
       * Escrito na JSX, e não vindo do seed, ele precisa de uma linha em
       * `LITERAIS_DE_DISPLAY`, em `tests/unit/owners.test.ts`: a Owners trial
       * não desenha acento, e é aquele teste que cobra o glifo.
       */}
      <h2 className="text-balance font-display text-[clamp(2.82rem,6.87vw,5.4rem)] uppercase leading-[.86]">
        Quem veio, volta
      </h2>

      {/*
       * O subtítulo apresenta os cards, e o campo do banco que ficaria órfão
       * passou a carregá-lo: o texto mudou de "Nota 4,2 de quase 300 clientes"
       * para a frase sensorial que o cliente escolheu em 2026-09-10, e o
       * `0007_subtitulo_depoimentos.sql` é o que leva isso aos bancos já
       * semeados. Continua vindo da tabela, e não da JSX, porque o painel vai
       * poder trocá-lo.
       *
       * Fonte de corpo, e é por isso que o campo **saiu** de `textosDoSeed()`
       * em `owners.test.ts`: a frase tem acento, e antes ela era display.
       *
       * `max-w-[52ch]` porque linha de leitura larga demais perde o começo da
       * seguinte, e aqui a coluna vai a 1280px.
       */}
      <p className="mb-10 mt-4 max-w-[52ch] text-[clamp(1rem,2.1vw,1.32rem)] text-creme-texto">
        {c.depoimentosTitulo}
      </p>
      <div className="grid gap-[18px] md:grid-cols-3">
        {itens.map((d) => (
          <Reveal key={d.id} className="h-full">
            <figure className="h-full rounded-[22px] border border-creme-borda bg-creme p-6">
              <div role="img" aria-label={`${d.nota} de 5 estrelas`} className="text-brasa-escura">
                {"★".repeat(d.nota)}
              </div>
              <blockquote className="mt-3 text-creme-texto">“{d.texto}”</blockquote>
              <figcaption className="mt-4 text-[.78rem] uppercase tracking-[.11em]">
                {d.autor}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      </div>
    </section>
  );
}

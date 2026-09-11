import { getConteudo, getDepoimentos } from "@/lib/conteudo";
import { PASSO_ENTRE_CARDS } from "@/lib/brasa";
import { AcendeEmBrasa } from "@/components/motion/AcendeEmBrasa";

export async function Depoimentos() {
  const [c, itens] = await Promise.all([getConteudo(), getDepoimentos()]);
  return (
    /*
     * `isolate` cria contexto de empilhamento próprio, e é o que deixa a foto
     * e o véu usarem `z` negativo sem escapar para trás do fundo do body, que
     * é branco e os engoliria. `overflow-hidden` segura a foto quando o
     * `object-cover` a faz transbordar a caixa, que é o normal dela.
     */
    <section className="relative isolate flex min-h-dvh items-center overflow-hidden">
      {/*
       * A foto de fundo, a pedido do cliente em 2026-09-10. Sai de
       * `scripts/gerar-quem-veio-volta.py`, no molde das paradas do delivery:
       * AVIF e WebP em duas larguras, mais um JPEG de reserva.
       *
       * `alt` vazio de propósito: ela é decoração, o conteúdo da seção são as
       * avaliações. Texto alternativo aqui faria o leitor de tela anunciar uma
       * foto que não acrescenta informação nenhuma ao que ele vai ler em
       * seguida.
       *
       * `loading="lazy"` porque a seção fecha a página: quem nunca rola até
       * ela não paga o download. O candidato a LCP continua sendo a foto do
       * herói, e esta não disputa com ela.
       */}
      <picture>
        <source
          type="image/avif"
          sizes="100vw"
          srcSet="/quem-veio-volta-640.avif 640w, /quem-veio-volta-1080.avif 1080w"
        />
        <source
          type="image/webp"
          sizes="100vw"
          srcSet="/quem-veio-volta-640.webp 640w, /quem-veio-volta-1080.webp 1080w"
        />
        <img
          src="/quem-veio-volta-1080.jpg"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      </picture>

      {/*
       * O véu. 78% não é chute: no pior caso possível, foto branca pura atrás,
       * o composto fica em #545050, que dá 8,0:1 com o branco e 6,5:1 com o
       * creme. `tests/unit/contraste.test.ts` guarda essas contas.
       *
       * Começou em 70%, que já passava AA (6,0:1 e 4,9:1), e o cliente pediu
       * mais escuro em 2026-09-10, junto com a troca da foto. O piso é 62%:
       * daí para baixo o branco cai de 4,6:1 e reprova.
       *
       * Mexer nesta opacidade é mexer no contraste de todo texto da seção, e
       * nada lança quando ela baixa: o texto só fica ilegível sobre a parte
       * clara da foto, que é o céu, no topo.
       */}
      <div className="absolute inset-0 -z-10 bg-carvao/78" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
      {/*
       * "Quem veio, volta" era a linha de apoio acima do título e virou o
       * título, a pedido do cliente em 2026-09-10, quando ele tirou da tela o
       * `depoimentosTitulo` de então ("Nota 4,2 de quase 300 clientes").
       *
       * Escrito na JSX, e não vindo do seed, ele precisa de uma linha em
       * `LITERAIS_DE_DISPLAY`, em `tests/unit/owners.test.ts`: a Owners trial
       * não desenha acento, e é aquele teste que cobra o glifo.
       *
       * **Toda a seção acende em brasa**, e não só o título: o subtítulo e os
       * três cards vieram junto a pedido do cliente em 2026-09-11. É a
       * diferença para a seção de horários, onde rótulos de dia e horas
       * ficaram no `Reveal` porque em corpo de 11px o gesto lê como sujeira.
       * Aqui o corpo é bem maior e o fogo se sustenta. Custa quatro blocos
       * animados a mais, e bloco é barato: o que pesava era letra a letra.
       *
       * **Mas o corpo vai sem halo**, por `halo={false}`, e isso é medido: a
       * sombra é paga por GLIFO, então os três cards com halo levavam a seção
       * de 16,7 ms por quadro para 22,7 ms, com 43% dos quadros acima de 20
       * ms. Sem ele volta ao controle. Só o título carrega halo, que é onde
       * há poucas letras e grandes.
       *
       * A cor de repouso mora no ELEMENTO ANIMADO, e não no `h2`: o gesto
       * anima `color`, e filho com classe de cor própria não herda. Com
       * `text-branco` no `h2`, o título assentaria na cor errada, calado.
       *
       * O halo continua **brasa**, que é a escolha do cliente em 2026-09-11 ao
       * ver o mockup. Vale registrar que ela reabre o que ele tinha decidido
       * no mesmo dia para a queima, quando mandou tirar todo vermelho daqui
       * porque o halo brigava com a foto atrás do véu. A diferença é que agora
       * o vermelho é um estalo de meio segundo, e não um brilho que acompanha
       * a revelação inteira. Trocar para carvão é passar `brilho`.
       */}
      <AcendeEmBrasa className="text-branco">
        <h2 className="text-balance font-display text-[clamp(2.82rem,6.87vw,5.4rem)] uppercase leading-[.86]">
          Quem veio, volta
        </h2>
      </AcendeEmBrasa>

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
      <AcendeEmBrasa halo={false} className="text-creme">
        <p className="mb-10 mt-4 max-w-[52ch] text-[clamp(1rem,2.1vw,1.32rem)]">
          {c.depoimentosTitulo}
        </p>
      </AcendeEmBrasa>
      <div className="grid gap-[18px] md:grid-cols-3">
        {/*
         * O card inteiro acende em brasa, e a cor de repouso que vive no
         * elemento animado é a `creme` da citação, que é o grosso do texto.
         *
         * A escolha é forçada pelo gesto: ele anima `color` num elemento só, e
         * filho com classe de cor própria não herda. As estrelas e a
         * assinatura continuam `text-branco` de propósito, então elas brilham
         * e desfocam junto, mas não passam pelo vermelho. Unificar as três
         * cores tiraria a ênfase que o cliente pediu em 2026-09-10, quando o
         * card perdeu fundo e borda.
         */}
        {itens.map((d, i) => (
          <AcendeEmBrasa halo={false} key={d.id} className="h-full text-creme" delay={i * PASSO_ENTRE_CARDS}>
            {/*
             * Sem fundo e sem borda desde 2026-09-10, a pedido do cliente: o
             * card agora é só texto sobre a foto, e quem separa uma avaliação
             * da outra é o vão da grade. O `p-6` ficou porque ele é o que
             * mantém o respiro que a moldura dava.
             *
             * Todas as três cores mudaram junto, e não por gosto. As estrelas
             * eram `brasa`, que sobre o véu dá **1,1:1** e some; o texto era
             * `creme-texto` e a assinatura era carvão, os dois pensados para
             * fundo claro. Sobre foto só valem branco e creme.
             */}
            <figure className="h-full p-6">
              <div role="img" aria-label={`${d.nota} de 5 estrelas`} className="text-branco">
                {"★".repeat(d.nota)}
              </div>
              <blockquote className="mt-3">“{d.texto}”</blockquote>
              <figcaption className="mt-4 text-[.78rem] uppercase tracking-[.11em] text-branco">
                {d.autor}
              </figcaption>
            </figure>
          </AcendeEmBrasa>
        ))}
      </div>
      </div>
    </section>
  );
}

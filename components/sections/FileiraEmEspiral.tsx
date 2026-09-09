"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AFASTAMENTO_DA_BORDA,
  DISTANCIA_DA_CAMERA,
  janelaDoTrilho,
  larguraNaBobina,
  pontosDaBobina,
  projetarNoPalco,
  transformacaoDoCard,
  type Deslocamento,
} from "@/lib/espiral";

/**
 * O palco da espiral do Cardápio.
 *
 * Ele embrulha a coluna de texto e a grade de cards, e é ele que o
 * ScrollTrigger prende. A matemática mora em `lib/espiral.ts`; aqui só se
 * mede, se prende e se escreve `transform` e `d`.
 *
 * ── O layout é o da referência, e não decoração em volta dela ───────────────
 * Duas colunas a partir de 1024px: o título e o texto de apoio ficam parados à
 * esquerda enquanto a bobina varre o meio da tela e entrega os cards numa
 * grade de duas colunas por três linhas à direita. É o arranjo da seção
 * "Programação completa" da FITA, e ele não é enfeite: prender o palco exige
 * que a seção caiba numa janela, e a coluna de texto ao lado da grade é o que
 * deixa a grade curta o bastante para caber com a bobina passando por cima.
 *
 * O EIXO da bobina é o centro do PALCO, não o centro da grade. Ela varre o meio
 * da tela, cruza por cima do título, e os cards descolam do alto e mergulham
 * para a direita. Medir o deslocamento natural contra a grade poria o eixo
 * dentro dela e a bobina giraria só no canto direito.
 *
 * ── Por que matchMedia do GSAP, e não saída antecipada ──────────────────────
 * `Reveal` e `RotaMascote` decidem uma vez, na montagem, com
 * `window.matchMedia(...).matches`. Serve para eles, que não mudam de
 * comportamento com o tamanho da janela. Aqui não serviria: quem começa em
 * 1400px e reduz para 900 ficaria com um palco preso e 240vh de cena num
 * layout de coluna única, e quem faz o caminho inverso não ganharia a cena. O
 * `matchMedia` do GSAP cria e destrói o gatilho nas duas travessias, e a mesma
 * consulta cobre `prefers-reduced-motion`, que também é reativo.
 *
 * ── Quem cria as telas de rolagem ───────────────────────────────────────────
 * O espaçador do próprio ScrollTrigger, por causa do `end: "+=240%"`, e não
 * uma altura declarada no CSS. A diferença é o que faz a degradação sair de
 * graça: sem JavaScript, ou com menos movimento pedido, o gatilho nunca é
 * criado, e aí não existe palco preso nem 240vh de vazio. Uma altura de 240vh
 * no CSS deixaria duas telas e meia em branco justamente para quem pediu menos
 * movimento. Pelo mesmo motivo os dois `path` do trilho nascem com o `d`
 * vazio: sem cena, não há linha nenhuma para apagar.
 */

/** Quantos segmentos de reta desenham cada trilho. */
const PASSOS_DO_TRILHO = 110;

/**
 * Defasagem de cada trilho em relação à cabeça, em radianos.
 *
 * Pequena de propósito: o bastante para o olho ver que um vem antes do outro, e
 * pouco o bastante para os dois seguirem acompanhando a borda dos cards. Na
 * FITA são 0,014 e 0,032 de progresso, que no curso de lá valem quase isto.
 */
const ATRASO_DO_TRILHO_DE_BAIXO = 0.22;
const ATRASO_DO_TRILHO_DE_CIMA = 0.5;

export function FileiraEmEspiral({
  cabecalho,
  children,
}: {
  cabecalho: ReactNode;
  children: ReactNode;
}) {
  const palco = useRef<HTMLDivElement>(null);
  const fileira = useRef<HTMLDivElement>(null);
  const trilhoDeBaixo = useRef<SVGPathElement>(null);
  const trilhoDeCima = useRef<SVGPathElement>(null);

  useEffect(() => {
    const alvoPalco = palco.current;
    const alvoFileira = fileira.current;
    if (!alvoPalco || !alvoFileira) return;

    let vivo = true;
    let limpar: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const cards = Array.from(alvoFileira.children) as HTMLElement[];
          let medidas: {
            deslocamento: Deslocamento;
            largura: number;
            altura: number;
          }[] = [];
          /** Meia caixa do palco: o eixo da bobina, em coordenadas do SVG. */
          let eixoNoSvg = { x: 0, y: 0 };
          /** A largura do card NA BOBINA, que é a unidade da hélice. */
          let unidade = 0;

          /**
           * Medido uma vez e remedido a cada `refresh` do ScrollTrigger. Ler
           * caixa dentro do quadro de scroll forçaria layout a cada rolagem,
           * que é o custo que este esquema existe para evitar.
           *
           * A medida é tirada com os cards já limpos, senão o deslocamento
           * natural sairia contaminado pela transformação do quadro anterior.
           */
          const medir = () => {
            cards.forEach((card) => {
              card.style.transform = "";
            });
            const caixaDoPalco = alvoPalco.getBoundingClientRect();
            const eixo = {
              x: caixaDoPalco.left + caixaDoPalco.width / 2,
              y: caixaDoPalco.top + caixaDoPalco.height / 2,
            };
            eixoNoSvg = { x: caixaDoPalco.width / 2, y: caixaDoPalco.height / 2 };

            medidas = cards.map((card) => {
              const r = card.getBoundingClientRect();
              return {
                deslocamento: {
                  x: r.left + r.width / 2 - eixo.x,
                  y: r.top + r.height / 2 - eixo.y,
                },
                largura: r.width,
                altura: r.height,
              };
            });
            unidade = larguraNaBobina(medidas[0]?.largura ?? 0);

            /* A perspectiva é escrita daqui, e não numa classe, porque o
               trilho refaz a MESMA projeção em JavaScript. Deixar o número em
               dois lugares é deixar a linha escorregar dos cards no dia em que
               um dos dois mudar. E a origem dela vai para o eixo da bobina,
               que fica fora da grade: sem isso o ponto de fuga cairia no centro
               da grade e a hélice sairia torta em relação ao trilho. */
            const caixaDaFileira = alvoFileira.getBoundingClientRect();
            alvoFileira.style.perspective = `${DISTANCIA_DA_CAMERA * unidade}px`;
            alvoFileira.style.perspectiveOrigin =
              `${eixo.x - caixaDaFileira.left}px ${eixo.y - caixaDaFileira.top}px`;
          };

          /** O `d` de um filete, projetado com a mesma conta que o navegador
              aplica nos cards. */
          const traco = (progresso: number, atraso: number, afastamento: number) => {
            if (unidade <= 0) return "";
            const janela = janelaDoTrilho(progresso, atraso);
            if (janela.ate - janela.de <= 0) return "";
            const pontos = pontosDaBobina(
              janela.de,
              janela.ate,
              PASSOS_DO_TRILHO,
              afastamento,
            );
            return pontos
              .map((ponto, i) => {
                const p = projetarNoPalco(ponto, unidade);
                const x = (eixoNoSvg.x + p.x).toFixed(1);
                const y = (eixoNoSvg.y + p.y).toFixed(1);
                return `${i === 0 ? "M" : "L"}${x} ${y}`;
              })
              .join("");
          };

          const pinta = (progresso: number) => {
            cards.forEach((card, i) => {
              const m = medidas[i];
              if (!m) return;
              const t = transformacaoDoCard(
                progresso,
                i,
                m.deslocamento,
                m.largura,
                m.altura,
              );
              const graus = (t.giro * 180) / Math.PI;
              // A ordem importa: o `scale` vem por último e por isso é aplicado
              // PRIMEIRO ao card, dentro do espaço dele. Posto antes, ele
              // multiplicaria também o deslocamento e o card sairia de órbita.
              card.style.transform =
                `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, ${t.z.toFixed(2)}px) ` +
                `rotateY(${graus.toFixed(2)}deg) scale(${t.escala.toFixed(4)})`;
            });

            trilhoDeBaixo.current?.setAttribute(
              "d",
              traco(progresso, ATRASO_DO_TRILHO_DE_BAIXO, AFASTAMENTO_DA_BORDA),
            );
            trilhoDeCima.current?.setAttribute(
              "d",
              traco(progresso, ATRASO_DO_TRILHO_DE_CIMA, -AFASTAMENTO_DA_BORDA),
            );
          };

          medir();

          const gatilho = ScrollTrigger.create({
            trigger: alvoPalco,
            start: "top top",
            end: "+=240%",
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: () => medir(),
            onUpdate: (self) => pinta(self.progress),
          });

          pinta(0);

          // Devolve os cards e os filetes ao estado limpo quando a consulta
          // deixa de valer. Sem isto, encolher a janela para o mobile deixaria
          // seis cards congelados no meio da hélice e dois riscos atravessados
          // por cima do layout de coluna única.
          return () => {
            gatilho.kill();
            cards.forEach((card) => {
              card.style.transform = "";
            });
            alvoFileira.style.perspective = "";
            alvoFileira.style.perspectiveOrigin = "";
            trilhoDeBaixo.current?.setAttribute("d", "");
            trilhoDeCima.current?.setAttribute("d", "");
          };
        },
      );

      limpar = () => mm.revert();
    })();

    return () => {
      vivo = false;
      limpar?.();
    };
  }, []);

  return (
    /* O elemento PRESO é este, largo de ponta a ponta, e não a coluna de
       conteúdo. O `pin` do ScrollTrigger substitui o elemento por um espaçador
       e assume o posicionamento dele; fazer isso num elemento centrado por
       `mx-auto` com `max-w` entrega a centralização para o espaçador, e a
       coluna anda alguns pixels no instante em que a cena prende. Preso o
       invólucro largo, a coluna continua sendo centrada pelo CSS de sempre. */
    <div ref={palco} className="relative lg:h-dvh lg:overflow-hidden">
      {/* O trilho. Fica ATRÁS dos cards de propósito: na FITA os tubos se
          entrelaçam com os planos em 3D, e aqui não há como um SVG plano
          alternar de camada card a card. Trem sobre trilho lê melhor do que
          trilho por cima do trem, e é o que a própria FITA escolheu quando
          desceu a linha para a borda de baixo do card.

          Sem `viewBox` de propósito: a projeção de `projetarNoPalco` já sai em
          pixels do palco, e um viewBox reescalaria tudo de novo. Sem ele, uma
          unidade de usuário do SVG é um pixel, que é exatamente o que se
          quer. */}
      <svg
        aria-hidden
        /* O gancho existe para o teste: dentro de `#cardapio` há um `svg` da
           Chama em cada card, e um seletor por elemento pegaria os sete. */
        data-trilho
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      >
        <path
          ref={trilhoDeBaixo}
          d=""
          fill="none"
          stroke="var(--color-brasa)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          ref={trilhoDeCima}
          d=""
          fill="none"
          stroke="var(--color-carvao)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-6 py-20 lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:gap-14 lg:py-10">
        {cabecalho}
        {/* `preserve-3d` para os seis cards serem ordenados por profundidade
            entre si: sem ele o navegador achata cada um no plano do pai e pinta
            na ordem do DOM, e o card do fundo da bobina passa por cima do da
            frente. A perspectiva em si é escrita pelo efeito, junto com a
            origem dela, ver `medir`. */}
        <div
          ref={fileira}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:[transform-style:preserve-3d]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

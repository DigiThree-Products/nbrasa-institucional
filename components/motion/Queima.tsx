"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  LINHA_INICIAL,
  LINHA_FINAL,
  VARIAVEL_DA_LINHA,
  mascaraDaQueima,
  escondeNaMontagem,
} from "@/lib/queima";

/**
 * Queima um bloco inteiro de baixo para cima, e o esfumaça na saída.
 *
 * É o irmão de bloco do `TextoQueAcende` no modo `queima`: mesma linha de
 * fogo subindo, mesma referência de tipografia em chamas, mesma saída. A
 * diferença é o alvo e o preço. Lá cada LETRA tem duas camadas e uma máscara,
 * o que só se paga em texto de display; aqui a máscara é uma só, no bloco
 * inteiro, e é o que deixa o gesto valer num parágrafo de oitenta caracteres
 * ou num card de avaliação sem multiplicar o custo por trezentos.
 *
 * A fumaça, por isso, também muda de forma. No título ela é uma cópia borrada
 * da letra por cima da linha de fogo. Aqui é o próprio conteúdo, que entra
 * desfocado e ganha foco enquanto o fogo sobe: duplicar a marcação de um card
 * inteiro só para ter a cópia sairia caro e ainda dobraria o texto no DOM.
 *
 * Quem pede menos movimento não ganha animação nenhuma, e o conteúdo nunca
 * depende dela para ser lido.
 */

/** Quanto tempo o fogo leva para atravessar o bloco de baixo a cima. */
const DURACAO_DA_QUEIMA = 1;
/** O desfoque de entrada, que é a fumaça saindo da frente do conteúdo. */
const DESFOQUE_INICIAL = 7;
/** A saída é mais curta e acelera, para não segurar a rolagem. */
const SAINDO = {
  opacity: 0, y: -26, filter: "blur(7px)",
  duration: 0.5, ease: "power1.in",
} as const;

type Props = {
  children: ReactNode;
  className?: string;
  /** Atrasa a queima, para escalonar um card depois do outro. */
  delay?: number;
};

export function Queima({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let vivo = true;
    let matar: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      /*
       * A máscara é escrita por aqui, e nunca na marcação. Ela é o que
       * esconde o bloco, então só pode existir onde há quem a mova: escrita
       * na JSX, deixaria o conteúdo invisível para sempre em quem carregasse
       * a página sem o GSAP.
       */
      const vestirMascara = () => {
        const tinta = mascaraDaQueima("tinta");
        gsap.set(el, { maskImage: tinta, webkitMaskImage: tinta });
      };

      // Passado o fogo não sobra nada para mascarar, e bloco parado não
      // precisa carregar camada de composição.
      const despirMascara = () => {
        gsap.set(el, { clearProps: "maskImage,webkitMaskImage" });
      };

      const queimar = () => {
        vestirMascara();
        gsap.fromTo(
          el,
          {
            [VARIAVEL_DA_LINHA]: LINHA_INICIAL,
            // Desfaz o estado de fumaça em que a saída deixou o bloco.
            opacity: 1, y: 0, filter: `blur(${DESFOQUE_INICIAL}px)`,
          },
          {
            [VARIAVEL_DA_LINHA]: LINHA_FINAL,
            opacity: 1, y: 0, filter: "blur(0px)",
            duration: DURACAO_DA_QUEIMA, ease: "power1.inOut", delay,
            overwrite: true, onComplete: despirMascara,
          },
        );
      };

      // Subir mais desfocar é o que lê como fumaça. Descer leria como queda.
      const esfumacar = () => { gsap.to(el, { ...SAINDO, overwrite: true }); };

      /*
       * Nasce escondido quando ainda está abaixo da janela, e não quando o
       * gatilho pega: sem isto o bloco sobe a tela em opacidade cheia,
       * aparece de verdade por volta de cem pixels de rolagem, e só então
       * salta para escondido. Quem já está à vista não é tocado, porque
       * apagar na frente de quem está lendo é pior que a piscada.
       */
      if (escondeNaMontagem(el.getBoundingClientRect().top, window.innerHeight)) {
        vestirMascara();
        gsap.set(el, {
          [VARIAVEL_DA_LINHA]: LINHA_INICIAL,
          filter: `blur(${DESFOQUE_INICIAL}px)`,
        });
      }

      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: "top 86%",
        // Sem `end` o gatilho valeria até o fim da página e a fumaça nunca
        // aconteceria. Mesmo motivo do `saida` do Reveal.
        end: "bottom top",
        onEnter: queimar,
        onEnterBack: queimar,
        onLeave: esfumacar,
        onLeaveBack: esfumacar,
      });
      matar = () => { gsap.killTweensOf(el); gatilho.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay]);

  return <div ref={ref} className={className}>{children}</div>;
}

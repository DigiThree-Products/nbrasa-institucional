"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Estado escondido: um pouco abaixo do lugar e transparente. */
const ESCONDIDO = { y: 38, opacity: 0 };
/** Estado revelado, e a entrada. */
const REVELADO = { y: 0, opacity: 1, duration: 0.75, ease: "power2.out" };
/** A saída é mais curta e acelera, para não segurar a rolagem. */
const SAINDO = { y: 38, opacity: 0, duration: 0.45, ease: "power2.in" };
/** O conteúdo revela quando o topo dele cruza 88% da altura da janela. */
const INICIO = "top 88%";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  /**
   * Esconde o conteúdo de novo quando ele deixa a tela, e o revela outra vez
   * na volta, em vez de revelar uma vez e ficar. Existe desde 2026-09-10 para
   * a seção de horários, onde o cliente pediu entrada e saída.
   *
   * Continua opcional, e não padrão, mas o motivo mudou em 2026-09-10: era
   * `Depoimentos` que dependia do revelar e ficar, e a seção passou a queimar
   * de baixo para cima, pelo `Queima`. **Hoje o caminho sem `saida` não tem
   * consumidor na interface**, com os testes de pé, como o `agruparHorarios`.
   * Ele fica porque revelar uma vez e ficar é o que qualquer seção nova de
   * conteúdo estático vai querer.
   */
  saida?: boolean;
};

export function Reveal({ children, delay = 0, className, saida = false }: Props) {
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

      if (!saida) {
        const tween = gsap.fromTo(el, ESCONDIDO, {
          ...REVELADO, delay,
          // sem isto o elemento fica parado em opacity:0 ate o scroll chegar
          immediateRender: false,
          scrollTrigger: { trigger: el, start: INICIO, once: true },
        });
        matar = () => { tween.scrollTrigger?.kill(); tween.kill(); };
        return;
      }

      /*
       * Cada travessia cria uma tween nova, em vez de reverter a de entrada.
       *
       * O caminho óbvio seria `toggleActions: "play reverse play reverse"`, e
       * ele **não funciona neste site**. `SmoothScrollProvider` liga
       * `gsap.ticker.lagSmoothing(0)`, então um quadro demorado chega ao GSAP
       * com o delta inteiro e a reversão pula direto para o tempo zero; e no
       * tempo zero o `immediateRender: false` da tween de entrada suprime a
       * pintura. Resultado: a tween marca `reversed`, e o elemento fica
       * visível para sempre. Medido em 2026-09-10, com o gatilho na mão.
       *
       * Tween nova não tem esse problema, porque nunca depende de um quadro
       * final que pode ser suprimido. De quebra, a saída ganha duração e
       * curva próprias, que a reversão não permitia.
       */
      let primeiraEntrada = true;
      const entrar = () => {
        if (primeiraEntrada) {
          primeiraEntrada = false;
          // Só aqui o `fromTo`: nas voltas o conteúdo já está escondido pela
          // saída, e refazer o estado inicial daria um salto.
          gsap.fromTo(el, ESCONDIDO, { ...REVELADO, delay, overwrite: true });
          return;
        }
        gsap.to(el, { ...REVELADO, overwrite: true });
      };
      const sair = () => { gsap.to(el, { ...SAINDO, overwrite: true }); };

      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: INICIO,
        // Sem `end` o gatilho valeria até o fim da página e a saída nunca
        // aconteceria. "bottom top" é o instante em que o elemento acaba de
        // sumir por cima.
        end: "bottom top",
        onEnter: entrar,
        onEnterBack: entrar,
        onLeave: sair,
        onLeaveBack: sair,
      });
      matar = () => { gsap.killTweensOf(el); gatilho.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay, saida]);

  return <div ref={ref} className={className}>{children}</div>;
}

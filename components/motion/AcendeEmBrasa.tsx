"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  DURACAO_DA_CHAMA,
  DURACAO_DO_ASSENTO,
  EMENDA_DAS_FASES,
  estadosDaBrasa,
  escondeNaMontagem,
} from "@/lib/brasa";

/**
 * Revela um bloco de texto como brasa que vira letra.
 *
 * O texto nasce brasa fosca, entra em chamas e assenta na cor de repouso. É o
 * gesto que o cliente escolheu vendo, num mockup, em 2026-09-11, quando a
 * queima foi aposentada por travar a rolagem.
 *
 * **É de bloco, e isso não é detalhe de implementação, é a correção.** A
 * queima animava LETRA A LETRA, com duas camadas, uma máscara e seis sombras
 * em cada letra, e media 62,4 ms por quadro contra 16,7 ms do controle. O
 * custo é linear no número de elementos animados: aqui é um por texto. Quem
 * for tentado a quebrar isto em letras de novo lê a tabela em `lib/brasa.ts`
 * antes.
 *
 * A cor de repouso é lida do DOM na montagem, antes de qualquer animação
 * mexer no elemento, porque cada linha das duas seções repousa numa cor
 * diferente.
 *
 * Quem pede menos movimento não ganha animação nenhuma e lê o texto parado,
 * que é a regra de todo o resto do site.
 */

/** A saída é mais curta e acelera, para não segurar a rolagem. */
const SAINDO = {
  opacity: 0, y: -22, filter: "blur(6px)",
  duration: 0.42, ease: "power2.in",
} as const;

type Props = {
  children: ReactNode;
  className?: string;
  /** Atrasa o acender, para escalonar um card depois do outro. */
  delay?: number;
  /**
   * A cor do halo enquanto o texto queima.
   *
   * Padrão brasa, que é a marca. A seção de avaliações pode querer carvão: em
   * 2026-09-11 o cliente mandou tirar o vermelho de lá porque o halo brigava
   * com a foto atrás do véu.
   */
  brilho?: string;
  /**
   * Desliga o halo, para texto de corpo.
   *
   * Não é gosto, é custo medido: a sombra é paga por GLIFO, e não por bloco
   * animado. Com halo nos três cards de avaliação e no subtítulo, a seção
   * media 22,7 ms por quadro e 43% dos quadros acima de 20 ms; sem ele, 16,7
   * ms, igual ao controle. Desligar o desfoque no lugar dele não mudou nada.
   * Display tem poucas letras grandes e paga tranquilo; card de avaliação tem
   * centenas de letrinhas sobre uma foto.
   */
  halo?: boolean;
};

export function AcendeEmBrasa({
  children, className, delay = 0, brilho, halo = true,
}: Props) {
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

      const doToken = (token: string, reserva: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(token).trim() || reserva;
      const corDoHalo = brilho ?? doToken("--color-brasa", "#cf2434");
      // Lida ANTES de qualquer animação tocar o elemento, senão a cor de
      // repouso capturada já seria a da brasa e o texto assentaria vermelho.
      const repouso = getComputedStyle(el).color;
      const { brasa, chama, letra } = estadosDaBrasa(corDoHalo, repouso, halo);

      const acender = () => {
        gsap.killTweensOf(el);
        gsap.timeline({ delay })
          .fromTo(el, brasa, {
            ...chama, duration: DURACAO_DA_CHAMA, ease: "power2.out",
          })
          // A emenda começa antes de a chama acabar, senão o texto trava em
          // vermelho cheio no meio do gesto. Ver `EMENDA_DAS_FASES`.
          .to(el, {
            ...letra, duration: DURACAO_DO_ASSENTO, ease: "power2.inOut",
            // Brilho e desfoque saem de vez: texto parado não carrega camada
            // de composição, e halo esquecido fica vermelho na tela para
            // sempre. É o erro calado que `brasa.test.ts` cobra.
            onComplete: () => gsap.set(el, { clearProps: "filter,textShadow,transform" }),
          }, EMENDA_DAS_FASES);
      };

      // Subir mais desfocar é o que lê como fumaça. Descer leria como queda.
      const apagar = () => { gsap.to(el, { ...SAINDO, overwrite: true }); };

      /*
       * Nasce escondido quando ainda está abaixo da janela, e não quando o
       * gatilho pega: sem isto o bloco sobe a tela em opacidade cheia,
       * aparece de verdade por volta de cem pixels de rolagem, e só então
       * salta para escondido. Quem já está à vista não é tocado, porque
       * apagar na frente de quem está lendo é pior que a piscada.
       */
      if (escondeNaMontagem(el.getBoundingClientRect().top, window.innerHeight)) {
        gsap.set(el, { opacity: 0 });
      }

      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        // Sem `end` o gatilho valeria até o fim da página e a saída nunca
        // aconteceria. Mesmo motivo do `saida` do Reveal.
        end: "bottom top",
        onEnter: acender,
        onEnterBack: acender,
        onLeave: apagar,
        onLeaveBack: apagar,
      });
      matar = () => { gsap.killTweensOf(el); gatilho.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay, brilho, halo]);

  return <div ref={ref} className={className}>{children}</div>;
}

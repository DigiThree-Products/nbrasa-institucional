"use client";

import { Fragment, useEffect, useRef } from "react";

/**
 * Texto que acende letra a letra na entrada e esfumaça na saída.
 *
 * O gesto é da referência que o cliente mandou em 2026-09-10, um alfabeto
 * animado em que cada letra é feita de fogo. O que foi tomado emprestado é o
 * **movimento**, não a paleta: lá o fundo é preto e as letras são laranja e
 * amarelo, e aqui a página é clara e as cores continuam sendo carvão, brasa e
 * branco. O fogo sai da cor de nascimento e do brilho, que esfriam até a cor
 * de repouso da própria letra.
 *
 * Acessibilidade: a frase inteira vai num `sr-only`, e a versão quebrada em
 * letras leva `aria-hidden`. Sem isso o leitor de tela soletraria o título.
 * Quem pede menos movimento não ganha animação nenhuma e lê o texto parado,
 * que é a regra de todo o resto do site.
 */

/** Vermelho de marca. Lido do token para não duplicar o hex; o literal é só
 *  a rede de segurança para ambiente sem CSS carregado (jsdom, por exemplo). */
function vermelhoDeMarca(): string {
  const doToken = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-brasa").trim();
  return doToken || "#cf2434";
}

type Props = {
  children: string;
  className?: string;
  /** Atrasa o acender, para escalonar linhas vizinhas. */
  delay?: number;
};

export function TextoQueAcende({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const palavras = children.split(" ");

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

      const letras = Array.from(el.querySelectorAll<HTMLElement>("[data-letra]"));
      if (letras.length === 0) return;

      const brasa = vermelhoDeMarca();
      // A cor de repouso é lida ANTES de qualquer animação mexer na letra, e
      // é por letra porque cada linha da seção repousa numa cor diferente:
      // carvão no título do evento, brasa-escura e creme-texto nos rótulos.
      const repouso = new Map(letras.map((l) => [l, getComputedStyle(l).color]));

      // Entrada sempre `fromTo`: na volta as letras estão paradas no estado de
      // fumaça, e um `to` as traria de cima para baixo, ao contrário de
      // acender. Como o estado de partida é opacidade zero, o salto não se vê.
      const acender = () => {
        gsap.fromTo(
          letras,
          {
            opacity: 0, y: 16, scale: 0.82, filter: "blur(0px)",
            color: brasa, textShadow: `0 0 16px ${brasa}`,
          },
          {
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
            color: (_i: number, alvo: HTMLElement) => repouso.get(alvo) ?? "",
            textShadow: "0 0 0px rgba(0,0,0,0)",
            duration: 0.55, ease: "power2.out", stagger: 0.028, delay,
            overwrite: true,
          },
        );
      };

      // Subir mais desfocar é o que lê como fumaça. Descer leria como queda.
      const esfumacar = () => {
        gsap.to(letras, {
          opacity: 0, y: -24, scale: 1.05, filter: "blur(7px)",
          duration: 0.5, ease: "power1.in", stagger: 0.018, overwrite: true,
        });
      };

      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        // Sem `end` o gatilho valeria até o fim da página e a fumaça nunca
        // aconteceria. Mesmo motivo do `saida` do Reveal.
        end: "bottom top",
        onEnter: acender,
        onEnterBack: acender,
        onLeave: esfumacar,
        onLeaveBack: esfumacar,
      });
      matar = () => { gsap.killTweensOf(letras); gatilho.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {palavras.map((palavra, p) => (
          <Fragment key={p}>
            {/* A palavra não quebra por dentro: as letras viram `inline-block`
                para poderem ser transformadas, e sem isto a linha poderia
                quebrar no meio de uma delas. O espaço fica FORA da palavra,
                senão some a única oportunidade de quebra da linha. */}
            <span className="inline-block whitespace-nowrap">
              {[...palavra].map((letra, l) => (
                <span key={l} data-letra="" className="inline-block">
                  {letra}
                </span>
              ))}
            </span>
            {p < palavras.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </span>
  );
}

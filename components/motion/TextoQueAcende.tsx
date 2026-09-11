"use client";

import { Fragment, useEffect, useRef } from "react";
import {
  LINHA_INICIAL,
  LINHA_FINAL,
  VARIAVEL_DA_LINHA,
  mascaraDaQueima,
  escondeNaMontagem,
  contasDaQueima,
  plumaDeFumaca,
} from "@/lib/queima";

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
 * São dois modos de entrada, e a saída é a mesma nos dois. O padrão sobe a
 * letra inteira e a esfria. O `queima` deixa a letra parada e faz uma linha de
 * fogo subir por dentro do glifo, e desde 2026-09-11 é o que as duas seções
 * com texto animado usam, avaliações e horários. O padrão ficou **sem
 * consumidor na interface**, com os testes de pé: ver a prop, que traz o custo
 * medido de cada um.
 *
 * Acessibilidade: a frase inteira vai num `sr-only`, e a versão quebrada em
 * letras leva `aria-hidden`. Sem isso o leitor de tela soletraria o título.
 * Quem pede menos movimento não ganha animação nenhuma e lê o texto parado,
 * que é a regra de todo o resto do site.
 */

/** Cor de marca lida do token, para não duplicar o hex. O literal é só a rede
 *  de segurança para ambiente sem CSS carregado (jsdom, por exemplo). */
function corDeMarca(token: string, reserva: string): string {
  const doToken = getComputedStyle(document.documentElement)
    .getPropertyValue(token).trim();
  return doToken || reserva;
}

/**
 * Quanto tempo o fogo leva para atravessar um glifo de baixo a cima.
 *
 * Era 0,9 até 2026-09-11, quando o cliente pediu a revelação mais lenta. O
 * passo entre letras subiu na mesma proporção, senão a onda encavalaria: com
 * a travessia mais longa e o passo antigo, meia palavra queimaria junto e o
 * gesto voltaria a ler como bloco só.
 */
const DURACAO_DA_QUEIMA = 1.5;
/** Distância entre uma letra e a vizinha, que é o que faz a onda correr. */
const PASSO_DA_QUEIMA = 0.075;
/**
 * A fumaça não chega a opaca.
 *
 * Ela é a mesma letra borrada por cima da linha de fogo, e em opacidade cheia
 * lê como segunda letra fora de foco, não como fumaça. Zerada no repouso, para
 * o texto parado não pagar camada nenhuma.
 */
const OPACIDADE_DA_FUMACA = 0.72;

type Props = {
  children: string;
  className?: string;
  /** Atrasa o acender, para escalonar linhas vizinhas. */
  delay?: number;
  /**
   * Troca a entrada pela queima: a letra fica parada e uma linha de fogo sobe
   * por dentro dela, deixando tinta abaixo e fumaça acima. Pedido do cliente
   * em 2026-09-10 para a seção de avaliações ficar mais fiel à referência.
   *
   * Continua opcional, e não padrão, porque **custa por letra**: são duas
   * camadas, uma máscara e seis sombras em cada uma, e a máscara é repintada a
   * cada quadro. Medido no navegador em 2026-09-11: 14 letras do título das
   * avaliações rodam a 60 quadros por segundo, e as 163 da seção de horários
   * derrubam para cerca de 40, com engasgos de até 167 ms. Nem a pluma nem o
   * desfoque explicam esse custo, testados um a um; é o repinte da máscara em
   * quase 500 elementos. Em corpo pequeno o gesto também lê pior, porque a
   * fumaça vira borrão sujo em vez de fumaça. Bloco inteiro usa o `Queima`,
   * que é irmão deste.
   */
  queima?: boolean;
};

export function TextoQueAcende({ children, className, delay = 0, queima = false }: Props) {
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

      const brasa = corDeMarca("--color-brasa", "#cf2434");
      /*
       * O brilho da queima é carvão, e não brasa, a pedido do cliente em
       * 2026-09-11: nas avaliações o halo vermelho brigava com a foto atrás do
       * véu. Em carvão ele vira sombra, que dá borda à letra branca sobre o
       * céu claro da foto e lê como fumaça escura sobre o branco da página, na
       * seção de horários. Quem continua nascendo na brasa é a entrada de
       * sempre, o modo sem `queima`.
       */
      const carvao = corDeMarca("--color-carvao", "#241e1f");
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

      const tintas = Array.from(el.querySelectorAll<HTMLElement>("[data-tinta]"));
      const fumacas = Array.from(el.querySelectorAll<HTMLElement>("[data-fumaca]"));

      /*
       * As máscaras são escritas por aqui, e nunca na marcação. Máscara é o
       * que esconde o glifo, então ela só pode existir onde há quem a mova:
       * escrita na JSX, ela deixaria o texto invisível para sempre em quem
       * carregasse a página sem o GSAP.
       */
      const vestirMascaras = () => {
        const tinta = mascaraDaQueima("tinta");
        const fumaca = mascaraDaQueima("fumaca");
        gsap.set(tintas, { maskImage: tinta, webkitMaskImage: tinta });
        gsap.set(fumacas, {
          maskImage: fumaca, webkitMaskImage: fumaca, opacity: OPACIDADE_DA_FUMACA,
        });
        // A pluma entra junto e não é animada: ela lê a mesma linha de fogo
        // que a máscara, e quem a recalcula a cada quadro é o navegador. A
        // sombra herda para as duas camadas, então cada uma pinta a sua parte
        // da pluma com a própria máscara aplicada.
        //
        // O índice da letra entra como semente para cada pluma escorar para um
        // lado diferente. Sem isso as catorze saem idênticas e a palavra lê
        // como padrão carimbado, não como fumaça.
        gsap.set(letras, {
          ...contasDaQueima(),
          textShadow: (i: number) => plumaDeFumaca(carvao, i),
        });
      };

      // Passado o fogo, não sobra nada para mascarar: a letra parada volta a
      // ser texto puro, e a fumaça sai da frente.
      const despirMascaras = () => {
        gsap.set([...tintas, ...fumacas], { clearProps: "maskImage,webkitMaskImage" });
        gsap.set(fumacas, { opacity: 0 });
        // A pluma já chega apagada pelo avanço, mas sai de vez: letra parada
        // não carrega quatro sombras para pintar nada.
        gsap.set(letras, { textShadow: "none" });
      };

      const queimar = () => {
        vestirMascaras();
        gsap.fromTo(
          letras,
          {
            [VARIAVEL_DA_LINHA]: LINHA_INICIAL,
            // Desfaz o estado de fumaça em que a saída deixou a letra. Sem
            // isto ela voltaria borrada, deslocada e transparente.
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
          },
          {
            [VARIAVEL_DA_LINHA]: LINHA_FINAL,
            opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
            // A sombra não entra aqui de propósito: a pluma sobe sozinha,
            // pela linha de fogo que esta tween já move.
            duration: DURACAO_DA_QUEIMA, ease: "power1.inOut",
            stagger: PASSO_DA_QUEIMA, delay,
            overwrite: true, onComplete: despirMascaras,
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

      const entrar = queima ? queimar : acender;

      /*
       * Nasce escondido quando ainda está abaixo da janela.
       *
       * Sem isto o texto sobe a tela em opacidade cheia, aparece de verdade
       * por volta de cem pixels de rolagem, e só então salta para escondido
       * quando o gatilho pega. Quem já está à vista não é tocado: apagar na
       * frente de quem está lendo é pior que a piscada.
       */
      if (queima && escondeNaMontagem(el.getBoundingClientRect().top, window.innerHeight)) {
        vestirMascaras();
        gsap.set(letras, { [VARIAVEL_DA_LINHA]: LINHA_INICIAL });
      }

      const gatilho = ScrollTrigger.create({
        trigger: el,
        start: queima ? "top 86%" : "top 92%",
        // Sem `end` o gatilho valeria até o fim da página e a fumaça nunca
        // aconteceria. Mesmo motivo do `saida` do Reveal.
        end: "bottom top",
        onEnter: entrar,
        onEnterBack: entrar,
        onLeave: esfumacar,
        onLeaveBack: esfumacar,
      });
      matar = () => { gsap.killTweensOf(letras); gatilho.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay, queima]);

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
                <span
                  key={l}
                  data-letra=""
                  className={queima ? "relative inline-block" : "inline-block"}
                >
                  {queima ? (
                    <>
                      <span data-tinta="" className="inline-block">{letra}</span>
                      {/* A mesma letra por cima, borrada, é a fumaça. Fica
                          absoluta para não medir nada no layout, e o borrão
                          vai em `em` para acompanhar o corpo do texto.

                          A cor saiu do branco herdado e foi para o lado do
                          carvão em 2026-09-11, a pedido do cliente, mas parou
                          no `creme-texto`: carvão puro some, porque o véu da
                          seção também é carvão e escuro sobre escuro não
                          aparece. Medido no navegador, com carvão o título
                          sumia no começo da queima. Este cinza quente é o mais
                          escuro que ainda lê como fumaça sobre o véu. */}
                      <span
                        data-fumaca=""
                        className="absolute inset-0 text-creme-texto opacity-0 blur-[0.07em]"
                      >
                        {letra}
                      </span>
                    </>
                  ) : (
                    letra
                  )}
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

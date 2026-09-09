"use client";

import { useEffect, useRef } from "react";
import { Mascote } from "@/components/ui/Chama";

export type Parada = { id: string; bairro: string };

/** Posição de cada parada ao longo da seção. */
const POSICOES = [
  "top-[3%] left-[2%]", "top-[23%] right-[3%]", "top-[43%] left-[6%]",
  "top-[63%] right-[5%]", "top-[81%] left-[3%]",
];

export function RotaMascote({ paradas }: { paradas: Parada[] }) {
  const secao = useRef<HTMLDivElement>(null);
  const mascote = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const alvo = mascote.current;
    const wrap = secao.current;
    if (!alvo || !wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let vivo = true;
    let limpar: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { MotionPathPlugin } = await import("gsap/MotionPathPlugin");
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

      // Este objeto serve ao voo E ao desenho da linha de propósito: com scrub
      // diferente o mascote descolaria da ponta do tracejado.
      //
      // `start` e `end` não regulam só quando o voo acontece, regulam a que
      // ALTURA DA TELA o mascote fica enquanto acontece, e é esse o motivo dos
      // números serem estes. A rota desce o container inteiro enquanto o
      // container sobe pela janela, e as duas descidas quase se anulam: o
      // mascote não passeia pela tela, ele fica pendurado numa faixa estreita e
      // gingando de um lado para o outro. Onde essa faixa cai é o que a janela
      // do trilho escolhe. Com `top 90%` -> `bottom bottom` ela caía a 93/97%
      // da altura da janela, ou seja, raspando a borda de baixo.
      //
      // Estes dois põem a faixa em 46/59% da altura da janela, que é onde o
      // cliente a quis: abaixo do meio, sem chegar perto da borda de baixo.
      // A conta dos extremos:
      //   y_tela(0) = 0,51·vh + H·40/1900     y_tela(1) = 0,61·vh - H·40/1900
      // Os 40 são o quanto o path recua da borda do viewBox de 1900, e é por
      // causa desse termo que os números aqui não são os 46/59 da faixa: eles
      // correm por fora, e o recuo do path aperta a faixa por dentro. Some-se
      // que a rota ondula, então a faixa real se mede no navegador, rolando o
      // trilho em dez posições, e não só pelos dois extremos acima.
      //
      // Somar a mesma quantia aos dois desce a faixa inteira sem deformá-la, e
      // é assim que se atende um pedido de "um pouco mais para baixo". Quem
      // governa a ABERTURA da faixa é a diferença entre eles, hoje 10 pontos.
      //
      // A distância de rolagem é H - 0,10·vh, ou seja, depende só dessa
      // diferença: mexer nos dois juntos não altera a velocidade. Quem manda
      // nela é o `scrub`, o tempo que o voo leva para alcançar o scroll, e
      // maior faz ele deslizar atrás do dedo em vez de colar nele.
      const trilho = { trigger: wrap, start: "top 51%", end: "bottom 61%", scrub: 2.5 } as const;

      // autoRotate faz o mascote inclinar acompanhando a tangente da curva
      const voo = gsap.to(alvo, {
        motionPath: {
          path: "#rota-entrega", align: "#rota-entrega",
          alignOrigin: [0.5, 0.5], autoRotate: 90,
        },
        ease: "none", scrollTrigger: trilho,
      });

      const linha = wrap.querySelector<SVGPathElement>("#rota-entrega");
      const desenho = linha
        ? gsap.fromTo(linha,
            { strokeDashoffset: linha.getTotalLength() },
            { strokeDashoffset: 0, ease: "none", scrollTrigger: trilho })
        : null;

      limpar = () => {
        voo.scrollTrigger?.kill(); voo.kill();
        desenho?.scrollTrigger?.kill(); desenho?.kill();
      };
    })();

    return () => { vivo = false; limpar?.(); };
  }, []);

  return (
    <div ref={secao} className="relative mt-5 h-[1250px] md:h-[1500px] lg:h-[1900px]">
      <svg
        viewBox="0 0 1200 1900" preserveAspectRatio="none" aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <path
          id="rota-entrega" fill="none" stroke="#241e1f" strokeWidth="5"
          strokeDasharray="26 26" strokeLinecap="round"
          d="M120 40 C 620 140, 1080 220, 1040 460 C 1000 700, 260 620, 220 860 C 180 1100, 1020 1000, 1000 1250 C 980 1500, 260 1380, 200 1620 C 170 1740, 400 1830, 660 1860"
        />
      </svg>

      <Mascote
        ref={mascote}
        sobreVermelho
        // Posição padrão: início da rota ("M120 40" no viewBox 1200×1900 —
        // ~8%/2%), de onde o GSAP MotionPath assume o controle via scrub.
        // Sob prefers-reduced-motion o efeito acima nunca monta (early
        // return), então sem o par motion-reduce: abaixo o mascote ficaria
        // parado no início da rota — o spec (§8) pede que ele repouse no
        // FIM. ~55%/98% é o ponto final do path ("660 1860"), convertido em
        // porcentagem do viewBox; -translate-1/2 centraliza o ícone sobre o
        // ponto, reproduzindo o alignOrigin:[0.5,0.5] do MotionPath.
        className="absolute left-[8%] top-[2%] z-[4] h-16 w-16 motion-reduce:left-[55%] motion-reduce:top-[98%] motion-reduce:-translate-x-1/2 motion-reduce:-translate-y-1/2 md:h-[72px] md:w-[72px] lg:h-24 lg:w-24"
      />

      {paradas.map((p, i) => (
        <div key={p.id} data-parada={p.id}
             className={`absolute z-[3] w-[158px] md:w-[190px] lg:w-[250px] ${POSICOES[i] ?? ""}`}>
          {/* Fonte de corpo, e não display: nome de bairro não se reescreve, e
              a Owners TRIAL não tem letra acentuada. A lista de hoje calha de
              não ter acento nenhum, mas ela muda a pedido do cliente e já
              teve "Japuíba"; trocar para display aqui só adia o problema. */}
          <span className="relative z-[2] -mb-3 inline-block -rotate-3 rounded-lg border-[3px] border-branco bg-carvao px-4 py-1.5 text-base font-extrabold uppercase tracking-wide">
            {p.bairro}
          </span>
          <span className="block overflow-hidden rounded-[20px] border-[3px] border-branco bg-brasa-funda shadow-[0_22px_50px_rgba(0,0,0,.6)]">
            {/* foto da parada entra quando o cliente enviar (§10.2 do spec) */}
            <span className="block aspect-[4/3.4]" />
          </span>
        </div>
      ))}
    </div>
  );
}

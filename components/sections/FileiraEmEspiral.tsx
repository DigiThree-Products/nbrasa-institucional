"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { transformacaoDoCard } from "@/lib/espiral";

/**
 * O palco da espiral do Cardápio.
 *
 * Ele embrulha o cabeçalho e a fileira, e é ele que o ScrollTrigger prende. A
 * matemática mora em `lib/espiral.ts`; aqui só se mede, se prende e se escreve
 * `transform`.
 *
 * ── Por que matchMedia do GSAP, e não saída antecipada ──────────────────────
 * `Reveal` e `RotaMascote` decidem uma vez, na montagem, com
 * `window.matchMedia(...).matches`. Serve para eles, que não mudam de
 * comportamento com o tamanho da janela. Aqui não serviria: quem começa em
 * 1400px e reduz para 900 ficaria com um palco preso e 300vh de cena num
 * layout de coluna única, e quem faz o caminho inverso não ganharia a cena. O
 * `matchMedia` do GSAP cria e destrói o gatilho nas duas travessias, e a mesma
 * consulta cobre `prefers-reduced-motion`, que também é reativo.
 *
 * ── Quem cria as três telas de rolagem ──────────────────────────────────────
 * O espaçador do próprio ScrollTrigger, por causa do `end: "+=300%"`, e não
 * uma altura declarada no CSS. A diferença é o que faz a degradação sair de
 * graça: sem JavaScript, ou com menos movimento pedido, o gatilho nunca é
 * criado, e aí não existe palco preso nem 300vh de vazio. Uma altura de 300vh
 * no CSS deixaria três telas em branco justamente para quem pediu menos
 * movimento.
 */
export function FileiraEmEspiral({
  cabecalho,
  children,
}: {
  cabecalho: ReactNode;
  children: ReactNode;
}) {
  const palco = useRef<HTMLDivElement>(null);
  const fileira = useRef<HTMLDivElement>(null);

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
          let medidas: { deslocamento: number; largura: number; altura: number }[] = [];

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
            const caixa = alvoFileira.getBoundingClientRect();
            const centro = caixa.left + caixa.width / 2;
            medidas = cards.map((card) => {
              const r = card.getBoundingClientRect();
              return {
                deslocamento: r.left + r.width / 2 - centro,
                largura: r.width,
                altura: r.height,
              };
            });
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
              card.style.transform =
                `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, ${t.z.toFixed(2)}px) ` +
                `rotateY(${graus.toFixed(2)}deg)`;
            });
          };

          medir();

          const gatilho = ScrollTrigger.create({
            trigger: alvoPalco,
            start: "top top",
            end: "+=300%",
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: () => medir(),
            onUpdate: (self) => pinta(self.progress),
          });

          pinta(0);

          // Devolve os cards ao estado limpo quando a consulta deixa de valer.
          // Sem isto, encolher a janela para o mobile deixaria seis cards
          // congelados no meio da hélice.
          return () => {
            gatilho.kill();
            cards.forEach((card) => {
              card.style.transform = "";
            });
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
    <div ref={palco} className="lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col justify-center px-6 py-20 lg:h-full lg:py-10">
        {cabecalho}
        {/* A perspectiva mora aqui, no pai dos cards, que é o que dá
            profundidade a eles. Sem ela o `translate3d` em z não muda nada. */}
        <div
          ref={fileira}
          className="grid grid-cols-1 gap-[18px] lg:grid-cols-6 lg:[perspective:1400px]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

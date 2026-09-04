/**
 * Parede de tipos do material de delivery, em marquee.
 *
 * Server Component e CSS puro: um marquee é movimento decorativo e não vale
 * um byte de JavaScript no orçamento. A animação e a pausa sob
 * `prefers-reduced-motion` vivem em `app/globals.css`, presas à classe
 * `.parede-tipos`, renomear aqui sem mexer lá para o efeito em silêncio.
 *
 * A faixa é renderizada duas vezes de propósito. O keyframe desloca 50% e
 * volta a zero: com uma cópia só, o retorno pisca; com duas, o ponto de
 * emenda cai fora da tela e o laço fica invisível.
 */

const PALAVRAS = ["FIRE", "N’BRASA", "VAI N’BRASANDO"];

/** Repetido o bastante para encher a faixa mais larga sem vão no fim. */
const VEZES = 4;

function Faixa() {
  return (
    <span data-faixa className="flex flex-none items-center gap-8 pr-8">
      {Array.from({ length: VEZES }).flatMap((_, volta) =>
        PALAVRAS.map((p, i) => (
          <span
            key={`${volta}-${p}`}
            className={i % 2 === 0 ? "-rotate-2" : "rotate-1"}
          >
            {p}
          </span>
        )),
      )}
    </span>
  );
}

export function ParedeDeTipos({
  className = "",
  corTexto = "text-carvao",
}: {
  className?: string;
  corTexto?: string;
}) {
  return (
    <div aria-hidden="true" className={`parede-tipos ${className}`}>
      <div
        className={`flex w-max font-display text-[clamp(2.4rem,7vw,5rem)] uppercase leading-none ${corTexto}`}
      >
        <Faixa />
        <Faixa />
      </div>
    </div>
  );
}

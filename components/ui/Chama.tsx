import { forwardRef } from "react";
import { D_CHAMA_OFICIAL, D_SILHUETA, VIEWBOX_OFICIAL } from "@/lib/marca";

/**
 * Ícone da marca: a chama do vetor oficial, em três pinceladas.
 *
 * A proporção é 468×684, bem mais alta que larga: quem chama precisa passar
 * altura e largura coerentes (`PROPORCAO_OFICIAL` em lib/marca.ts faz a
 * conta), senão o SVG encolhe para caber e sobra vão dos dois lados.
 */
export function Chama({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={VIEWBOX_OFICIAL} className={className} aria-hidden="true">
      {D_CHAMA_OFICIAL.map((d) => (
        <path key={d.slice(0, 24)} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}

/**
 * Mascote da marca: chama com óculos escuros. Ver moodboard, página 5.
 *
 * Desenhado sobre `D_SILHUETA`, e não sobre a chama oficial, porque óculos e
 * boca precisam de um corpo sólido onde encostar. O mascote de verdade está
 * em `mascote.cdr`, que nenhuma ferramenta local abre; ver README.
 *
 * `sobreVermelho` existe porque o preenchimento padrão é o próprio vermelho
 * de marca: dentro da Delivery ele sumiria no fundo e sobraria só o contorno.
 * Em carvão, o corpo faz 3,09:1 contra o fundo, o bastante para um grafismo
 * deste tamanho.
 */
export const Mascote = forwardRef<
  SVGSVGElement,
  { className?: string; sobreVermelho?: boolean }
>(function Mascote({ className = "", sobreVermelho = false }, ref) {
  const corpo = sobreVermelho ? "#241e1f" : "#cf2434";
  const traco = sobreVermelho ? "#ffffff" : "#241e1f";
  return (
    <svg ref={ref} viewBox="0 0 100 116" className={className} aria-hidden="true">
      <path d={D_SILHUETA} fill={corpo} stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
      <path d="M22 66h56" stroke={traco} strokeWidth="5" strokeLinecap="round" />
      <rect x="21" y="59" width="24" height="17" rx="7" fill={traco} />
      <rect x="55" y="59" width="24" height="17" rx="7" fill={traco} />
      <path d="M40 90c4 5 16 5 20 0" stroke={traco} strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
});

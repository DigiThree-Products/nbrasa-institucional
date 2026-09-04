import { forwardRef } from "react";
import { D_CHAMA } from "@/lib/marca";

export function Chama({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 116" className={className} aria-hidden="true">
      <path d={D_CHAMA} fill="currentColor" />
    </svg>
  );
}

/** Mascote da marca: chama com óculos escuros. Ver moodboard, página 5. */
export const Mascote = forwardRef<SVGSVGElement, { className?: string }>(
  function Mascote({ className = "" }, ref) {
    return (
      <svg ref={ref} viewBox="0 0 100 116" className={className} aria-hidden="true">
        <path d={D_CHAMA} fill="#cf2434" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
        <path d="M22 66h56" stroke="#241e1f" strokeWidth="5" strokeLinecap="round" />
        <rect x="21" y="59" width="24" height="17" rx="7" fill="#241e1f" />
        <rect x="55" y="59" width="24" height="17" rx="7" fill="#241e1f" />
        <path d="M40 90c4 5 16 5 20 0" stroke="#241e1f" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    );
  },
);

import { forwardRef } from "react";

const D_CHAMA =
  "M50 3C43 20 34 25 32 39c-1 8 2 12 2 18-12-6-16-17-16-17C9 52 6 63 6 74c0 22 20 39 44 39s44-17 44-39c0-19-11-33-19-43C68 22 58 14 50 3Z";

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

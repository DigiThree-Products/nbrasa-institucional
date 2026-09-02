/** Divisória orgânica entre blocos de cor. corDestino é a cor da seção de baixo. */
export function DivisoriaCurva({ corDestino }: { corDestino: string }) {
  return (
    <svg
      viewBox="0 0 1536 300" preserveAspectRatio="none" aria-hidden="true"
      className="-mb-px block h-[clamp(60px,8vw,140px)] w-full"
    >
      <path
        fill={corDestino}
        d="M1536,300 H0 V135 S184,65 461,155 S860,105 1121,137 S1413,105 1536,105 V300"
      />
    </svg>
  );
}

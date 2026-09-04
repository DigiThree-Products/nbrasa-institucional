type Props = {
  /** Cor da seção de baixo, a que a curva preenche. */
  corDestino: string;
  /**
   * Cor da seção de cima. Só é necessária quando a faixa acima não é o fundo
   * do body: saindo da Delivery, o SVG precisa carregar o carvão dela, senão
   * a metade de cima da curva vira o branco da página e sobra um degrau reto.
   */
  corOrigem?: string;
  className?: string;
};

/** Divisória orgânica entre blocos de cor. corDestino é a cor da seção de baixo. */
export function DivisoriaCurva({ corDestino, corOrigem, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 1536 300" preserveAspectRatio="none" aria-hidden="true"
      className={`-mb-px block h-[clamp(60px,8vw,140px)] w-full ${className}`}
      style={corOrigem ? { background: corOrigem } : undefined}
    >
      <path
        fill={corDestino}
        d="M1536,300 H0 V135 S184,65 461,155 S860,105 1121,137 S1413,105 1536,105 V300"
      />
    </svg>
  );
}

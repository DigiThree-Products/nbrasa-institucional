/**
 * O véu de carvão que deita sobre a foto do card do Cardápio.
 *
 * Ele existe porque o card deixou de ser creme chapado e passou a ser
 * fotografia sangrando nos quatro lados, com o kicker e o nome escritos por
 * cima. Isso cria a única superfície do site cujo fundo ninguém consegue
 * medir: por baixo do texto há foto, e foto muda de pixel para pixel. Um
 * chantili branco, o gelo de um drink, o reflexo numa taça, qualquer um deles
 * aparece embaixo de uma letra branca e apaga a letra.
 *
 * ── Por que uma rampa com platô, e não um degradê simples ──────────────────
 * O degradê de duas pontas, cheio na base e nulo no topo, cai rápido demais:
 * na altura em que o kicker vive ele já perdeu metade da força, e o par
 * reprova. O platô mantém o véu praticamente cheio na faixa de baixo, onde o
 * texto mora, e só começa a desbotar acima dela. O que se vê é a foto inteira
 * no alto do card e o texto assentado num pé escuro.
 *
 * ── O que se pode afirmar, e o que não se pode ─────────────────────────────
 * Não dá para medir contraste contra uma foto. Dá para medir contra o PIOR
 * caso dela: uma foto branca por baixo. `sobrepor` compõe o carvão do véu
 * sobre esse branco na opacidade que o texto encontra, e o resultado é um par
 * de cores comum, que `contraste.test.ts` mede como mede qualquer outro. É
 * assim que "texto sobre foto" vira número.
 *
 * ── O que erra calado aqui ─────────────────────────────────────────────────
 * `TETO_DO_TEXTO`. Se o corpo do nome crescer, ou o recuo do card diminuir, o
 * bloco de texto sobe, encontra véu mais fraco e ninguém é avisado: a letra
 * continua lá, só fica mais difícil de ler, e só sobre algumas fotos. Por isso
 * o teto é declarado com folga larga sobre a medida real e tem teste.
 */

/**
 * A rampa, em fração da altura do card medida DA BASE.
 *
 * `naBase` é a opacidade rente ao rodapé do card, `noPlato` é a do topo da
 * faixa protegida, e daí para cima o véu desbota até sumir na borda de cima.
 * Os dois primeiros são altos de propósito: é a diferença entre um pé escuro
 * de verdade e uma sujeira cinza sobre a comida.
 */
export const VEU = {
  naBase: 0.92,
  plato: 0.5,
  noPlato: 0.82,
} as const;

/**
 * Até onde o bloco de kicker mais nome pode subir, em fração da altura do card.
 *
 * Medido no card mais apertado que existe, o de 216x144 da faixa de 1024px a
 * 1279px: o kicker, o nome e o recuo de baixo somam 65px dos 144, ou seja
 * 0,45. O teto declarado é bem maior que isso porque a medida envelhece
 * sozinha, e porque a queda de legibilidade não lança erro nenhum.
 */
export const TETO_DO_TEXTO = 0.58;

/** Opacidade do véu numa altura qualquer do card, medida da base. */
export function opacidadeDoVeu(fracaoDaBase: number): number {
  const f = Math.min(1, Math.max(0, fracaoDaBase));
  if (f <= VEU.plato) {
    return VEU.naBase + (VEU.noPlato - VEU.naBase) * (f / VEU.plato);
  }
  return VEU.noPlato * (1 - (f - VEU.plato) / (1 - VEU.plato));
}

/** Lê um hex de três ou seis dígitos como uma tripla de canais. */
function canais(hex: string): [number, number, number] {
  const limpo = hex.replace("#", "");
  const cheio =
    limpo.length === 3
      ? limpo
          .split("")
          .map((c) => c + c)
          .join("")
      : limpo;
  return [
    parseInt(cheio.slice(0, 2), 16),
    parseInt(cheio.slice(2, 4), 16),
    parseInt(cheio.slice(4, 6), 16),
  ];
}

/**
 * Compõe `tinta` sobre `fundo` com opacidade `alfa` e devolve o hex do
 * resultado, que é o que o olho enxerga e o que o cálculo de contraste pede.
 */
export function sobrepor(tinta: string, fundo: string, alfa: number): string {
  const a = Math.min(1, Math.max(0, alfa));
  const [tr, tg, tb] = canais(tinta);
  const [fr, fg, fb] = canais(fundo);
  const mistura = (t: number, f: number) =>
    Math.round(t * a + f * (1 - a))
      .toString(16)
      .padStart(2, "0");
  return `#${mistura(tr, fr)}${mistura(tg, fg)}${mistura(tb, fb)}`;
}

/**
 * Monta o degradê do véu para o `background-image` da frente do card.
 *
 * A cor sai do token de marca, e não de um hex cru, pelo mesmo motivo do papel
 * do texto: é o mesmo carvão que `contraste.test.ts` usa ao medir o par, e um
 * literal aqui sairia de sincronia no dia em que o token mudar.
 *
 * O último ponto é o carvão a zero por cento, e não a palavra `transparent`
 * sozinha. `transparent` é preto transparente, e onde o motor interpola sem
 * premultiplicar o miolo da rampa acinzenta sobre a foto. Misturar o próprio
 * carvão a zero mantém a cor da rampa inteira.
 */
export function veuDaFoto(): string {
  const emCarvao = (porcento: number) =>
    `color-mix(in srgb, var(--color-carvao) ${porcento}%, transparent)`;
  return [
    "linear-gradient(to top,",
    `${emCarvao(Math.round(VEU.naBase * 100))} 0%,`,
    `${emCarvao(Math.round(VEU.noPlato * 100))} ${VEU.plato * 100}%,`,
    `${emCarvao(0)} 100%)`,
  ].join(" ");
}

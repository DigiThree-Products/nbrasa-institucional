import { D_CHAMA, EIXO_CHAMA } from "./marca";

/** Onde a chama encosta na foto: na borda esquerda (desktop) ou no topo (mobile). */
export type Costura = "borda" | "topo";

/**
 * Os únicos números que governam a forma da costura no herói.
 *
 * Estão todos aqui de propósito: o componente e o CSS apenas consomem estes
 * valores como custom properties, então ajustar o desenho depois é editar
 * este bloco, não caçar número solto em JSX nem em folha de estilo.
 */
export const AJUSTES = {
  /**
   * Altura da chama em relação à altura do herói.
   *
   * Precisa passar de `1`. Em `1` a chama cabe justa e as duas pontas ficam
   * dentro do quadro: acima do bico e abaixo da base não há curva nenhuma, e
   * a borda cai na linha reta do eixo, no rodapé, onde a base é larga e
   * redonda, isso vira um degrau visível. Transbordando um pouco, a curva
   * entra por cima e sai por baixo, contínua de ponta a ponta.
   *
   * `1.15` (atual) é o mínimo confortável: mantém a proporção da logo, com o
   * entalhe no tamanho em que ele lê como lambida.
   *
   * Perto de `1.8` a chama fica bem maior e o entalhe cresce junto, a ponto
   * de virar uma cunha solta, aí ele precisa ser cortado pela borda de cima
   * (`altura: "91%"`). Acima de ~`2.2` o entalhe sai do quadro e a borda vira
   * uma curva lisa: elegante, mas deixa de ler como chama.
   */
  escala: 1.15,

  /**
   * Posição vertical da chama, em porcentagem de `mask-position`.
   *
   * Distribui a sobra criada por `escala` entre cima e baixo. `50%` (atual)
   * divide igual, então bico e base transbordam na mesma medida.
   * `0%` alinha o topo da chama ao topo do herói, o que traz de volta o
   * trecho reto lá em cima; `100%` faz o mesmo no rodapé.
   */
  altura: "50%",

  /**
   * Onde a coluna da foto começa, na prática, onde fica a barriga da chama,
   * porque a máscara alinha a chama pela esquerda do contêiner.
   * Menor = mordida mais funda no texto. Abaixo de ~40% a curva encosta no
   * fim das linhas do parágrafo e atrapalha a leitura.
   */
  inicioDaFoto: "50%",

  /**
   * Recorte da foto dentro do quadro (`object-position`). Sobe/desce e
   * anda para os lados sem regerar arquivo: útil para manter o letreiro
   * dentro da parte que a chama deixa visível.
   */
  recorteDaFoto: "58% 50%",

  /** Mobile: a mesma chama, de pé, saindo do topo da foto em direção ao texto. */
  mobile: {
    /**
     * Tamanho do quadro da máscara em relação à largura da foto. A chama
     * ocupa uma fração fixa desse quadro, então maior = chama maior e pico
     * mais alto. Abaixo de ~2 o pico some; acima de ~4 ele engole a foto.
     */
    escala: 2.9,
    /** Posição horizontal do bico. `50%` centraliza. */
    lado: "50%",
    /** Posição vertical. `0%` encosta o bico no topo da foto, que é onde ele
     *  avança sobre o texto; subir o valor afunda o pico. */
    altura: "0%",
  },
} as const;

/** Sobra além da chama, no eixo em que a foto continua. Só precisa ser grande
 *  o bastante para a máscara cobrir a foto inteira depois de escalada. */
const SOBRA = 600;

const ALTURA_CHAMA = 116;
const LARGURA_CHAMA = 100;
/**
 * Altura em que a chama de pé é mais larga, onde o preenchimento encosta
 * nela, no mobile.
 *
 * Não use a cintura (58, a meia altura): ali o contorno ainda desce
 * inclinado, e a união com o retângulo termina num fiapo solto, com a lambida
 * da lateral morrendo no ar acima da reta. Na parte mais larga a tangente é
 * vertical e a curva encosta na reta sem quebra.
 */
const APOIO_CHAMA = 78;

export function mascaraChama(onde: Costura): string {
  // O quadro sobra nos dois eixos em que a foto continua. Ele precisa cobrir
  // a foto inteira depois de escalado, um quadro do tamanho da chama deixaria
  // as laterais sem máscara, e ali a foto simplesmente sumiria.
  const [w, h] = onde === "borda" ? [SOBRA, ALTURA_CHAMA] : [SOBRA, SOBRA];

  // No topo a chama fica no meio do quadro; na borda, encostada à esquerda.
  const desloca = onde === "borda" ? 0 : (SOBRA - LARGURA_CHAMA) / 2;

  // Opaco = foto aparece. A união da chama com o retângulo é a região visível:
  // por isso a borda da foto é a curva da chama, e do eixo dela em diante a
  // foto segue inteira até sangrar na tela.
  const preenche =
    onde === "borda"
      ? `<rect x='${EIXO_CHAMA}' y='0' width='${SOBRA - EIXO_CHAMA}' height='${ALTURA_CHAMA}' fill='black'/>`
      : `<rect x='0' y='${APOIO_CHAMA}' width='${SOBRA}' height='${SOBRA - APOIO_CHAMA}' fill='black'/>`;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<g transform='translate(${desloca},0)'><path d='${D_CHAMA}' fill='black'/></g>` +
    preenche +
    `</svg>`;

  // encodeURIComponent não é enfeite: `<` e aspas crus fazem o Chrome
  // descartar a declaração de CSS inteira, em silêncio.
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

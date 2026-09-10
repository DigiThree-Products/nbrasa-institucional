import { D_SILHUETA, EIXO_SILHUETA } from "./marca";

/**
 * Onde a chama encosta no que ela recorta.
 *
 * `borda` e `topo` são o herói: a foto fica à direita (ou abaixo) e a chama
 * morde a beirada dela. São os dois únicos consumidores.
 *
 * Houve uma terceira, `reserva`, que desenhava o papel branco atrás do texto
 * do Cardápio. Ela saiu em 2026-09-10: a pedido do cliente o papel passou a
 * ser colado em cada letra, uma auréola de sombras, e não há mais bloco a
 * recortar. Ver `lib/papelDoTexto.ts`.
 */
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
   * Distribui a sobra criada por `escala` entre cima e baixo. `50%` dividia
   * igual, e era isso que deixava um canto no rodapé: a base da silhueta
   * (y=113 no viewBox) caía 40,7px ABAIXO da dobra, então o `overflow-hidden`
   * do herói cortava a curva enquanto ela ainda descia, e ela encontrava a
   * borda inferior a uns 25°. Numa janela de 1440x900 o bico ficava visível
   * por volta de x=975.
   *
   * `80%` pousa essa base exatamente na dobra. Ali a tangente da silhueta já
   * é horizontal, então a curva funde com o sangramento de baixo sem canto
   * nenhum. O bico segue escondido acima do herói (page y=-81,4), que é o que
   * `escala` > 1 garante, então nada de novo aparece no topo.
   *
   * O valor depende de `escala` e precisa ser recalculado junto com ele:
   *
   *     altura = (113 * escala / 116 - 1) / (escala - 1)
   *
   * Em `1.15` isso dá 0,8017. A altura do herói se cancela na conta, então a
   * mesma porcentagem vale em qualquer janela.
   *
   * Para referência: `0%` alinha o topo da chama ao topo do herói e traz de
   * volta o trecho reto lá em cima; `100%` sobe a base para dentro do quadro
   * e devolve o degrau que o `escala` foi criado para esconder.
   */
  altura: "80%",

  /**
   * Onde a coluna da foto começa, na prática, onde fica a barriga da chama,
   * porque a máscara alinha a chama pela esquerda do contêiner.
   * Menor = mais foto à vista e mordida mais funda no texto. Abaixo de ~40% a
   * curva encosta no fim das linhas do parágrafo e atrapalha a leitura.
   *
   * **Quem manda no piso é o header, e bem antes desses 40%.** Quatro lugares
   * leem este valor por `--costura-inicio`, e três deles são do header: a
   * largura de `.cabecalho-conteudo`, a largura do retângulo branco (`::before`)
   * e a divisa onde começa a metade mascarada (`::after`), todos em
   * app/globals.css. A divisa é obrigatória, não conveniência: a metade
   * mascarada alinha a chama pela própria borda esquerda, então essa borda tem
   * que cair exatamente onde a foto começa.
   *
   * A conta do piso: o conteúdo do header precisa de 657px (logo 115, os
   * quatro links 453, mais o vão de 20 e os recuos de 24), e a área clara
   * disponível é `inicio * largura + 6dvh` MENOS `(100vw - 1280px) / 2`, o
   * recuo esquerdo que a logo divide com o herói. O pior caso é a janela larga
   * e baixa, porque a largura entra dividida por dois no recuo e a altura
   * entra inteira nos 6dvh: em 1920x900 sobram 665px com `49%` e 684px com os
   * `50%` de antes. Ou seja, **o número já nascia a 27px do limite**, e é por
   * isso que aqui a mudança é de um ponto percentual: 19px de foto a mais em
   * 1920, e não mais que isso.
   *
   * Andar de verdade para a esquerda exige decidir o header antes, e são dois
   * caminhos, os dois visíveis: soltar o recuo esquerdo da logo no estado do
   * herói, que hoje existe para ela não pular quando a barra se estende e para
   * alinhar com a primeira linha do título, ou subir de 1280px a faixa em que
   * a navegação vira hambúrguer, o que tira os quatro links de telas onde eles
   * cabem hoje.
   */
  inicioDaFoto: "49%",

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

const ALTURA_SILHUETA = 116;
const LARGURA_SILHUETA = 100;

/** Sobra além da chama, no eixo em que a foto continua. Só precisa ser grande
 *  o bastante para a máscara cobrir a foto inteira depois de escalada. */
const SOBRA = 600;
/**
 * Altura em que a chama de pé é mais larga, onde o preenchimento encosta
 * nela, no mobile.
 *
 * Não use a cintura (58, a meia altura): ali o contorno ainda desce
 * inclinado, e a união com o retângulo termina num fiapo solto, com a lambida
 * da lateral morrendo no ar acima da reta.
 *
 * `74` sai do path, e não do olho: os dois segmentos que fecham o bojo chegam
 * em (6,74) e (94,74) com a derivada horizontal zerada, ou seja, tangente
 * vertical. É o ponto mais largo da silhueta. Estava em `78`, quatro unidades
 * abaixo dele, onde a curva já voltava para dentro: a chama sobrava 0,2
 * unidade para fora do canto e retornava, que é uma lambida invertida, um
 * vinco. Dá 0,4px num viewport de 375, invisível na prática, mas `78`
 * contradizia a justificativa escrita logo acima.
 *
 * O canto de 90° em si não sai daqui: topo horizontal do retângulo contra
 * tangente vertical da chama dá 90° em qualquer valor desta altura. Quem
 * resolve o ângulo é o filete, logo abaixo, que arredonda o encontro sem
 * mexer aqui.
 */
const APOIO_SILHUETA = 74;

type Ponto = readonly [number, number];
type Cubica = readonly [Ponto, Ponto, Ponto, Ponto];
/** Qual eixo da curva ler: 0 é x, 1 é y. */
type Eixo = 0 | 1;

/**
 * Os dois trechos de `D_SILHUETA` que descem até o ombro, um de cada lado,
 * com os pontos de controle em coordenadas absolutas.
 *
 * São cópias fiéis de dois comandos do path: `C9 52 6 63 6 74`, que leva de
 * (18,40) a (6,74) pela esquerda, e `c0-19-11-33-19-43`, que leva de (94,74)
 * a (75,31) pela direita e aparece aqui invertido, para os dois descerem no
 * mesmo sentido. `tests/unit/costura.test.ts` cobra os dois literais dentro
 * de `D_SILHUETA`: mexer no desenho da chama quebra o teste em vez de deixar
 * estes números envelhecerem calados.
 *
 * O filete depende deles porque é a tangente do contorno no ponto de encontro
 * que define o controle da quadrática. Arredondar sem ela daria uma curva que
 * chega torta no ombro, o que é pior que o canto reto.
 */
const OMBRO_ESQUERDO: Cubica = [[18, 40], [9, 52], [6, 63], [6, 74]];
const OMBRO_DIREITO: Cubica = [[75, 31], [83, 41], [94, 55], [94, 74]];

function naCubica(c: Cubica, t: number, eixo: Eixo): number {
  const u = 1 - t;
  return (
    c[0][eixo] * u ** 3 +
    3 * c[1][eixo] * t * u ** 2 +
    3 * c[2][eixo] * t ** 2 * u +
    c[3][eixo] * t ** 3
  );
}

function tangenteDaCubica(c: Cubica, t: number, eixo: Eixo): number {
  const u = 1 - t;
  return (
    3 * u ** 2 * (c[1][eixo] - c[0][eixo]) +
    6 * u * t * (c[2][eixo] - c[1][eixo]) +
    3 * t ** 2 * (c[3][eixo] - c[2][eixo])
  );
}

/**
 * Onde a cúbica cruza uma altura, e com que inclinação `dx/dy`.
 *
 * Bissecção simples porque o `y` das duas curvas é monotônico, elas só
 * descem: não existe raiz ambígua para escolher.
 */
function cruzaEmY(c: Cubica, y: number): { x: number; inclinacao: number } {
  // Fora da faixa a bissecção converge para uma das pontas e devolve um ponto
  // que não é o pedido, sem reclamar. Silenciosamente errado é pior que
  // quebrado: o filete sairia torto e ninguém saberia por quê.
  if (y < c[0][1] || y > c[3][1]) {
    throw new Error(`altura ${y} fora do trecho (${c[0][1]} a ${c[3][1]})`);
  }

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2;
    if (naCubica(c, meio, 1) < y) lo = meio;
    else hi = meio;
  }
  const t = (lo + hi) / 2;
  return {
    x: naCubica(c, t, 0),
    inclinacao: tangenteDaCubica(c, t, 0) / tangenteDaCubica(c, t, 1),
  };
}

/**
 * Raio do filete que arredonda o encontro da chama com o preenchimento.
 *
 * A saída óbvia para o canto seria fazer o topo inteiro sair tangente da
 * chama, mais abaixo. Medido, não serve: as laterais são quase verticais e a
 * borda da foto está a 53 unidades do eixo, então ancorar em y=50 custaria
 * 93px de queda numa foto de 375px, e em y=57 custaria 132px. Sobrariam
 * cantos brancos enormes em cima.
 *
 * `20` (36px no mobile) arredonda só o canto e cobra essas mesmas 20 unidades
 * de altura, localizadas no ombro. Foi escolhido contra `10`, que corrige o
 * ângulo mas quase não se vê.
 *
 * O teto é `34`, e ele é duro, não estético: o ponto de encontro fica em
 * `APOIO_SILHUETA - RAIO_FILETE`, e os trechos de ombro só existem de y=40 a
 * y=74. Passar disso pede uma altura que a curva não tem, e `cruzaEmY` lança.
 */
const RAIO_FILETE = 20;

/**
 * Altura por onde o preenchimento atravessa de um ombro ao outro, por dentro
 * da chama.
 *
 * Atravessar reto na altura do encontro taparia a lambida, que fica entre
 * y=40 e y=57. Por dentro, o trecho some sob a própria chama e nunca aparece:
 * só precisa ficar abaixo do entalhe e acima da base.
 */
const MERGULHO_FILETE = 80;

/** Corta zeros à toa, para o data URI não carregar `259.88000000000002`. */
function curto(v: number): string {
  return Number(v.toFixed(2)).toString();
}

/**
 * Preenchimento do topo: o retângulo de sempre, com um filete em cada ombro.
 *
 * Cada filete é uma quadrática cujo ponto de controle fica no cruzamento da
 * reta `y = APOIO_SILHUETA` com a tangente do contorno no ponto de encontro.
 * Com o controle ali, a curva sai horizontal de um lado e chega exatamente na
 * inclinação da chama do outro, tangente nas duas pontas.
 */
function preenchimentoDoTopo(desloca: number): string {
  const base = APOIO_SILHUETA;
  const alto = base - RAIO_FILETE;
  const esq = cruzaEmY(OMBRO_ESQUERDO, alto);
  const dir = cruzaEmY(OMBRO_DIREITO, alto);

  const xEsq = esq.x + desloca;
  const xDir = dir.x + desloca;
  const controleEsq = xEsq + esq.inclinacao * RAIO_FILETE;
  const controleDir = xDir + dir.inclinacao * RAIO_FILETE;

  const d = [
    `M0 ${base}`,
    `L${curto(controleEsq - RAIO_FILETE)} ${base}`,
    `Q${curto(controleEsq)} ${base} ${curto(xEsq)} ${alto}`,
    `L${desloca + 20} ${MERGULHO_FILETE}`,
    `L${desloca + 80} ${MERGULHO_FILETE}`,
    `L${curto(xDir)} ${alto}`,
    `Q${curto(controleDir)} ${base} ${curto(controleDir + RAIO_FILETE)} ${base}`,
    `L${SOBRA} ${base}`,
    `L${SOBRA} ${SOBRA}`,
    `L0 ${SOBRA}`,
    "Z",
  ].join(" ");

  return `<path d='${d}' fill='black'/>`;
}

export function mascaraChama(onde: Costura): string {
  // O quadro sobra nos dois eixos em que a foto continua. Ele precisa cobrir
  // a foto inteira depois de escalado, um quadro do tamanho da chama deixaria
  // as laterais sem máscara, e ali a foto simplesmente sumiria.
  // O quadro da reserva é a chama e MAIS NADA: ali o corpo do papel é uma
  // segunda camada de máscara, escrita no CSS, e não um retângulo aqui dentro.
  //
  // A diferença não é de estilo. Com o retângulo dentro do mesmo SVG, o quadro
  // inteiro passa a ter a altura da chama, e `mask-size: auto <altura da
  // chama>` deixa o resto da caixa SEM máscara nenhuma, portanto transparente:
  // o papel some justamente embaixo do parágrafo. É o motivo de `AJUSTES.escala`
  // precisar passar de 1 no herói. Aqui a chama tem que ser MENOR que o papel,
  // senão a lambida engole o fim do título, então as duas coisas não cabem no
  // mesmo quadro e o corpo do papel vira camada própria.
  const [w, h] =
    onde === "topo" ? [SOBRA, SOBRA] : [SOBRA, ALTURA_SILHUETA];

  // No topo a chama fica no meio do quadro; na borda, encostada na esquerda.
  const desloca = onde === "topo" ? (SOBRA - LARGURA_SILHUETA) / 2 : 0;

  // Opaco = foto aparece. A união da chama com o retângulo é a região visível:
  // por isso a borda da foto é a curva da chama, e do eixo dela em diante a
  // foto segue inteira até sangrar na tela.
  const preenche =
    onde === "topo"
      ? preenchimentoDoTopo(desloca)
      : `<rect x='${EIXO_SILHUETA}' y='0' width='${SOBRA - EIXO_SILHUETA}' height='${ALTURA_SILHUETA}' fill='black'/>`;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<g transform='translate(${desloca},0)'><path d='${D_SILHUETA}' fill='black'/></g>` +
    preenche +
    `</svg>`;

  // encodeURIComponent não é enfeite: `<` e aspas crus fazem o Chrome
  // descartar a declaração de CSS inteira, em silêncio.
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

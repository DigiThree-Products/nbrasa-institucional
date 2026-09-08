/**
 * As labaredas que saem das letras do foco do herói.
 *
 * A referência é "Flame Typography Design", de Faiaj Akhter Chowdhury, no
 * Behance. O que faz aquela peça funcionar não é o desenho de nenhuma chama
 * isolada: é que **letra e fogo são um contorno fechado só**. Cada língua
 * nasce do topo de uma haste com a mesma espessura dela, e a emenda some.
 *
 * Isso só é possível numa fonte de haste larga e chata. Enquanto o foco esteve
 * numa manuscrita (Yellowtail, depois Kaushan Script), língua nascendo da
 * letra lia como cabelo, e o máximo que dava para fazer era chama flutuando ao
 * lado da palavra, que não é o efeito pedido. Com o foco na **Owners XNarrow
 * Black**, a display da própria marca, a haste vira um retângulo de topo
 * chato e a fusão acontece sozinha.
 *
 * O que NÃO se copia da referência, e é decisão de marca:
 *
 * - o degradê de carmim para ouro, porque a paleta é fechada em carvão, brasa
 *   e branco, e nenhum tom intermediário passou por medição de contraste;
 * - o filete creme grosso em volta, que naquela peça separa a chama do fundo
 *   vinho. Aqui a página é branca e ele simplesmente sumiria.
 *
 * Fica brasa chapado, sem contorno e sem degradê.
 */

/** Um topo de haste: onde a labareda nasce. */
export type Plato = {
  /** Centro do topo, em porcentagem da largura da palavra. */
  x: number;
  /** Largura do topo, em `em` do corpo do foco. */
  w: number;
};

/**
 * Os topos de haste de "ACENDE" na Owners XNarrow Black.
 *
 * **Medidos, não estimados.** O método: renderizar a palavra sozinha, achar
 * para cada coluna de pixel o topo da tinta e agrupar os trechos em que esse
 * topo varia menos de 4px. Numa fonte de topo chato cada grupo desses é um
 * topo de haste, e dele saem o centro e a largura. O procedimento completo, e
 * como remedir, estão em `docs/labaredas-do-heroi.md`.
 *
 * As duas grandezas são **propriedades da fonte e da palavra**, não do
 * viewport: a porcentagem não muda com a largura da tela e a largura em `em`
 * acompanha o corpo sozinha. Por isso um conjunto só serve em todos os
 * breakpoints, o que não era verdade nas tentativas anteriores.
 *
 * Os valores foram medidos duas vezes, em corpos diferentes, e a tabela é a
 * conciliação das duas. A primeira leitura tinha um desvio que crescia para a
 * direita, de até 0,7 ponto percentual no "E" final: acúmulo de `tracking` ao
 * longo da palavra. Conferida contra o render, a tabela agora fecha com erro
 * máximo de 3px numa palavra de 425px.
 *
 * Trocar a família do foco, o `tracking` ou o texto de `heroTitulo` invalida
 * a tabela inteira: é preciso remedir. `tests/unit/labaredas.test.ts` protege
 * contra edição distraída, mas não contra isso.
 */
export const PLATOS = {
  A: { x: 9.0, w: 0.2 },
  C: { x: 26.5, w: 0.201 },
  E: { x: 42.2, w: 0.326 },
  N_ESQUERDA: { x: 54.0, w: 0.171 },
  N_DIREITA: { x: 64.0, w: 0.12 },
  D: { x: 73.8, w: 0.264 },
  E_FINAL: { x: 92.9, w: 0.326 },
} as const satisfies Record<string, Plato>;

/**
 * Quanto vale 1 em na largura da palavra, em pontos percentuais.
 *
 * Medido junto com os platôs: 244px de corpo para 574px de palavra. Serve
 * para converter uma largura de haste (que está em `em`) numa distância
 * horizontal (que está em `%`), que é o que o par de línguas precisa para se
 * afastar do centro do topo sem abrir vão.
 */
export const EM_EM_PORCENTO = (244 / 574) * 100;

/** Uma língua de fogo, já posicionada. */
export type Labareda = {
  /** Centro da base, em porcentagem da largura da palavra. */
  x: number;
  /** Largura da base, em `em`. É a da haste, e não um valor livre. */
  w: number;
  /** Altura, em `em` do corpo do foco. */
  h: number;
  /** Para onde e quanto o bico foge, em fração da altura. Sinal = lado. */
  d: number;
};

/**
 * Duas línguas saindo do mesmo topo, uma alta e uma baixa.
 *
 * É o que a referência faz em toda haste larga, e é o que impede o efeito de
 * cogumelo: uma língua só, com a largura de um topo gordo, fica mais larga que
 * alta e não lê como chama.
 *
 * As duas **ladrilham o topo exatamente**. Cada uma fica a um quarto da
 * largura do centro e leva 52% dela, então elas se encontram no meio com 2% de
 * sobreposição e as bordas de fora caem sobre as bordas da haste. Os 2% são de
 * propósito: encostadas sem sobrar, o antisserrilhado deixa um fio branco
 * entre as duas.
 */
function par(
  p: Plato,
  esquerda: Omit<Labareda, "x" | "w">,
  direita: Omit<Labareda, "x" | "w">,
): Labareda[] {
  const quarto = (p.w * EM_EM_PORCENTO) / 4;
  const meia = p.w * 0.52;
  return [
    { x: p.x - quarto, w: meia, ...esquerda },
    { x: p.x + quarto, w: meia, ...direita },
  ];
}

/**
 * O conjunto, da esquerda para a direita.
 *
 * As alturas sobem para a direita de propósito, e a razão é de layout: "Sua
 * fome" ocupa os primeiros 29% da largura da palavra, então ali em cima a
 * língua tem que caber no vão entre as duas linhas. Da metade para a direita
 * não há nada acima e o fogo sobe à vontade. A irregularidade do skyline,
 * que é o efeito inteiro da referência, sai de graça dessa restrição.
 *
 * Os `d` alternam de sinal: todos os bicos virados para o mesmo lado leem como
 * vento, não como fogo.
 *
 * Não há como engrossar uma língua aqui, e a ausência é o ponto: a base é a
 * largura da haste, e nada mais. Variação de peso vem da altura e da
 * inclinação, que não mexem no encontro com a letra.
 */
export const LABAREDAS: readonly Labareda[] = [
  { x: PLATOS.A.x, w: PLATOS.A.w, h: 0.4, d: -0.34 },
  ...par(
    PLATOS.C,
    { h: 0.3, d: -0.28 },
    { h: 0.4, d: 0.26 },
  ),
  ...par(
    PLATOS.E,
    { h: 0.72, d: 0.2 },
    { h: 0.4, d: 0.3 },
  ),
  { x: PLATOS.N_ESQUERDA.x, w: PLATOS.N_ESQUERDA.w, h: 0.32, d: 0.32 },
  { x: PLATOS.N_DIREITA.x, w: PLATOS.N_DIREITA.w, h: 0.5, d: -0.32 },
  ...par(
    PLATOS.D,
    { h: 0.44, d: 0.3 },
    { h: 0.29, d: -0.26 },
  ),
  ...par(
    PLATOS.E_FINAL,
    { h: 0.62, d: -0.26 },
    { h: 0.38, d: 0.24 },
  ),
];

/**
 * Ajustes verticais do conjunto, em `em` do corpo do foco.
 *
 * Ficam juntos aqui pelo mesmo motivo do `AJUSTES` de `lib/costura.ts`:
 * reajustar depois é editar um bloco, não caçar número solto na JSX.
 */
export const ALTURAS = {
  /**
   * Onde fica o topo das maiúsculas, abaixo do topo da caixa da linha.
   *
   * Medido: 0,065 em. A caixa da linha começa acima da tinta por causa do
   * `line-height`, e é a tinta que interessa, porque é dela que a chama sai.
   */
  topoDasMaiusculas: 0.065,

  /**
   * Quanto a base da língua entra na letra.
   *
   * Ela precisa CRUZAR a linha do topo, não encostar nela: encostada, o
   * antisserrilhado das duas formas deixa um fio branco no encontro, e a
   * emenda aparece justamente onde ela não pode aparecer.
   */
  afunda: 0.08,
} as const;

/** A mais alta do conjunto, que é quem manda no respiro acima do foco. */
export const ALTURA_MAXIMA = Math.max(...LABAREDAS.map((l) => l.h));

/**
 * Onde a linha de apoio termina, em porcentagem da largura do foco.
 *
 * Medido no navegador: 36%. Abaixo desse ponto existe texto acima da palavra,
 * e a labareda tem que caber no vão entre as duas linhas; a partir dele o
 * espaço é livre e o fogo sobe à vontade. É daqui que sai o skyline
 * irregular, que na referência é o efeito inteiro: ele não é gosto, é a
 * única forma que o layout permite.
 */
export const FIM_DO_APOIO = 36;

/**
 * Teto de altura para a labareda que nasce sob a linha de apoio.
 *
 * Sai da conta: o vão medido acima das maiúsculas é de 0,156 em, e o `mt` do
 * foco acrescenta 0,22 em. Somados, e descontado o `topoDasMaiusculas`, a
 * língua pode ter até 0,44 em antes de encostar em "Sua fome".
 */
export const TETO_SOB_APOIO = 0.44;

/**
 * A dominante inclina para a DIREITA, e isso não é gosto.
 *
 * Ela nasce logo depois de `FIM_DO_APOIO` e é a mais alta do conjunto.
 * Inclinada para a esquerda, o bico dela voltava para cima de "Sua fome"
 * mesmo com a base já fora do vão: **o que colide é a ponta, não o pé**.
 * Virada para a direita ela se afasta da palavra, e ainda aponta para a foto
 * da fachada, que entra pela direita no desktop.
 */

/**
 * Monta o path de uma língua, num viewBox quadrado de 100.
 *
 * Duas cúbicas e um fecho. Três decisões que separam labareda de folha de
 * grama, e todas as três custaram uma tentativa antes de acertar:
 *
 * 1. **A base sai reta e com tangente VERTICAL.** Os dois primeiros pontos de
 *    controle ficam exatamente sobre as bordas da haste, em `centro ± meia`.
 *    É isso que faz a língua sair da letra com a largura dela e sem ombro.
 *    Empurrá-los para fora, como a versão anterior fazia, alarga a língua
 *    justamente no encontro: a chama deixa de parecer parte da letra e vira
 *    adesivo colado em cima dela.
 * 2. **A barriga e a inclinação vivem ACIMA da base**, no segundo ponto de
 *    controle. É lá que a língua pende para o lado do bico. Corpo vertical com
 *    gancho só no alto lê como chifre, mas o gesto não pode mexer em onde ela
 *    encosta na letra.
 * 3. **Os dois pontos de controle vizinhos do bico ficam do mesmo lado dele**,
 *    o lado contrário ao que ele aponta. É o que dobra a ponta em chicote; com
 *    eles em lados opostos a ponta sai reta e o conjunto vira coroa.
 */
export function linguaDeFogo(baseNoViewBox: number, desvio: number): string {
  const centro = 50;
  const meia = baseNoViewBox / 2;
  const bico = centro + desvio * 100;
  const lado = desvio < 0 ? -1 : 1;
  const gancho = baseNoViewBox * 0.9;
  const n = (v: number) => Number(v.toFixed(2));

  // A barriga inteira pende para o lado do bico, e nao so a ponta: e o que
  // faz a lingua parecer soprada em vez de plantada. Sem isto o corpo fica
  // vertical com um gancho no alto, que le como chifre.
  const pende = desvio * 100 * 0.28;

  return [
    `M${n(centro - meia)} 100`,
    `C${n(centro - meia)} 76 ${n(bico - lado * gancho * 1.35 + pende)} 42 ${n(bico)} 0`,
    `C${n(bico - lado * gancho * 2.6 + pende)} 34 ${n(centro + meia)} 72 ${n(centro + meia)} 100`,
    "Z",
  ].join("");
}

/**
 * Largura da base dentro do viewBox de uma língua.
 *
 * O SVG é quadrado e recebe o mesmo valor em largura e altura, então a base
 * precisa ser expressa como fração da ALTURA, não da largura da palavra.
 *
 * **Não há fator de correção aqui, e a ausência é o ponto.** Qualquer
 * multiplicador faria a base deixar de ser a largura da haste, que é a única
 * coisa que garante que a labareda seja parte da letra em vez de estar em cima
 * dela. O teto de 94 existe só para uma base maior que o quadro não sair
 * cortada, e nenhuma do conjunto atual chega perto dele.
 */
export function baseNoViewBox(labareda: Labareda): number {
  return Math.min(94, (100 * labareda.w) / labareda.h);
}

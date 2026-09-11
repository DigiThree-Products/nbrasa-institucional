/**
 * A queima que revela o texto da seção de avaliações de baixo para cima.
 *
 * O gesto vem da mesma referência de tipografia em fogo que deu origem ao
 * `TextoQueAcende`, e o cliente pediu em 2026-09-10 que a seção "Quem veio,
 * volta" fosse mais fiel a ela. A diferença entre os dois é onde o movimento
 * acontece: no `TextoQueAcende` a letra inteira sobe e esfria, aqui ela fica
 * parada e uma linha de fogo sobe por dentro do glifo. Abaixo da linha a
 * letra já é tinta, acima dela ainda é fumaça.
 *
 * ── Por que máscara, e não duas metades recortadas ─────────────────────────
 * O recorte com `clip-path` dá borda dura, e borda dura entre tinta e fumaça
 * lê como papel rasgado, não como fogo. O gradiente da máscara tem uma banda
 * de transição, a `MACIEZ`, e é ela que faz a fronteira parecer chama.
 *
 * ── Por que a linha mora numa variável de CSS ──────────────────────────────
 * A máscara é escrita uma vez, na montagem, e quem se move é só um número.
 * Assim o GSAP anima uma propriedade por elemento, com escalonamento próprio
 * de cada letra, sem que ninguém precise remontar a string a cada quadro.
 *
 * ── O que erra calado aqui ─────────────────────────────────────────────────
 * `calc` mal fechado não lança: o navegador descarta a declaração inteira, a
 * máscara some, e a letra aparece pronta, sem queima nenhuma. Um vão entre a
 * parada da tinta e a da fumaça abre um rasgo no meio do glifo. E linha
 * inicial em zero, em vez de uma banda abaixo da caixa, faz a letra nascer
 * com a base já acesa. Os três têm teste.
 */

/**
 * Largura da banda de fogo, em porcentagem da altura da caixa da letra.
 *
 * É a distância entre a tinta cheia e a fumaça cheia. Banda estreita demais
 * devolve a borda dura que a máscara existe para evitar; larga demais e a
 * letra inteira fica meio acesa o tempo todo, sem fronteira que se leia como
 * chama subindo. Um quarto da altura é o meio termo medido no título, que é
 * onde o gesto é grande o bastante para ser visto.
 */
export const MACIEZ = 26;

/**
 * Onde a linha de fogo nasce, em porcentagem da altura da caixa.
 *
 * Uma banda inteira abaixo do zero, e não o próprio zero: a transição começa
 * na linha e termina uma `MACIEZ` acima dela, então com a linha em zero a
 * base do glifo já nasceria pintada.
 */
export const LINHA_INICIAL = -MACIEZ;

/**
 * Onde a linha de fogo morre. Em 100 a tinta cobre a caixa inteira; parar
 * antes deixaria o topo da letra sem pintura para sempre.
 */
export const LINHA_FINAL = 100;

/** O nome da propriedade que o componente anima. */
export const VARIAVEL_DA_LINHA = "--linha-de-fogo";

/** As duas camadas sobrepostas do mesmo glifo. */
export type Papel = "tinta" | "fumaca";

/**
 * Monta a máscara de uma das camadas.
 *
 * As duas leem a mesma variável e as mesmas duas paradas, e é isso que as
 * mantém complementares: onde uma acaba, a outra começa. A tinta é opaca
 * abaixo da linha, a fumaça é opaca acima dela.
 */
export function mascaraDaQueima(papel: Papel, maciez: number = MACIEZ): string {
  const linha = `calc(var(${VARIAVEL_DA_LINHA}) * 1%)`;
  const acima = `calc((var(${VARIAVEL_DA_LINHA}) + ${maciez}) * 1%)`;
  const [embaixo, emCima] = papel === "tinta"
    ? ["#000", "transparent"]
    : ["transparent", "#000"];
  return `linear-gradient(to top, ${embaixo} ${linha}, ${emCima} ${acima})`;
}

/**
 * Quantas cópias formam a pluma de fumaça.
 *
 * Quatro é o menor número em que a pilha lê como pluma e não como mancha: com
 * duas, o salto de uma cópia para a outra aparece; acima de quatro, cada cópia
 * nova custa uma pintura de sombra por letra e a diferença não se vê.
 */
export const PASSOS_DA_PLUMA = 6;

/** Quanto o desfoque da cópia mais alta cresce em relação à subida dela. */
const ESPALHAMENTO = 2.4;
/**
 * Com que rapidez o desfoque cresce de uma cópia para a seguinte.
 *
 * Acima de 1 ele cresce mais depressa que a altura, e é isso que faz a cópia
 * de cima perder a forma da letra. Crescimento linear mantém seis letras
 * legíveis empilhadas, que lê como eco, não como fumaça.
 */
const CURVA_DO_DESFOQUE = 1.5;
/** O desfoque mínimo, para a cópia mais baixa não sair com borda dura. */
const DESFOQUE_BASE = 0.04;
/** Quanto a cópia mais alta perde de opacidade em relação à mais baixa. */
const QUEDA_DO_ALFA = 0.78;
/** O quanto a cópia mais alta pode escorar para o lado, em fração da altura. */
const DERIVA_MAXIMA = 0.42;

/**
 * A inclinação da pluma de uma letra, entre -1 e 1.
 *
 * Fumaça idêntica em catorze letras lê como padrão, não como fumaça, e é a
 * deriva que quebra isso. Ela é uma conta, e não um sorteio, porque a pluma é
 * remontada a cada entrada na seção: com `Math.random` ela pularia de lado
 * quando o visitante voltasse, sem motivo visível.
 */
export function derivaDaLetra(semente: number): number {
  const bruto = Math.sin((semente + 1) * 12.9898) * 43758.5453;
  return (bruto - Math.floor(bruto)) * 2 - 1;
}

/**
 * Devolve a cor com alfa.
 *
 * Existe porque a pluma precisa de uma opacidade por cópia, e o token de marca
 * é um hex sem alfa. `tokens.test.ts` fixa esses hex, então o caminho normal é
 * o primeiro; o segundo cobre o `rgb(...)` que `getComputedStyle` às vezes
 * devolve no lugar do texto escrito no `@theme`.
 */
export function emRgba(cor: string, alfa: number | string): string {
  const hex = cor.trim().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) {
    const [r, g, b] = hex.slice(1, 4).map((par) => parseInt(par, 16));
    return `rgba(${r}, ${g}, ${b}, ${alfa})`;
  }
  const rgb = cor.trim().match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return `rgba(${Number(rgb[1])}, ${Number(rgb[2])}, ${Number(rgb[3])}, ${alfa})`;
  // Cor em formato que não sei abrir. `color-mix` preserva o alfa em vez de
  // devolver uma sombra sólida, que seria o erro calado aqui.
  const porcento = typeof alfa === "number" ? `${(alfa * 100).toFixed(1)}%` : `calc(${alfa} * 100%)`;
  return `color-mix(in srgb, ${cor} ${porcento}, transparent)`;
}

/** Onde a pluma começa e onde ela acaba, em `em`. */
const SUBIDA_DA_PLUMA = { comeco: 0.08, fim: 0.34 };
/** A força da pluma no nascimento. Ela termina sempre apagada. */
const OPACIDADE_DA_PLUMA = 0.9;

/** Nome das duas propriedades derivadas que a pluma consome. */
export const VARIAVEL_DO_AVANCO = "--avanco-da-queima";
export const VARIAVEL_DA_ALTURA = "--altura-da-pluma";

/**
 * As duas contas derivadas da linha de fogo, escritas como CSS.
 *
 * `avanco` é a queima de 0 a 1, e `altura` é o quanto a pluma já subiu. Como
 * são propriedades personalizadas, o navegador as recalcula sozinho a cada
 * mudança da linha: ninguém precisa reescrevê-las quadro a quadro.
 */
export function contasDaQueima(): Record<string, string> {
  const curso = LINHA_FINAL - LINHA_INICIAL;
  const { comeco, fim } = SUBIDA_DA_PLUMA;
  return {
    [VARIAVEL_DO_AVANCO]: `calc((var(${VARIAVEL_DA_LINHA}) - ${LINHA_INICIAL}) / ${curso})`,
    [VARIAVEL_DA_ALTURA]:
      `calc(${comeco}em + ${(fim - comeco).toFixed(3)}em * var(${VARIAVEL_DO_AVANCO}))`,
  };
}

/**
 * Monta a pluma de fumaça que acompanha a linha de fogo.
 *
 * São cópias da letra empilhadas para cima, cada uma mais alta, mais borrada e
 * mais fraca que a anterior. O halo simétrico que ela substituiu em 2026-09-11
 * não lia como fumaça justamente por ser simétrico: fumaça sobe, e o que sobe
 * precisa ser mais fraco em cima. As distâncias saem em `em` para acompanharem
 * o corpo do título, que é um `clamp` e quase dobra entre o telefone e a tela
 * grande.
 *
 * ── Por que a pluma se move por CSS, e não por tween ───────────────────────
 * A primeira versão animava a sombra inteira pelo GSAP, de um estado a outro.
 * Medido no navegador em 2026-09-11, ele interpola bem o desfoque e o alfa e
 * **embaralha os deslocamentos**: uma cópia foi parar a 49px de altura, fora
 * de qualquer estado válido, enquanto as vizinhas ficavam curtas. Nada lança,
 * e a pluma vira um borrão trêmulo. Aqui ela é escrita uma vez e lê a mesma
 * variável que move a máscara, então sobe exatamente junto com o fogo e as
 * duas não têm como dessincronizar. É o mesmo motivo pelo qual o trilho da
 * espiral refaz a projeção em vez de guardar o número em dois lugares.
 */
export function plumaDeFumaca(cor: string, semente = 0): string {
  const altura = `var(${VARIAVEL_DA_ALTURA})`;
  const avanco = `var(${VARIAVEL_DO_AVANCO})`;
  const deriva = derivaDaLetra(semente) * DERIVA_MAXIMA;
  return Array.from({ length: PASSOS_DA_PLUMA }, (_, i) => {
    const passo = (i + 1) / PASSOS_DA_PLUMA;
    // O lado cresce mais que a altura, então a pluma abre em leque em vez de
    // subir inclinada como um bloco só.
    const lado = (deriva * passo ** 1.7).toFixed(4);
    const espalha = (ESPALHAMENTO * passo ** CURVA_DO_DESFOQUE).toFixed(3);
    const desfoque = `calc(${DESFOQUE_BASE}em + ${altura} * ${espalha})`;
    const forca = (OPACIDADE_DA_PLUMA * (1 - QUEDA_DO_ALFA * passo)).toFixed(3);
    const alfa = `calc(${forca} * (1 - ${avanco}))`;
    return `calc(${altura} * ${lado}) calc(${altura} * ${(-passo).toFixed(3)})`
      + ` ${desfoque} ${emRgba(cor, alfa)}`;
  }).join(", ");
}


/**
 * Diz se o elemento deve nascer escondido.
 *
 * Escondido na montagem, e não no instante do gatilho, é o que evita a
 * piscada: sem isto o elemento sobe a tela em opacidade cheia, aparece de
 * verdade por uns cem pixels de rolagem, e só então salta para escondido
 * quando o gatilho pega. Mas esconder o que já está à vista seria pior que a
 * piscada, porque apagaria na frente do visitante um texto que ele já está
 * lendo. Por isso a pergunta é sobre a posição, e não sobre o tempo.
 */
export function escondeNaMontagem(topo: number, alturaDaJanela: number): boolean {
  return topo >= alturaDaJanela;
}

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
 * Seis é a escolha do cliente em 2026-09-11, quando ele pediu para enxergar a
 * letra dentro da fumaça: cada cópia passou a ser um fantasma legível do
 * glifo, e seis escalonadas dão a leitura de rastro. Abaixo de quatro o salto
 * de uma para a outra aparece; acima de seis cada cópia nova custa uma
 * pintura de sombra por letra e a diferença não se vê.
 *
 * Este número é metade da conta de separação: o vão entre duas cópias é a
 * altura da pluma dividida por ele. Subir aqui aperta as cópias sem que nada
 * lance, e é `SUBIDA_DA_PLUMA` que explica a conta inteira.
 */
export const PASSOS_DA_PLUMA = 6;

/**
 * Quanto o desfoque da cópia mais alta cresce em relação à subida dela.
 *
 * Era 2,4 enquanto a pluma existia para dissolver a letra. Desde 2026-09-11
 * ele é o freio do desfoque, e não o motor: é ele que decide se a cópia ainda
 * tem contorno quando chega ao alto da pluma.
 */
const ESPALHAMENTO = 0.07;
/**
 * Com que rapidez o desfoque cresce de uma cópia para a seguinte.
 *
 * Acima de 1 ele cresce mais depressa que a altura, o que faz a cópia de cima
 * perder a forma da letra. Era 1,5, e era assim de propósito, enquanto a
 * pluma devia ler como mancha.
 *
 * O cliente pediu o contrário em 2026-09-11, ver a letra dentro da fumaça,
 * então o crescimento é linear e as seis cópias continuam legíveis
 * empilhadas. O risco conhecido dessa escolha é a pilha ler como sombra
 * repetida em vez de fumaça, e ele foi aceito vendo, não no papel.
 */
const CURVA_DO_DESFOQUE = 1;
/**
 * O desfoque mínimo, para a cópia mais baixa não sair com borda dura.
 *
 * É o número que erra mais calado dos quatro, porque não é de cópia nenhuma
 * em particular: ele soma em todas. Era 0,04, e sozinho valia três vezes o
 * vão entre duas cópias, o bastante para fundir a pilha inteira mesmo com o
 * espalhamento zerado. Quem for baixar a altura da pluma confere este aqui
 * antes.
 */
export const DESFOQUE_BASE = 0.01;
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

/**
 * Onde a pluma começa e onde ela acaba, em `em`.
 *
 * A altura é o que dá lugar às cópias, e por isso ela é a metade decisiva da
 * conta de separação: o vão entre duas vizinhas é esta altura dividida por
 * `PASSOS_DA_PLUMA`, e uma cópia só lê como letra enquanto esse vão for maior
 * que o desfoque que ela carrega.
 *
 * Era 0,08 a 0,34 quando a pluma devia dissolver. Nessa faixa as seis cópias
 * cabiam todas dentro de um oitavo de em, o vão dava um vigésimo do desfoque,
 * e **nenhuma redução de desfoque sozinha as separaria**: foi o que a medição
 * de 2026-09-11 mostrou quando o pedido chegou como "só baixar o desfoque".
 *
 * O pior caso é o NASCIMENTO, e não o fim: é quando a pluma está mais baixa e
 * mais forte ao mesmo tempo, porque o alfa cai com o avanço enquanto a altura
 * sobe. Medido nestes números, o vão dá 1,44 vez o desfoque ali, contra 1,87
 * no meio da queima. `queima.test.ts` cobra o nascimento.
 *
 * O teto de 0,72em encosta na linha de cima num título de duas linhas, que
 * tem entrelinha de 0,86em. As cópias que chegam tão alto já estão quase
 * apagadas, então isso foi aceito.
 */
export const SUBIDA_DA_PLUMA = { comeco: 0.22, fim: 0.72 };
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

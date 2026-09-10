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

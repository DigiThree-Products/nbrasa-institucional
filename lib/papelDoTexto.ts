/**
 * O papel branco do Cardápio, colado em cada LETRA.
 *
 * Ele existe pelo mesmo motivo que o papel de bloco que substituiu em
 * 2026-09-10: a bobina do Cardápio cruza a coluna de texto, e sem nada atrás
 * dela a tinta do título passaria por cima de card colorido, ilegível e sem
 * nada acusar. A diferença é a forma. O bloco reservava um retângulo inteiro e
 * apagava o card ali; a auréola reserva só o contorno de cada glifo, então o
 * card continua aparecendo entre as palavras e nas entrelinhas, e some apenas
 * onde encostaria na tinta. Foi o que o cliente pediu.
 *
 * ── Por que sombra, e não `-webkit-text-stroke` ────────────────────────────
 * O traço de texto pinta com metade da largura para dentro do glifo, então
 * depende de `paint-order: stroke fill` para a letra ser redesenhada por cima.
 * Onde `paint-order` não vale para texto de HTML, o branco cobre a letra e o
 * título fica ilegível, branco sobre branco. Sombra não tem esse modo de
 * falhar: onde não houver suporte, ela simplesmente não é pintada, e o texto
 * continua legível como está hoje. É mais cara de pintar, e o preço foi aceito
 * por causa disso.
 *
 * ── Por que uma função, e não a lista escrita à mão no CSS ─────────────────
 * São dezesseis deslocamentos por chamada, cada um com seno e cosseno. Escrever
 * isso à mão é errar calado: um passo a mais entre dois pontos abre um dente na
 * auréola, e dente branco em cima de card colorido só aparece no meio da cena
 * presa, em movimento. Aqui a conta é uma só e tem teste.
 */

/**
 * Raio do papel, em pixels, para cada papel tipográfico da seção.
 *
 * Medidos contra o corpo de cada um: o título é display pesado e aguenta
 * auréola larga sem fechar contraforma; o parágrafo é corpo de 14px, e passar
 * de uns 5px começa a colar linha em linha.
 */
export const RAIO_DO_PAPEL = {
  titulo: 9,
  corpo: 5,
} as const;

/**
 * Quantos deslocamentos formam a auréola.
 *
 * Dezesseis não é número redondo escolhido no olho: a distância entre dois
 * pontos vizinhos do anel é `2 * raio * sen(pi / passos)`, e ela precisa ficar
 * bem abaixo do raio, senão a borda serrilha entre um ponto e outro. Em
 * dezesseis passos essa distância é 0,39 do raio, com folga larga. Em oito ela
 * seria 0,77, já visível no corpo do título.
 */
const PASSOS_DO_ANEL = 16;

/**
 * Monta o `text-shadow` que faz o papel: cópias brancas do texto distribuídas
 * em círculo, todas na mesma distância da tinta.
 *
 * A cor sai do token de marca, e não de um `#fff` cru: é a mesma superfície
 * branca que `contraste.test.ts` usa como fundo do par de texto, e um literal
 * aqui sairia de sincronia no dia em que o branco do site mudar.
 */
export function anelDePapel(raio: number, passos: number = PASSOS_DO_ANEL): string {
  return Array.from({ length: passos }, (_, i) => {
    const angulo = (i / passos) * 2 * Math.PI;
    const x = (Math.cos(angulo) * raio).toFixed(2);
    const y = (Math.sin(angulo) * raio).toFixed(2);
    return `${x}px ${y}px 0 var(--color-branco)`;
  }).join(", ");
}

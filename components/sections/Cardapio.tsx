import { getCategorias } from "@/lib/conteudo";
import type { Categoria } from "@/lib/conteudo.tipos";
import { anelDePapel, RAIO_DO_PAPEL } from "@/lib/papelDoTexto";
import { FileiraEmEspiral } from "@/components/sections/FileiraEmEspiral";
import { Chama } from "@/components/ui/Chama";

/**
 * O texto do Cardápio, que é a primeira peça da grade da seção.
 *
 * De 1024px para cima ele ocupa a metade ESQUERDA da primeira linha e fica
 * parado ali enquanto a bobina varre o meio da tela e entrega os cards. Abaixo
 * disso é o cabeçalho de sempre, atravessado, antes dos cards.
 *
 * Ele não é enfeite ao lado da cena: prender o palco exige que a seção caiba
 * numa janela, e é a metade de texto que deixa a grade de cards baixa o
 * bastante para caber em 1024x768 com folga.
 *
 * O `pb` de 1024 para cima é o respiro até os dois cards que pousam logo
 * abaixo dele, na segunda linha. Ele engorda a primeira linha da grade, e é de
 * propósito: os dois cards da metade direita que dividem essa linha usam
 * `self-end`, então descem junto e continuam encostados nos de baixo.
 *
 * A `ParedeDeTipos` saiu daqui em 2026-09-09, a pedido do cliente. A cópia da
 * Delivery continua, e lá ela é outra coisa: elemento gráfico da faixa, hoje a
 * fita contínua de anúncio, e não textura de fundo.
 */
export function CabecalhoDoCardapio() {
  return (
    <div className="relative flex flex-col gap-6 [grid-column:1/-1] lg:pb-8 lg:[grid-column:1/3] lg:[grid-row:1]">
      {/* O PAPEL, hoje colado em cada LETRA e não mais num bloco atrás delas.
          É ele que faz a bobina SUMIR onde encostaria na tinta, em vez de
          passar por cima dela.

          Foi um retângulo mascarado com a chama recortada na beirada direita
          até 2026-09-10, quando o cliente pediu papel só nas letras. A troca
          apagou daqui o `div` da reserva, e de `lib/costura.ts` a variante
          `reserva` de `mascaraChama` com todos os números dela: eram todos do
          desenho daquele bloco.

          O que a auréola muda no gesto: o card continua aparecendo entre as
          palavras e nas entrelinhas, e some apenas na volta do glifo. O bloco
          apagava o card num retângulo inteiro.

          A conta do anel mora em `lib/papelDoTexto.ts`, com teste: são
          dezesseis cópias em círculo, e um passo a mais entre duas abre dente
          na borda, que só se vê com card colorido atrás e em movimento.

          Vale em qualquer largura, e não só no desktop: sobre o branco da
          página a auréola é invisível, então não precisa de consulta de mídia
          para desligar abaixo de 1024, onde não há cena presa. */}
      <h2
        className="relative text-balance font-display text-[clamp(2.82rem,6.2vw,4.6rem)] uppercase leading-[.86]"
        style={{ textShadow: anelDePapel(RAIO_DO_PAPEL.titulo) }}
      >
        Feito na hora,<br />servido no capricho
      </h2>
      <p
        className="relative max-w-[40ch] text-creme-texto"
        style={{ textShadow: anelDePapel(RAIO_DO_PAPEL.corpo) }}
      >
        Ingredientes frescos, ponto certo e porções generosas. Cada item nasceu para ser repetido.
      </p>
    </div>
  );
}

/**
 * Onde cada card pousa na grade, de 1024px para cima.
 *
 * A ordem do array é a ordem de pouso, porque quem decide o instante do voo é
 * o índice do card. Os quatro primeiros formam o 2x2 da metade direita, como
 * na FITA; os dois últimos pousam embaixo do texto, na metade esquerda.
 *
 * **Os dois primeiros usam `self-end`.** A primeira linha da grade é tão alta
 * quanto o texto, que é mais alto que um card; sem isso eles ficariam colados
 * no topo e abriria um vão entre eles e a linha de baixo, desmanchando o 2x2.
 *
 * A cascata pula da metade direita para a esquerda no fim, e isso é a
 * referência, não descuido: lá a grade também preenche em varredura e o
 * terceiro card aparece na ponta oposta à do segundo.
 */
const CELULAS = [
  "lg:[grid-column:4] lg:[grid-row:1] lg:self-end",
  "lg:[grid-column:5] lg:[grid-row:1] lg:self-end",
  "lg:[grid-column:4] lg:[grid-row:2]",
  "lg:[grid-column:5] lg:[grid-row:2]",
  "lg:[grid-column:1] lg:[grid-row:2]",
  "lg:[grid-column:2] lg:[grid-row:2]",
];

/**
 * Um card de categoria: uma caixa 3D com duas faces.
 *
 * ── Por que duas faces, e não `backface-visibility` no card inteiro ─────────
 * A hélice gira o card quase uma volta e meia entre o nascimento e o pouso, e
 * boa parte desse trecho ele está de costas. Com a face escondida no próprio
 * `<article>` ele simplesmente sumiria ali, e a fila deixaria de ler como um
 * corpo contínuo, que é justamente o gesto da referência: na FITA o card
 * virado mostra o dorso escuro do plano, e é isso que mantém a banda inteira.
 *
 * Então o `<article>` é só a caixa 3D (`preserve-3d`), e as duas faces são
 * filhas absolutas: a frente com o conteúdo, o verso em brasa chapada. Cada uma
 * esconde a própria face de trás, então em qualquer ângulo exatamente uma das
 * duas está pintada, e o texto nunca aparece espelhado.
 *
 * O canto arredondado e o `overflow-hidden` moram nas faces, e não no article:
 * `overflow` diferente de `visible` obriga o navegador a achatar o conteúdo 3D,
 * e achatado aqui significa perder o `preserve-3d` que separa as duas faces.
 *
 * A proporção é 3:2 paisagem, a mesma da referência (`CARD_ASPECT` de lá), e é
 * ela que `PROPORCAO` em `lib/espiral.ts` converte para as contas da hélice.
 * Mexer numa sem a outra desalinha o trilho das bordas do card.
 *
 * O `indice` decide duas coisas de uma vez, e é o mesmo número nas duas: a
 * célula onde o card pousa, por `CELULAS`, e o instante em que ele pousa, que
 * `lib/espiral.ts` tira da posição dele entre os irmãos. Não há como as duas
 * saírem de sincronia.
 *
 * A descrição só aparece de `xl` para cima. Numa grade de duas colunas dentro
 * da coluna direita, a 1024px de janela o card tem 231px de largura, e três
 * linhas de descrição ali viram mancha. Kicker e nome aparecem sempre.
 *
 * O fundo da frente é `bg-creme` chapado hoje. Quando `fotoPath` deixar de ser
 * nulo, é aqui que a foto entra, e a espiral não precisa ser tocada: ela anima
 * o elemento, não o que está pintado dentro dele.
 */
export function CardDeCategoria({
  categoria,
  indice,
}: {
  categoria: Categoria;
  indice: number;
}) {
  return (
    <article
      className={`relative aspect-[3/2] [transform-style:preserve-3d] ${CELULAS[indice] ?? ""}`}
    >
      <div className="absolute inset-0 flex flex-col justify-end overflow-hidden rounded-[22px] border border-creme-borda bg-creme p-5 [backface-visibility:hidden] transition-colors hover:border-brasa lg:p-4">
        {/* Textura, nao conteudo: a Chama ja e aria-hidden. A opacidade
            baixa e deliberada, este par nao entra em contraste.test.ts
            porque nao ha texto por cima dela. */}
        <Chama className="pointer-events-none absolute -right-6 -top-8 h-32 w-[87px] text-brasa opacity-[.08]" />
        {/* brasa-escura, nao brasa: rotulo pequeno sobre fundo claro (§9 do spec) */}
        <span className="relative text-[.68rem] font-extrabold uppercase tracking-[.16em] text-brasa-escura">
          {categoria.kicker}
        </span>
        <h3 className="relative mb-1 mt-2 font-display text-[1.5rem] uppercase leading-none xl:text-[1.84rem]">
          {categoria.nome}
        </h3>
        <p className="relative hidden text-sm leading-relaxed text-creme-texto xl:block">
          {categoria.descricao}
        </p>
      </div>
      {/* O verso. Chapado de propósito: ele existe para o card ter corpo
          enquanto passa virado, e qualquer conteúdo aqui seria texto que
          ninguém consegue ler girando. A chama é o mesmo grafismo da frente,
          em branco sobre a brasa, que é o único par que passa AA nessa cor. */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-[22px] bg-brasa [backface-visibility:hidden] [transform:rotateY(180deg)]"
      >
        <Chama className="absolute -left-6 -top-8 h-32 w-[87px] text-branco opacity-20" />
      </div>
    </article>
  );
}

/**
 * O Cardápio.
 *
 * O bento de quatro colunas saiu em 2026-09-09, porque prender o palco da
 * espiral exige que ele caiba numa janela e a seção media 1137px de altura. A
 * fileira única de seis cards que o substituiu saiu no mesmo dia, e a grade
 * que substituiu a fileira também: o porte da espiral da FITA pede o arranjo
 * de lá, texto parado numa metade e os cards pousando na outra. Ver a seção 4
 * do spec e a seção 0 dele.
 *
 * O `destaque` de `Categoria` continua sem consumidor aqui, e isso é anterior
 * a esta mudança: quem escolhia o tile grande era a posição no array, apesar
 * de o comentário do tipo afirmar o contrário. Quando o card ganhar foto, ele
 * é o candidato natural a decidir qual card é o maior da grade.
 *
 * O `Reveal` saiu da grade de propósito. Dois donos escrevendo `transform` no
 * mesmo elemento brigam, e no desktop a espiral já é a revelação. Abaixo de
 * 1024px os cards passam a aparecer sem animação de entrada, que é o preço
 * aceito por ter um dono só do `transform`. `Reveal` segue em uso nas outras
 * seções.
 *
 * A ORDEM importa: os cards pousam na ordem do DOM, e é ela que `CELULAS`
 * traduz em posição na grade. Sai de graça porque quem decide o instante do
 * pouso é o índice do card.
 */
export async function Cardapio() {
  const cats = await getCategorias();
  return (
    <section id="cardapio">
      <FileiraEmEspiral cabecalho={<CabecalhoDoCardapio />}>
        {cats.map((c, i) => (
          <CardDeCategoria key={c.slug} categoria={c} indice={i} />
        ))}
      </FileiraEmEspiral>
    </section>
  );
}

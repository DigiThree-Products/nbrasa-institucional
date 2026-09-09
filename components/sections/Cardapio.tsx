import { getCategorias } from "@/lib/conteudo";
import type { Categoria } from "@/lib/conteudo.tipos";
import { FileiraEmEspiral } from "@/components/sections/FileiraEmEspiral";
import { Chama } from "@/components/ui/Chama";

/**
 * A coluna de texto do Cardápio.
 *
 * De 1024px para cima ela fica PARADA à esquerda enquanto a bobina varre o
 * meio da tela e entrega os cards na grade à direita, que é o arranjo da seção
 * "Programação completa" da FITA. Abaixo disso ela é só o cabeçalho de sempre,
 * empilhado antes dos cards.
 *
 * Ela não é enfeite ao lado da cena: prender o palco exige que a seção caiba
 * numa janela, e é a coluna de texto que deixa a grade estreita o bastante
 * para as três linhas caberem com folga em 1024x768.
 *
 * A `ParedeDeTipos` saiu daqui em 2026-09-09, a pedido do cliente. A cópia da
 * Delivery continua, e lá ela é outra coisa: `opacity-90` sobre o vermelho,
 * elemento gráfico da faixa e não textura de fundo.
 */
export function CabecalhoDoCardapio() {
  return (
    /* `self-start` alinha o topo do título ao topo da primeira linha de cards,
       e não é só arrumação: centrado na vertical o título cai no meio do palco,
       que é justamente por onde a bobina passa, e a banda de cards cobre a
       frase inteira no meio da cena. Na referência o título mora no alto da
       coluna e a bobina cruza por baixo dele. */
    <div className="flex flex-col gap-6 lg:self-start">
      <h2 className="text-balance font-display text-[clamp(2.82rem,6.2vw,4.6rem)] uppercase leading-[.86]">
        Feito na hora,<br />servido no capricho
      </h2>
      <p className="max-w-[40ch] text-creme-texto">
        Ingredientes frescos, ponto certo e porções generosas. Cada item nasceu para ser repetido.
      </p>
    </div>
  );
}

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
 * A descrição só aparece de `xl` para cima. Numa grade de duas colunas dentro
 * da coluna direita, a 1024px de janela o card tem 231px de largura, e três
 * linhas de descrição ali viram mancha. Kicker e nome aparecem sempre.
 *
 * O fundo da frente é `bg-creme` chapado hoje. Quando `fotoPath` deixar de ser
 * nulo, é aqui que a foto entra, e a espiral não precisa ser tocada: ela anima
 * o elemento, não o que está pintado dentro dele.
 */
export function CardDeCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <article className="relative aspect-[3/2] [transform-style:preserve-3d]">
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
 * fileira única de seis cards que o substituiu saiu no mesmo dia: o porte da
 * espiral da FITA pede o arranjo de lá, título parado numa coluna e os cards
 * pousando numa grade na outra. Ver a seção 4 do spec.
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
 * A ORDEM importa: os cards pousam na ordem do DOM, e a grade preenche em
 * varredura, primeira linha da esquerda para a direita e depois a de baixo. É
 * a mesma cascata ordenada da referência, e ela sai de graça porque quem
 * decide o instante do pouso é o índice do card.
 */
export async function Cardapio() {
  const cats = await getCategorias();
  return (
    <section id="cardapio">
      <FileiraEmEspiral cabecalho={<CabecalhoDoCardapio />}>
        {cats.map((c) => (
          <CardDeCategoria key={c.slug} categoria={c} />
        ))}
      </FileiraEmEspiral>
    </section>
  );
}

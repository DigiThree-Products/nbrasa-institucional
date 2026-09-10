import { getCategorias } from "@/lib/conteudo";
import { anelDePapel, RAIO_DO_PAPEL } from "@/lib/papelDoTexto";
import { FileiraEmEspiral } from "@/components/sections/FileiraEmEspiral";
import { CardDeCategoria } from "@/components/sections/CardDeCategoria";

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
 * de o comentário do tipo afirmar o contrário. Versões anteriores deste
 * comentário apostavam que ele voltaria a ter uso quando o card ganhasse foto.
 * O card ganhou foto em 2026-09-10 e `destaque` seguiu sem consumidor, porque
 * a grade da referência tem seis células do mesmo tamanho e não há tile grande
 * para escolher. Ele volta ao jogo se algum dia a grade voltar a ter um card
 * maior que os outros.
 *
 * O card em si mora em `CardDeCategoria.tsx`, e não aqui. Este módulo importa
 * a fachada do Supabase, o que o torna impossível de montar em jsdom; o card
 * precisa de teste unitário e por isso ficou fora dele.
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

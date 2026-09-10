/**
 * Fita de anúncio da Delivery, em marquee.
 *
 * Server Component e CSS puro: um marquee é movimento decorativo e não vale
 * um byte de JavaScript no orçamento. A animação e a pausa sob
 * `prefers-reduced-motion` vivem em `app/globals.css`, presas à classe
 * `.parede-tipos`, renomear aqui sem mexer lá para o efeito em silêncio.
 *
 * A faixa é renderizada duas vezes de propósito. O keyframe desloca 50% e
 * volta a zero: com uma cópia só, o retorno pisca; com duas, o ponto de
 * emenda cai fora da tela e o laço fica invisível.
 *
 * Sob `faixaBranca` ela vira a fita: uma peça branca contínua, de borda
 * reta, levemente inclinada e mais larga que a tela, com a frase correndo
 * numa linha só. Quem lê o movimento é o texto, não a borda, e é por isso
 * que a inclinação e a sangria andam juntas com o fundo: sem a sangria a
 * inclinação descobre os cantos e aparece um triângulo vermelho em cada
 * ponta. Sem a prop, a parede continua sendo a marca d'água magra que o
 * Cardápio usa dentro da coluna de 1280px.
 */

/**
 * A frase, inteira, com o ponto final que separa uma repetição da seguinte.
 *
 * Ela é uma unidade só de propósito: repartida em blocos, cada pedaço podia
 * cair numa família diferente e a linha perdia o alinhamento.
 */
const FRASE = "ENTREGAMOS DO PONTAL ATÉ A VEROLME.";

/** Repetido o bastante para encher a faixa mais larga sem vão no fim. */
const VEZES = 4;

/**
 * O que a Owners TRIAL desenha: caixa alta e baixa sem acento, dígito,
 * pontuação básica e a aspa curva da grafia da marca. A lista é branca de
 * propósito: qualquer caractere fora dela é suspeito até prova em contrário.
 */
const DENTRO_DA_OWNERS = /^[A-Za-z0-9 ’.,!?-]*$/;

/**
 * Família do texto, decidida pelo próprio texto.
 *
 * A Owners TRIAL não tem letra acentuada, e um texto acentuado deixado em
 * `font-display` não some: o navegador desenha o que a Owners tem e joga o
 * resto na fonte de fallback, no meio da palavra, com outro peso e outra
 * largura. Quando isso acontece o texto inteiro sai para a fonte de corpo,
 * que é variável. É o mesmo caminho dos links do MenuMobile e das etiquetas
 * de bairro da rota, onde "Cardápio" e "Programação" também não se
 * reescrevem.
 *
 * A aspa curva fica de fora da conta porque a Owners a desenha, e a grafia
 * da marca depende disso: "N’BRASA" precisa continuar display.
 */
export function classeDaFamilia(texto: string) {
  return DENTRO_DA_OWNERS.test(texto) ? "font-display" : "font-corpo";
}

/**
 * Corpo pequeno e entreletra larga, na proporção da referência: a fita tem
 * cerca de sete vezes a altura do corpo, e é essa folga que a faz parecer
 * uma etiqueta e não um título deitado.
 */
const TIPO = "text-[clamp(.8rem,1.05vw,1.05rem)] tracking-[.2em] font-semibold";

/** Espaço entre o ponto final de uma repetição e o começo da seguinte. */
const RESPIRO = "pr-[3em]";

/**
 * Altura da fita, contada no corpo do texto, e a inclinação.
 *
 * A sangria precisa cobrir a tela inteira mesmo com a fita torta: a 1,2 grau
 * as pontas sobem cerca de 16px numa janela de 1440, e 8% de largura extra,
 * metade para cada lado, mantém os cantos fora do quadro. A seção da Delivery
 * já tem `overflow-hidden`, então o que sangra é aparado por ela.
 */
const ALTURA = "h-[4.4em]";
const INCLINACAO = "-rotate-[1.2deg]";
const SANGRIA = "w-[108%] -ml-[4%]";

function Faixa() {
  return (
    <span data-faixa className="flex flex-none">
      {Array.from({ length: VEZES }).map((_, volta) => (
        <span
          key={volta}
          data-bloco
          className={`flex-none ${RESPIRO} ${classeDaFamilia(FRASE)}`}
        >
          {FRASE}
        </span>
      ))}
    </span>
  );
}

export function ParedeDeTipos({
  className = "",
  corTexto = "text-carvao",
  faixaBranca = false,
}: {
  className?: string;
  corTexto?: string;
  faixaBranca?: boolean;
}) {
  const fita = faixaBranca
    ? `bg-branco ${INCLINACAO} ${SANGRIA} ${ALTURA}`
    : "";
  return (
    <div aria-hidden="true" className={`parede-tipos ${fita} ${className}`}>
      <div
        className={`flex h-full w-max items-center ${TIPO} uppercase leading-none ${corTexto}`}
      >
        <Faixa />
        <Faixa />
      </div>
    </div>
  );
}

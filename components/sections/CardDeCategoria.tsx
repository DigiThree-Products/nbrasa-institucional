import type { Categoria } from "@/lib/conteudo.tipos";
import { veuDaFoto } from "@/lib/veuDaFoto";
import { Chama } from "@/components/ui/Chama";

/**
 * O card de categoria do Cardapio, em arquivo proprio.
 *
 * Ele morava dentro de `Cardapio.tsx` ate ganhar foto, em 2026-09-10, e saiu
 * de la pelo mesmo motivo que `lib/tituloHero.ts` existe: `Cardapio` e Server
 * Component `async` e importa a fachada do Supabase, entao qualquer teste em
 * jsdom que tocasse aquele modulo morria pedindo variavel de ambiente. O card
 * agora tem duas frentes, um `<picture>` que cita arquivo por nome e um veu
 * que sustenta o contraste do texto, e nada disso pode ficar sem teste.
 *
 * Aqui nao entra nenhuma chamada de dados: o card recebe a `Categoria` pronta.
 */

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
 * Larguras do card, para o navegador escolher o derivado certo.
 *
 * Precisa bater com a grade de `FileiraEmEspiral`: coluna única abaixo de
 * 640px, duas colunas de `sm` em diante, e de 1024px para cima quatro cards
 * dentro de `max-w-[1280px]`, o que dá 220px em 1024 e 284px no limite. O 288
 * é esse teto arredondado para cima. Errado aqui, o celular baixa o arquivo
 * grande e ninguém percebe.
 */
const LARGURAS_DO_CARD = "(min-width: 1024px) 288px, (min-width: 640px) 46vw, 100vw";

/**
 * A foto do prato e o véu que a segura, as duas camadas de baixo da frente.
 *
 * `<picture>` e `<img>` crus, e não `next/image`, pelo mesmo motivo do herói e
 * da rota do delivery: o componente do Next é de cliente e custa bundle, e
 * estes arquivos já saem prontos de `scripts/gerar-pratos.py`. Há teste que
 * falha se um derivado citado aqui não existir em `public/`.
 *
 * O véu é irmão da foto, e não um `background` dela, porque precisa cobrir a
 * foto inteira com a própria rampa. A conta dele mora em `lib/veuDaFoto.ts`,
 * com teste, e o par de contraste que ele sustenta está em
 * `tests/unit/contraste.test.ts`.
 */
function FotoDoPrato({ caminho }: { caminho: string }) {
  return (
    <>
      <picture>
        <source
          type="image/avif"
          srcSet={`${caminho}-320.avif 320w, ${caminho}-640.avif 640w`}
          sizes={LARGURAS_DO_CARD}
        />
        <source
          type="image/webp"
          srcSet={`${caminho}-320.webp 320w, ${caminho}-640.webp 640w`}
          sizes={LARGURAS_DO_CARD}
        />
        {/* alt vazio de propósito: o nome da categoria está no `h3` logo
            abaixo, e repetir "Burgers" aqui faria o leitor de tela dizer a
            mesma coisa duas vezes. width e height são os do derivado, para o
            card não pular quando a foto chega. */}
        <img
          src={`${caminho}-640.jpg`}
          alt=""
          width={640}
          height={427}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: veuDaFoto() }}
      />
    </>
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
 * O `indice` decide duas coisas de uma vez, e é o mesmo número nas duas: a
 * célula onde o card pousa, por `CELULAS`, e o instante em que ele pousa, que
 * `lib/espiral.ts` tira da posição dele entre os irmãos. Não há como as duas
 * saírem de sincronia.
 *
 * A descrição só aparece de `xl` para cima, e só no card SEM foto. Numa grade
 * de duas colunas dentro da coluna direita, a 1024px de janela o card tem
 * 231px de largura, e três linhas de descrição ali viram mancha. No card com
 * foto ela sai de vez: a fotografia já é o argumento de apetite, e três linhas
 * por cima dela obrigariam o véu a subir e engolir o prato. Kicker e nome
 * aparecem sempre.
 *
 * ── As duas frentes ────────────────────────────────────────────────────────
 * Desde 2026-09-10 a frente tem dois estados, decididos por `fotoPath`. Com
 * foto ela é fotografia sangrando nos quatro lados, véu de carvão na base e
 * texto em branco. Sem foto ela é o creme chapado que a seção inteira era
 * antes, com tinta carvão e o kicker em brasa-escura.
 *
 * O caminho sem foto não é sobra de código: é o que a seção mostra enquanto
 * uma categoria nova não tem fotografia, e apagá-lo obrigaria o dono a
 * esperar o fotógrafo para publicar um item no cardápio. A categoria inativa
 * `chopp` guarda esse caso no seed.
 *
 * O kicker troca de cor junto com o fundo, e essa é a parte que erra calado.
 * `brasa-escura` existe porque vermelho pequeno reprova AA sobre creme; sobre
 * o véu quem passa é o branco. Deixar o vermelho ali no card com foto não
 * quebra nada e reprova. Ver `lib/veuDaFoto.ts` e a linha do par em
 * `tests/unit/contraste.test.ts`.
 *
 * A espiral não é tocada por nada disto: ela anima o elemento, não o que está
 * pintado dentro dele.
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
      <div
        className={`absolute inset-0 flex flex-col justify-end overflow-hidden rounded-[22px] border border-creme-borda p-5 [backface-visibility:hidden] transition-colors hover:border-brasa lg:p-4 ${
          categoria.fotoPath ? "" : "bg-creme"
        }`}
      >
        {categoria.fotoPath ? (
          <FotoDoPrato caminho={categoria.fotoPath} />
        ) : (
          /* Textura, nao conteudo: a Chama ja e aria-hidden. A opacidade
             baixa e deliberada, este par nao entra em contraste.test.ts
             porque nao ha texto por cima dela. Ela some no card com foto, onde
             brigaria com o prato em vez de texturizar um fundo vazio. */
          <Chama className="pointer-events-none absolute -right-6 -top-8 h-32 w-[87px] text-brasa opacity-[.08]" />
        )}
        {/* Sem foto, brasa-escura: rotulo pequeno sobre fundo claro (§9 do
            spec). Com foto, branco: e a unica cor que passa AA sobre o veu. */}
        <span
          className={`relative text-[.68rem] font-extrabold uppercase tracking-[.16em] ${
            categoria.fotoPath ? "text-branco" : "text-brasa-escura"
          }`}
        >
          {categoria.kicker}
        </span>
        <h3
          className={`relative mb-1 mt-2 font-display text-[1.5rem] uppercase leading-none xl:text-[1.84rem] ${
            categoria.fotoPath ? "text-branco" : ""
          }`}
        >
          {categoria.nome}
        </h3>
        {!categoria.fotoPath && (
          <p className="relative hidden text-sm leading-relaxed text-creme-texto xl:block">
            {categoria.descricao}
          </p>
        )}
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

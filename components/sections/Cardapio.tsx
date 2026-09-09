import { getCategorias } from "@/lib/conteudo";
import type { Categoria } from "@/lib/conteudo.tipos";
import { Reveal } from "@/components/motion/Reveal";
import { Chama } from "@/components/ui/Chama";
import { ParedeDeTipos } from "@/components/ui/ParedeDeTipos";

/**
 * O texto do topo do Cardápio, extraído para a espiral poder montá-lo dentro
 * do palco preso sem duplicar marcação.
 */
export function CabecalhoDoCardapio() {
  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h2 className="text-balance font-display text-[clamp(2.82rem,6.87vw,5.4rem)] uppercase leading-[.86]">
          Feito na hora,<br />servido no capricho
        </h2>
        <p className="max-w-[44ch] text-creme-texto">
          Ingredientes frescos, ponto certo e porções generosas. Cada item nasceu para ser repetido.
        </p>
      </div>

      {/* Mais apagada que na Delivery: aqui ela corre sobre o branco do body,
          e o mesmo peso que funciona sobre o vermelho viraria ruido. */}
      <ParedeDeTipos className="mb-10 opacity-10" corTexto="text-carvao" />
    </>
  );
}

/**
 * Um card de categoria.
 *
 * `backface-visibility: hidden` não é enfeite e não vale só para o desktop: a
 * hélice da espiral gira o card por trás do eixo, e de costas o texto sairia
 * espelhado. Com ele o card simplesmente não é pintado enquanto está virado.
 * Ver a seção 6.6 do spec.
 *
 * A descrição só aparece de `xl` para cima. Numa fileira de seis, a 1024px de
 * janela o card tem 147px de largura, e três linhas de descrição ali viram
 * mancha ilegível. Kicker e nome aparecem sempre.
 *
 * O fundo é `bg-creme` chapado hoje. Quando `fotoPath` deixar de ser nulo, é
 * aqui que a foto entra, como fundo do card, sem que a espiral precise ser
 * tocada: ela anima o elemento, não o que está pintado dentro dele.
 */
export function CardDeCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <article className="relative flex h-full flex-col justify-end overflow-hidden rounded-[22px] border border-creme-borda bg-creme p-5 [backface-visibility:hidden] transition-colors hover:border-brasa lg:aspect-[1/1.4] lg:p-4">
      {/* Textura, nao conteudo: a Chama ja e aria-hidden. A opacidade
          baixa e deliberada, este par nao entra em contraste.test.ts
          porque nao ha texto por cima dela. */}
      <Chama className="pointer-events-none absolute -right-8 -top-8 h-40 w-[109px] text-brasa opacity-[.08]" />
      {/* brasa-escura, nao brasa: rotulo pequeno sobre fundo claro (§9 do spec) */}
      <span className="relative text-[.68rem] font-extrabold uppercase tracking-[.16em] text-brasa-escura">
        {categoria.kicker}
      </span>
      <h3 className="relative mb-2 mt-2 font-display text-[1.5rem] uppercase leading-none xl:text-[1.84rem]">
        {categoria.nome}
      </h3>
      <p className="relative hidden text-sm leading-relaxed text-creme-texto xl:block">
        {categoria.descricao}
      </p>
    </article>
  );
}

/**
 * O Cardápio.
 *
 * O bento de quatro colunas saiu em 2026-09-09, e não por gosto: prender o
 * palco da espiral exige que ele caiba numa janela, e a seção media 1137px de
 * altura, o que não cabe nem em 1920x1080. Quem estourava era o tile grande,
 * que pedia 440px sozinho. Ver a seção 4 do spec.
 *
 * O `destaque` de `Categoria` continua sem consumidor aqui, e isso é anterior
 * a esta mudança: quem escolhia o tile grande era a posição no array, apesar
 * de o comentário do tipo afirmar o contrário. Quando o card ganhar foto, ele
 * é o candidato natural a decidir qual card é o maior da fileira.
 */
export async function Cardapio() {
  const cats = await getCategorias();
  return (
    <section id="cardapio" className="flex min-h-dvh items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
        <CabecalhoDoCardapio />
        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-6">
          {cats.map((c) => (
            <Reveal key={c.slug}>
              <CardDeCategoria categoria={c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

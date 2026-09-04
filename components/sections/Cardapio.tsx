import { getCategorias } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";
import { Chama } from "@/components/ui/Chama";
import { ParedeDeTipos } from "@/components/ui/ParedeDeTipos";

/** Vãos do grid por posição, reproduzindo o bento do mockup. */
const VAOS = [
  "sm:col-span-2 sm:row-span-2 sm:min-h-[440px]",
  "sm:col-span-2", "sm:col-span-2",
  "sm:col-span-1", "sm:col-span-1", "sm:col-span-2",
];

export async function Cardapio() {
  const cats = await getCategorias();
  return (
    <section id="cardapio" className="flex min-h-dvh items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
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

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-4">
        {cats.map((c, i) => (
          <Reveal key={c.slug} className={VAOS[i] ?? ""}>
            {/* relative e overflow-hidden existem pela marca d'agua: sem os
                dois, a chama vaza para fora do card e cobre o vizinho. */}
            <article
              className="relative flex h-full min-h-[210px] flex-col justify-end overflow-hidden rounded-[22px] border border-creme-borda bg-creme p-6 transition-all hover:-translate-y-1.5 hover:border-brasa"
            >
              {/* Textura, nao conteudo: a Chama ja e aria-hidden. A opacidade
                  baixa e deliberada, este par nao entra em contraste.test.ts
                  porque nao ha texto por cima dela. */}
              <Chama className="pointer-events-none absolute -right-8 -top-8 h-40 w-[109px] text-brasa opacity-[.08]" />
              {/* brasa-escura, nao brasa: rotulo pequeno sobre fundo claro (§9 do spec) */}
              <span className="relative text-[.68rem] font-extrabold uppercase tracking-[.16em] text-brasa-escura">
                {c.kicker}
              </span>
              <h3 className="relative mb-2 mt-2 font-display text-[1.84rem] uppercase leading-none">{c.nome}</h3>
              <p className="relative text-sm leading-relaxed text-creme-texto">{c.descricao}</p>
            </article>
          </Reveal>
        ))}
      </div>
      </div>
    </section>
  );
}

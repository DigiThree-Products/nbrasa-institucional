import { getCategorias } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";

/** Vãos do grid por posição, reproduzindo o bento do mockup. */
const VAOS = [
  "sm:col-span-2 sm:row-span-2 sm:min-h-[440px]",
  "sm:col-span-2", "sm:col-span-2",
  "sm:col-span-1", "sm:col-span-1", "sm:col-span-2",
];

export async function Cardapio() {
  const cats = await getCategorias();
  return (
    <section id="cardapio" className="mx-auto max-w-[1280px] px-6 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h2 className="text-balance font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
          Feito na hora,<br />servido no capricho
        </h2>
        <p className="max-w-[44ch] text-cinza">
          Ingredientes frescos, ponto certo e porções generosas. Cada item nasceu para ser repetido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-4">
        {cats.map((c, i) => (
          <Reveal key={c.slug} className={VAOS[i] ?? ""}>
            <article
              className="flex h-full min-h-[210px] flex-col justify-end rounded-[22px] border border-fumaca bg-fumaca p-6 transition-all hover:-translate-y-1.5 hover:border-brasa"
            >
              {/* brasa-texto, nao brasa: rotulo pequeno sobre fundo escuro (§9 do spec) */}
              <span className="text-[.68rem] font-extrabold uppercase tracking-[.16em] text-brasa-texto">
                {c.kicker}
              </span>
              <h3 className="mb-2 mt-2 font-display text-2xl uppercase leading-none">{c.nome}</h3>
              <p className="text-sm leading-relaxed text-cinza">{c.descricao}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

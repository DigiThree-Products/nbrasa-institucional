import { getDepoimentos } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";

export async function Depoimentos() {
  const itens = await getDepoimentos();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20">
      <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Quem veio, volta</p>
      <h2 className="mb-10 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
        4,2 estrelas e quase<br />300 avaliações
      </h2>
      <div className="grid gap-[18px] md:grid-cols-3">
        {itens.map((d) => (
          <Reveal key={d.id} className="h-full">
            <figure className="h-full rounded-[22px] border border-fumaca bg-fumaca p-6">
              <div aria-label={`${d.nota} de 5 estrelas`} className="text-brasa-texto">
                {"★".repeat(d.nota)}
              </div>
              <blockquote className="mt-3 text-cinza">“{d.texto}”</blockquote>
              <figcaption className="mt-4 text-[.78rem] uppercase tracking-[.11em]">
                {d.autor}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

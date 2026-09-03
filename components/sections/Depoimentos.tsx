import { getConteudo, getDepoimentos } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";

export async function Depoimentos() {
  const [c, itens] = await Promise.all([getConteudo(), getDepoimentos()]);
  return (
    <section className="flex min-h-dvh items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
      <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Quem veio, volta</p>
      <h2 className="mb-10 mt-3 text-balance font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
        {c.depoimentosTitulo}
      </h2>
      <div className="grid gap-[18px] md:grid-cols-3">
        {itens.map((d) => (
          <Reveal key={d.id} className="h-full">
            <figure className="h-full rounded-[22px] border border-fumaca bg-fumaca p-6">
              <div role="img" aria-label={`${d.nota} de 5 estrelas`} className="text-brasa-texto">
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
      </div>
    </section>
  );
}

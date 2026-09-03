import { getConteudo, getHorarios, getProgramacao } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { Reveal } from "@/components/motion/Reveal";

export async function HorariosProgramacao() {
  const [c, horarios, prog] = await Promise.all([
    getConteudo(), getHorarios(), getProgramacao(),
  ]);
  const faixas = agruparHorarios(horarios);

  return (
    <section id="programacao" className="flex min-h-dvh items-center bg-creme text-carvao">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid gap-14 md:grid-cols-2">
          <div>
            <p className="text-[.72rem] uppercase tracking-[.2em] text-creme-texto">
              Horário de funcionamento
            </p>
            <h2 className="mb-7 mt-3 text-balance font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
              {c.horariosTitulo}
            </h2>
            <ul className="list-none p-0">
              {faixas.map((f) => (
                <li key={f.label}
                    className="flex justify-between gap-5 border-b border-creme-borda py-4">
                  <span className={f.texto === FECHADO ? "text-creme-texto" : ""}>{f.label}</span>
                  <b className="font-extrabold tabular-nums">{f.texto}</b>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[.72rem] uppercase tracking-[.2em] text-creme-texto">
              Programação da semana
            </p>
            <h2 className="mb-7 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
              Tem motivo<br />pra vir todo dia
            </h2>
            <div className="grid gap-3">
              {prog.map((p) => (
                <Reveal key={p.id}>
                  <article className="flex items-baseline gap-4 rounded-2xl border-l-[5px] border-brasa bg-branco px-5 py-4">
                    <span className="flex-none basis-[108px] text-[.68rem] font-extrabold uppercase tracking-[.14em] text-brasa">
                      {p.diasLabel}
                    </span>
                    <span>
                      <span className="block font-display text-lg uppercase leading-tight">{p.titulo}</span>
                      <span className="mt-1 block text-sm text-creme-texto">{p.descricao}</span>
                    </span>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

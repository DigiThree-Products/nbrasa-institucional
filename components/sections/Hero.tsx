import { getConteudo, getHorarios } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { Botao } from "@/components/ui/Botao";

export async function Hero() {
  const [c, horarios] = await Promise.all([getConteudo(), getHorarios()]);
  const resumo = agruparHorarios(horarios).filter((f) => f.texto !== FECHADO);

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-10 pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">
            Angra dos Reis · Chopperia | Carnes
          </p>
          <h1 className="mt-4 text-balance font-display text-[clamp(3.2rem,9.2vw,7.6rem)] uppercase leading-[.86]">
            A fome<br />acende <span className="text-brasa">aqui.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-cinza">{c.heroSubtitulo}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Botao href={c.whatsappUrl}>Pedir no WhatsApp</Botao>
            <Botao href={c.ifoodUrl} variante="fantasma">Delivery iFood</Botao>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 border-t border-fumaca pt-6 text-[.78rem] uppercase tracking-[.11em] text-cinza">
            {resumo.map((f) => <span key={f.label}>{f.label} · {f.texto}</span>)}
            <span>{c.instagram}</span>
          </div>
        </div>

        {/* A foto da fachada entra quando o cliente enviar o arquivo limpo (§10.2 do spec). */}
        <div className="aspect-[4/3.2] rotate-2 rounded-[26px] border-[3px] border-fumaca bg-fumaca shadow-[0_30px_70px_rgba(0,0,0,.55)]" />
      </div>
    </section>
  );
}

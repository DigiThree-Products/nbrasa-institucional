import { getConteudo } from "@/lib/conteudo";
import { Botao } from "@/components/ui/Botao";

export async function OndeEstamos() {
  const c = await getConteudo();
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${c.endereco}, ${c.cidadeUf}`,
  )}`;
  return (
    <section id="onde" className="flex min-h-dvh items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
      <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Venha nos visitar</p>
      <h2 className="mb-10 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
        Estamos a um passo<br />da vista mar
      </h2>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Endereço</h3>
          <address className="mt-3 not-italic">
            <p>{c.endereco}</p>
            <p>{c.cidadeUf} · {c.cep}</p>
          </address>
          <div className="mt-6"><Botao href={maps} variante="fantasma">Como chegar</Botao></div>
        </div>
        <div>
          <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Contato</h3>
          <p className="mt-3">
            <a href={`tel:+55${c.telefone.replace(/\D/g, "")}`}>{c.telefone}</a>
          </p>
          <p>
            <a href={`https://instagram.com/${c.instagram.replace("@", "")}`}>{c.instagram}</a>
          </p>
          <div className="mt-6"><Botao href={c.whatsappUrl}>Chamar no WhatsApp</Botao></div>
        </div>
      </div>
      </div>
    </section>
  );
}

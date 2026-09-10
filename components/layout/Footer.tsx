import { getConteudo } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";

export async function Footer() {
  const c = await getConteudo();
  /*
   * A mesma montagem de URL que vivia na seção "Venha nos visitar" até
   * 2026-09-10. Ela veio junto com a seção que saiu, e não por gosto: o
   * "Como chegar" de lá era o único caminho do site para o mapa, e o
   * endereço aqui era texto morto. `encodeURIComponent` não é opcional, o
   * endereço tem vírgula e espaço.
   */
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${c.endereco}, ${c.cidadeUf}`,
  )}`;
  return (
    /*
     * `id` porque o rodapé herdou o link "Onde estamos" do menu quando a
     * seção de mesmo assunto saiu da página. `scroll-mt` compensa o header
     * fixo, que senão cobriria a primeira linha do alvo.
     */
    <footer id="rodape" className="scroll-mt-24 border-t border-creme-borda py-14">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <span className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-carvao">
                <Chama className="h-[22px] w-[15px] text-brasa" />
              </span>
              <span className="font-display text-[1.42rem] uppercase leading-none">n’Brasa</span>
            </span>
            <p className="mt-4 text-lg">O sabor que encontra, o som.</p>
          </div>
          <div>
            <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-creme-texto">Endereço</h3>
            <address className="not-italic">
              <a href={maps} className="mt-3 block underline-offset-4 hover:underline">
                <span className="block">{c.endereco}</span>
                <span className="block">{c.cidadeUf} · {c.cep}</span>
              </a>
            </address>
          </div>
          <div>
            <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-creme-texto">Contato</h3>
            <p className="mt-3">{c.telefone}</p>
            <p>{c.instagram}</p>
          </div>
        </div>
        <p className="mt-12 border-t border-creme-borda pt-6 text-[.75rem] uppercase tracking-[.09em] text-creme-texto">
          © 2026 N’Brasa Angra · Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

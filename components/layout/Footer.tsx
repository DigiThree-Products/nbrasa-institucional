import { getConteudo } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";

export async function Footer() {
  const c = await getConteudo();
  return (
    <footer className="border-t border-fumaca py-14">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <span className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-branco">
                <Chama className="h-[19px] w-[19px] text-brasa" />
              </span>
              <span className="text-[1.42rem] leading-none">n&apos;Brasa</span>
            </span>
            <p className="mt-4 text-lg">O sabor que encontra, o som.</p>
          </div>
          <div>
            <h4 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Endereço</h4>
            <p className="mt-3">{c.endereco}</p>
            <p>{c.cidadeUf} · {c.cep}</p>
          </div>
          <div>
            <h4 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Contato</h4>
            <p className="mt-3">{c.telefone}</p>
            <p>{c.instagram}</p>
          </div>
        </div>
        <p className="mt-12 border-t border-fumaca pt-6 text-[.75rem] uppercase tracking-[.09em] text-cinza">
          © 2026 N&apos;Brasa Angra · Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}

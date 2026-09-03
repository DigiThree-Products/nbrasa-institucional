import { getCategorias } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";

export async function ChipsCategorias() {
  const cats = await getCategorias();
  return (
    <section className="flex min-h-dvh items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
      <ul className="flex list-none gap-4 overflow-x-auto p-1 pb-5">
        {cats.map((c) => (
          <li key={c.slug} className="flex-none">
            <a href="#cardapio" className="group block w-[118px] text-center">
              <span className="grid h-[118px] w-[118px] place-items-center rounded-full border-[3px] border-fumaca bg-fumaca transition-all group-hover:-translate-y-1 group-hover:border-brasa group-hover:bg-brasa">
                <Chama className="h-[46px] w-[46px] text-brasa transition-colors group-hover:text-branco" />
              </span>
              <b className="mt-3 block text-[.79rem] font-bold uppercase tracking-[.1em]">
                {c.nome}
              </b>
            </a>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

import { getConteudo } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";
import { Botao } from "@/components/ui/Botao";
import { MenuMobile, type LinkNav } from "./MenuMobile";

const LINKS: LinkNav[] = [
  { href: "#cardapio", rotulo: "Cardápio" },
  { href: "#delivery", rotulo: "Delivery" },
  { href: "#programacao", rotulo: "Programação" },
  { href: "#onde", rotulo: "Onde estamos" },
];

export async function Header() {
  const c = await getConteudo();
  return (
    <header className="sticky top-0 z-[60] border-b border-fumaca bg-carvao/85 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1280px] items-center gap-5 px-6">
        <a href="#" className="flex flex-none items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-branco">
            <Chama className="h-[19px] w-[19px] text-brasa" />
          </span>
          <span className="text-[1.42rem] leading-none">n&apos;Brasa</span>
        </a>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
               className="text-[.79rem] font-semibold uppercase tracking-[.13em] text-cinza transition-colors hover:text-branco">
              {l.rotulo}
            </a>
          ))}
          {c.campanhaAtiva && <Botao href="/campanha">{c.campanhaTitulo}</Botao>}
        </nav>

        <div className="ml-auto md:ml-0">
          <MenuMobile links={LINKS} />
        </div>
      </div>
    </header>
  );
}

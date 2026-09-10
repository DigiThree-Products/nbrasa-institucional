import type { CSSProperties } from "react";
import { getConteudo } from "@/lib/conteudo";
import { AJUSTES, mascaraChama } from "@/lib/costura";
import { Chama } from "@/components/ui/Chama";
import { Botao } from "@/components/ui/Botao";
import { MenuMobile, type LinkNav } from "./MenuMobile";
import { RolagemDoCabecalho } from "./RolagemDoCabecalho";

const LINKS: LinkNav[] = [
  { href: "#cardapio", rotulo: "Cardápio" },
  { href: "#delivery", rotulo: "Delivery" },
  { href: "#programacao", rotulo: "Programação" },
  { href: "#onde", rotulo: "Onde estamos" },
];

/**
 * O fundo do header usa a mesma geometria da foto do herói, invertida no CSS.
 * Compartilhar estes valores evita uma largura aproximada que só alinharia em
 * uma viewport específica.
 *
 * Elas são declaradas AQUI, e não herdadas do herói: o header é irmão do
 * `<main>`, nunca foi descendente do `<section>` do `Hero`, e por isso a troca
 * para `fixed` não muda nada neste ponto. A que falta na lista é
 * `--costura-rolagem`, que não é geometria e sim posição no tempo: quem a
 * escreve é `RolagemDoCabecalho`, a cada quadro de scroll.
 */
const VARIAVEIS = {
  "--costura-mascara": mascaraChama("borda"),
  "--costura-escala": String(AJUSTES.escala),
  "--costura-altura": AJUSTES.altura,
} as CSSProperties;

export async function Header() {
  const c = await getConteudo();
  return (
    <header
      id="cabecalho"
      // `fixed` no desktop, e não mais `absolute`: a barra acompanha o site
      // inteiro. O recorte, que antes descia junto com o herói de graça, passa
      // a depender do deslocamento que `RolagemDoCabecalho` escreve. No mobile
      // segue `sticky`, que já dava esse comportamento sem custo nenhum.
      className="cabecalho-hero sticky top-0 z-[60] bg-branco/85 backdrop-blur-md lg:fixed lg:inset-x-0"
      style={VARIAVEIS}
    >
      <RolagemDoCabecalho />

      <div className="cabecalho-conteudo mx-auto flex h-[74px] max-w-[1280px] items-center gap-5 px-6">
        <a href="#conteudo" className="flex flex-none items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-carvao">
            <Chama className="h-[22px] w-[15px] text-brasa" />
          </span>
          <span className="font-display text-[1.42rem] uppercase leading-none">n’Brasa</span>
        </a>

        <nav className="cabecalho-nav ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
               className="text-[.79rem] font-semibold uppercase tracking-[.13em] text-creme-texto transition-colors hover:text-carvao">
              {l.rotulo}
            </a>
          ))}
          {c.campanhaAtiva && <Botao href="/campanha">{c.campanhaTitulo}</Botao>}
        </nav>

        <div className="cabecalho-menu ml-auto md:ml-0">
          <MenuMobile links={LINKS} />
        </div>
      </div>
    </header>
  );
}

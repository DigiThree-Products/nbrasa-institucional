import { getConteudo } from "@/lib/conteudo";
import { Botao } from "@/components/ui/Botao";
import { Chama } from "@/components/ui/Chama";
import { RotaMascote } from "./RotaMascote";

const PARADAS = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "japuiba", bairro: "Japuíba" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "mambucaba", bairro: "Mambucaba" },
];

/**
 * A única faixa de cor saturada da página.
 *
 * Sobre o vermelho de marca só o branco passa AA para texto normal (5,31:1),
 * então não há tom intermediário aqui: a hierarquia secundária vem de corpo,
 * peso e tracking. Carvão aparece só em display grande e em grafismo, onde
 * 3,09:1 basta. Ver tests/unit/contraste.test.ts.
 */
export async function Delivery() {
  const c = await getConteudo();
  return (
    <section id="delivery" className="relative min-h-[140dvh] overflow-hidden bg-brasa pt-16 text-branco">
      {/* Marca d'agua, direto da sacola kraft do material de delivery: a
          chama sobe pela lateral esquerda. brasa-escura sobre brasa da
          1,21:1, quase invisivel de proposito, e textura e nao texto. */}
      <Chama className="pointer-events-none absolute -left-20 top-[6%] h-[520px] w-[356px] text-brasa-escura" />

      <div className="relative mx-auto max-w-[760px] px-6 text-center">
        <p className="text-[.72rem] font-bold uppercase tracking-[.2em] text-branco">Delivery</p>
        <h2 className="mt-3 font-display text-[clamp(3.19rem,10.31vw,7.85rem)] uppercase leading-[.86]">
          Vai <span className="text-carvao">N’brasando</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-branco">
          O sabor sai da brasa e vai até você. Role a página e siga a rota, de Angra ao seu sofá, sem perder a temperatura.
        </p>

        {/* Caixa baixa de proposito: e assim que aparece na embalagem. Em
            carvao, que sobre o vermelho faz 3,09:1, valido porque o menor
            corpo aqui e 41,6px, bem acima do limite de texto grande. */}
        <p className="mt-10 font-display text-[clamp(2.6rem,7vw,4.6rem)] leading-[.82] text-carvao">
          feel<br />the<br />fire
        </p>
      </div>

      <RotaMascote paradas={PARADAS} />

      <div className="relative flex flex-wrap justify-center gap-3 px-6 pb-20">
        <Botao href={c.whatsappUrl} variante="claro">Pedir no WhatsApp</Botao>
      </div>
    </section>
  );
}

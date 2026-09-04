import { getConteudo } from "@/lib/conteudo";
import { Botao } from "@/components/ui/Botao";
import { RotaMascote } from "./RotaMascote";

const PARADAS = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "japuiba", bairro: "Japuíba" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "mambucaba", bairro: "Mambucaba" },
];

export async function Delivery() {
  const c = await getConteudo();
  return (
    <section id="delivery" className="relative min-h-[140dvh] overflow-hidden pt-16">
      <div className="mx-auto max-w-[760px] px-6 text-center">
        <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Delivery</p>
        <h2 className="mt-3 font-display text-[clamp(2.6rem,8.4vw,6.4rem)] uppercase leading-[.86]">
          Vai <span className="text-brasa">N&apos;brasando</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-cinza">
          O sabor sai da brasa e vai até você. Role a página e siga a rota, de Angra ao seu sofá, sem perder a temperatura.
        </p>
      </div>

      <RotaMascote paradas={PARADAS} />

      <div className="flex flex-wrap justify-center gap-3 px-6 pb-20">
        <Botao href={c.whatsappUrl}>Pedir no WhatsApp</Botao>
      </div>
    </section>
  );
}

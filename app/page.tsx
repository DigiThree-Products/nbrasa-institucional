import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ChipsCategorias } from "@/components/sections/ChipsCategorias";
import { Cardapio } from "@/components/sections/Cardapio";
import { Delivery } from "@/components/sections/Delivery";
import { HorariosProgramacao } from "@/components/sections/HorariosProgramacao";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { OndeEstamos } from "@/components/sections/OndeEstamos";
import { DivisoriaCurva } from "@/components/ui/DivisoriaCurva";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <ChipsCategorias />
        <Cardapio />
        {/* A Delivery é a única faixa escura da página: as duas curvas abaixo
            são a entrada e a saída dela. A de cima nasce no branco do body e
            preenche carvão; a de baixo precisa do corOrigem para levar o
            carvão consigo e devolver a página ao branco. */}
        <DivisoriaCurva corDestino="var(--color-carvao)" />
        <Delivery />
        <DivisoriaCurva
          corOrigem="var(--color-carvao)"
          corDestino="var(--color-branco)"
          className="-mt-px"
        />
        <HorariosProgramacao />
        <Depoimentos />
        <OndeEstamos />
      </main>
      <Footer />
    </>
  );
}

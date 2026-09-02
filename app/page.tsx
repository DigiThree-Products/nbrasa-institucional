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
        <Delivery />
        <DivisoriaCurva corDestino="var(--color-creme)" />
        <HorariosProgramacao />
        <Depoimentos />
        <OndeEstamos />
      </main>
      <Footer />
    </>
  );
}

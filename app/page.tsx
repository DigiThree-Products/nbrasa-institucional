import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { ChipsCategorias } from "@/components/sections/ChipsCategorias";
import { Cardapio } from "@/components/sections/Cardapio";
import { Delivery } from "@/components/sections/Delivery";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <ChipsCategorias />
        <Cardapio />
        <Delivery />
      </main>
    </>
  );
}

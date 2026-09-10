import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Cardapio } from "@/components/sections/Cardapio";
import { Delivery } from "@/components/sections/Delivery";
import { HorariosProgramacao } from "@/components/sections/HorariosProgramacao";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { DivisoriaCurva } from "@/components/ui/DivisoriaCurva";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <Cardapio />
        {/* A Delivery é a única faixa de cor saturada da página: as duas
            curvas abaixo são a entrada e a saída dela. A de cima nasce no
            branco do body e preenche brasa; a de baixo precisa do corOrigem
            para levar o brasa consigo e devolver a página ao branco. */}
        <DivisoriaCurva corDestino="var(--color-brasa)" />
        <Delivery />
        <DivisoriaCurva
          corOrigem="var(--color-brasa)"
          corDestino="var(--color-branco)"
          className="-mt-px"
        />
        <HorariosProgramacao />
        {/* As avaliações fecham a página desde 2026-09-10. A seção "Venha nos
            visitar" saiu a pedido do cliente: endereço e contato já estavam
            repetidos no rodapé, logo abaixo dela, e ela custava uma tela
            cheia para dizer o mesmo. Quem herdou o link "Onde estamos" do
            menu foi o rodapé, e o endereço de lá virou link para o mapa. */}
        <Depoimentos />
      </main>
      <Footer />
    </>
  );
}

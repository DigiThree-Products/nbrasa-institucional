import type { Metadata } from "next";
import { Hanken_Grotesk, Anton } from "next/font/google";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { Preloader } from "@/components/motion/Preloader";
import { DadosEstruturados } from "@/components/seo/DadosEstruturados";
import "./globals.css";

const corpo = Hanken_Grotesk({
  subsets: ["latin"], display: "swap", variable: "--fonte-corpo",
});
// Anton é substituta provisória da Owners (comercial). Ver §10 do spec.
const display = Anton({
  subsets: ["latin"], weight: "400", display: "swap", variable: "--fonte-display",
});

export const metadata: Metadata = {
  title: "N'Brasa Angra | Chopperia e Carnes na Av. Júlio Maria",
  description:
    "Bar com atrações musicais, chopp gelado, burguers, espetos e petiscos no Centro de Angra dos Reis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${display.variable}`}>
      <body>
        <DadosEstruturados />
        <Preloader />
        <a href="#conteudo"
           className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-brasa focus:px-4 focus:py-2">
          Pular para o conteúdo
        </a>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}

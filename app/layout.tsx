import type { Metadata } from "next";
import { Hanken_Grotesk, Anton } from "next/font/google";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { DadosEstruturados } from "@/components/seo/DadosEstruturados";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const corpo = Hanken_Grotesk({
  subsets: ["latin"], display: "swap", variable: "--fonte-corpo",
});
// Anton é substituta provisória da Owners (comercial). Ver §10 do spec.
const display = Anton({
  subsets: ["latin"], weight: "400", display: "swap", variable: "--fonte-display",
});

const TITULO = "N'Brasa Angra | Chopperia e Carnes na Av. Júlio Maria";
const DESCRICAO =
  "Bar com atrações musicais, chopp gelado, burguers, espetos e petiscos no Centro de Angra dos Reis.";

export const metadata: Metadata = {
  // SITE_URL é placeholder — ver lib/site.ts. Sem metadataBase, toda URL
  // relativa nas tags Open Graph resolveria contra a origem errada.
  metadataBase: new URL(SITE_URL),
  title: TITULO,
  description: DESCRICAO,
  // Todo CTA do site sai para WhatsApp/iFood: o link do N'Brasa em si vai ser
  // colado no WhatsApp e no Instagram por quem recebe recomendação — sem
  // Open Graph, isso renderiza como uma URL cinza nua nesses apps.
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: SITE_URL,
    siteName: "N'Brasa Angra",
    locale: "pt_BR",
    type: "website",
    // Sem imagem OG de propósito: exigiria arte de marca (foto da fachada ou
    // peça gráfica oficial) que o projeto ainda não tem — ver README,
    // "Pendências do cliente". Adicionar `images` aqui assim que existir.
  },
  twitter: {
    card: "summary",
    title: TITULO,
    description: DESCRICAO,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${display.variable}`}>
      <body>
        <DadosEstruturados />
        <a href="#conteudo"
           className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-brasa focus:px-4 focus:py-2">
          Pular para o conteúdo
        </a>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}

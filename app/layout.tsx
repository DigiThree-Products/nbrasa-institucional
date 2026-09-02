import type { Metadata } from "next";
import { Hanken_Grotesk, Anton } from "next/font/google";
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
      <body>{children}</body>
    </html>
  );
}

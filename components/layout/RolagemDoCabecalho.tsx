"use client";

import { useEffect } from "react";
import { deslocamentoDaMascara, passouDoHeroi } from "@/lib/cabecalho";

/**
 * Mantém o recorte do header casado com a foto do herói enquanto a página rola.
 *
 * Não desenha nada. Ele escreve duas coisas no `<header>` e o CSS faz o resto:
 * `--costura-rolagem`, que desloca a máscara pela distância já rolada, e o
 * atributo `data-fora-do-heroi`, que estende a barra quando não há mais foto
 * atrás dela.
 *
 * Ele existe porque o header passou a ser fixo. Antes ele era absoluto e
 * descia junto com o herói, então as duas máscaras nunca se separavam e nada
 * disto era necessário; esse é o preço que a barra fixa cobra. As contas em si
 * estão em `lib/cabecalho.ts`, com teste, porque as duas erram em silêncio.
 *
 * Escreve no header, e não em `:root`, de propósito: variável trocada no
 * elemento raiz invalida estilo da árvore inteira a cada quadro de scroll, e
 * aqui quem precisa saber é um elemento só.
 *
 * Os dois `id` são o contrato com a marcação: `#cabecalho` no `Header` e
 * `#heroi` no `Hero`. Faltando qualquer um dos dois o efeito desiste calado,
 * e o header fica no estado que o CSS já pinta sozinho, o recorte do topo.
 */
export function RolagemDoCabecalho() {
  useEffect(() => {
    const cabecalho = document.getElementById("cabecalho");
    const heroi = document.getElementById("heroi");
    if (!cabecalho || !heroi) return;

    // Medido uma vez e remedido só quando o herói muda de tamanho. Ler altura
    // dentro do quadro de scroll forçaria layout a cada rolagem, que é
    // exatamente o custo que o rAF existe para evitar.
    let alturaDoHeroi = heroi.offsetHeight;
    let quadro = 0;
    let estendido: boolean | null = null;

    const pinta = () => {
      quadro = 0;
      const rolagem = window.scrollY;

      cabecalho.style.setProperty(
        "--costura-rolagem",
        `${deslocamentoDaMascara(rolagem)}px`,
      );

      // Só escreve o atributo quando ele muda: `toggleAttribute` a cada quadro
      // reiniciaria a transição da barra no meio dela.
      const fora = passouDoHeroi(rolagem, alturaDoHeroi);
      if (fora !== estendido) {
        estendido = fora;
        cabecalho.toggleAttribute("data-fora-do-heroi", fora);
      }
    };

    const agenda = () => {
      if (quadro) return;
      quadro = requestAnimationFrame(pinta);
    };

    window.addEventListener("scroll", agenda, { passive: true });

    // O herói é `min-h-dvh` mais conteúdo: ele muda de altura quando a janela
    // muda e quando a fonte de display troca o desenho do título. Sem
    // remedir, o limiar envelhece e a barra se estende na hora errada.
    const observador = new ResizeObserver(() => {
      alturaDoHeroi = heroi.offsetHeight;
      agenda();
    });
    observador.observe(heroi);

    pinta();

    // Um quadro depois da primeira pintura, e não junto com ela. O CSS prende
    // as transições a este atributo: ligado antes, quem recarrega a página no
    // meio do site veria a barra nascer recortada, que é o estado inicial do
    // CSS, e se abrir sozinha na frente dele.
    const libera = requestAnimationFrame(() => {
      cabecalho.setAttribute("data-pronto", "");
    });

    return () => {
      window.removeEventListener("scroll", agenda);
      observador.disconnect();
      cancelAnimationFrame(libera);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, []);

  return null;
}

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ParedeDeTipos, classeDaFamilia } from "@/components/ui/ParedeDeTipos";

/** Uma utilitária de rotação, qualquer que seja o ângulo escolhido. */
const INCLINADA = /(^|\s)-?rotate-\[/;
/** Uma largura acima de 100%, que é o que joga as pontas para fora da tela. */
const SANGRANDO = /(^|\s)w-\[1[0-9][0-9](\.\d+)?%\]/;

function raiz(container: HTMLElement) {
  return container.firstElementChild as HTMLElement;
}

describe("ParedeDeTipos", () => {
  it("é decorativa e não entra na árvore de acessibilidade", () => {
    // É textura, não conteúdo: um leitor de tela que repetisse a frase quatro
    // vezes seguidas seria ruído puro.
    const { container } = render(<ParedeDeTipos />);
    expect(raiz(container)).toHaveAttribute("aria-hidden", "true");
  });

  it("duplica a faixa, que é o que faz a emenda do marquee ficar invisível", () => {
    // O keyframe desloca 50% e volta ao zero. Com uma cópia só, o retorno
    // pisca; com duas, o ponto de emenda cai fora da tela.
    const { container } = render(<ParedeDeTipos />);
    const faixas = container.querySelectorAll("[data-faixa]");
    expect(faixas).toHaveLength(2);
    expect(faixas[0].textContent).toBe(faixas[1].textContent);
  });

  it("carrega a classe que o CSS do marquee ancora", () => {
    // A animação e a pausa sob prefers-reduced-motion vivem em globals.css,
    // presas a `.parede-tipos`. Renomear a classe aqui sem mexer lá pararia
    // o marquee em silêncio.
    const { container } = render(<ParedeDeTipos />);
    expect(raiz(container)).toHaveClass("parede-tipos");
  });

  it("aceita trocar a cor do texto, para servir fundo claro e fundo vermelho", () => {
    const { container } = render(<ParedeDeTipos corTexto="text-branco" />);
    expect(container.querySelector(".text-branco")).not.toBeNull();
  });

  it("cada repetição traz a frase inteira", () => {
    // A fita é uma linha só. Partir a frase em pedaços aqui a quebraria sem
    // quebrar nenhum outro teste, porque a parede é aria-hidden e nenhum
    // leitor de tela reclama.
    const { container } = render(<ParedeDeTipos />);
    const faixa = container.querySelector("[data-faixa]");
    const blocos = [...faixa!.querySelectorAll("[data-bloco]")];
    expect(blocos.length).toBeGreaterThan(0);
    for (const bloco of blocos) {
      expect(bloco.textContent).toBe("ENTREGAMOS DO PONTAL ATÉ A VEROLME.");
    }
  });

  it("sem a prop, não vira fita: nada de fundo, inclinação ou sangria", () => {
    // O Cardápio usa a parede como marca d'água dentro de uma coluna de
    // 1280px, sobre página já branca. Fundo branco ali não apareceria, e a
    // sangria estouraria a coluna de uma seção que ninguém pediu para mexer.
    const { container } = render(<ParedeDeTipos />);
    const alvo = raiz(container);
    expect(alvo).not.toHaveClass("bg-branco");
    expect(alvo.className).not.toMatch(INCLINADA);
    expect(alvo.className).not.toMatch(SANGRANDO);
  });

  it("com faixaBranca, vira uma fita contínua, inclinada e sangrando", () => {
    // Os três andam juntos. Sem a sangria, a inclinação descobre os cantos e
    // aparece um triângulo vermelho em cada ponta da fita.
    const { container } = render(<ParedeDeTipos faixaBranca />);
    const alvo = raiz(container);
    expect(alvo).toHaveClass("bg-branco");
    expect(alvo.className).toMatch(INCLINADA);
    expect(alvo.className).toMatch(SANGRANDO);
  });

  it("manda o texto acentuado para a fonte de corpo", () => {
    // A Owners TRIAL não tem letra acentuada. Um texto acentuado deixado em
    // font-display não some: o navegador desenha o que a Owners tem e joga o
    // resto na fonte de fallback, no meio da palavra.
    expect(classeDaFamilia("DO PONTAL")).toBe("font-display");
    expect(classeDaFamilia("ATÉ A VEROLME")).not.toContain("font-display");
    expect(classeDaFamilia("ATÉ A VEROLME")).toContain("font-corpo");
  });

  it("deixa a aspa curva na Owners, que a desenha", () => {
    // A grafia da marca depende disso: "N’BRASA" precisa continuar display.
    expect(classeDaFamilia("N’BRASA")).toBe("font-display");
  });

  it("aplica a regra de família ao texto do próprio bloco", () => {
    // Os casos acima provam a regra; este prova que o componente a consulta
    // com o texto certo. Sem ele, dava para acertar a função e continuar
    // carimbando font-display em tudo.
    const { container } = render(<ParedeDeTipos />);
    const blocos = [...container.querySelectorAll("[data-bloco]")];
    expect(blocos.length).toBeGreaterThan(0);
    for (const bloco of blocos) {
      expect(bloco.className).toContain(
        classeDaFamilia(bloco.textContent ?? ""),
      );
    }
  });
});

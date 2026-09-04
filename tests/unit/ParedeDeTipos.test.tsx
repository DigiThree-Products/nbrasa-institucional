import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ParedeDeTipos } from "@/components/ui/ParedeDeTipos";

describe("ParedeDeTipos", () => {
  it("é decorativa e não entra na árvore de acessibilidade", () => {
    // É textura, não conteúdo: um leitor de tela que anunciasse
    // "FIRE N’BRASA VAI N’BRASANDO FIRE N’BRASA..." seria ruído puro.
    const { container } = render(<ParedeDeTipos />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
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
    expect(container.firstElementChild).toHaveClass("parede-tipos");
  });

  it("aceita trocar a cor do texto, para servir fundo claro e fundo vermelho", () => {
    const { container } = render(<ParedeDeTipos corTexto="text-branco" />);
    expect(container.querySelector(".text-branco")).not.toBeNull();
  });
});

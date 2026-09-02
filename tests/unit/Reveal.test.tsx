import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "@/components/motion/Reveal";

describe("Reveal", () => {
  it("renderiza o conteúdo visível, sem depender de animação", () => {
    render(<Reveal><p>Cardápio da casa</p></Reveal>);
    expect(screen.getByText("Cardápio da casa")).toBeVisible();
  });

  it("não zera a opacidade do wrapper no estado inicial", () => {
    const { container } = render(<Reveal><p>Visível</p></Reveal>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).not.toBe("0");
  });
});

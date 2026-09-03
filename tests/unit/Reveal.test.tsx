import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Reveal } from "@/components/motion/Reveal";

const { fromToMock, registerPluginMock } = vi.hoisted(() => ({
  fromToMock: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })),
  registerPluginMock: vi.fn(),
}));

vi.mock("gsap", () => ({
  gsap: { fromTo: fromToMock, registerPlugin: registerPluginMock },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

describe("Reveal", () => {
  beforeEach(() => {
    fromToMock.mockClear();
    registerPluginMock.mockClear();
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  });

  it("renderiza o conteúdo visível, sem depender de animação", () => {
    render(<Reveal><p>Cardápio da casa</p></Reveal>);
    expect(screen.getByText("Cardápio da casa")).toBeVisible();
  });

  it("não zera a opacidade do wrapper no estado inicial", () => {
    const { container } = render(<Reveal><p>Visível</p></Reveal>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).not.toBe("0");
  });

  it("anima com immediateRender: false, para não esconder o conteúdo até o scroll chegar", async () => {
    render(<Reveal><p>Cardápio</p></Reveal>);

    await waitFor(() => expect(fromToMock).toHaveBeenCalled());

    const vars = (fromToMock.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
    expect(vars.immediateRender).toBe(false);
  });

  it("não monta a animação quando o usuário prefere movimento reduzido", async () => {
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    render(<Reveal><p>Cardápio</p></Reveal>);

    // dá tempo suficiente para os imports dinâmicos (mockados) resolverem,
    // caso o early-return de reduced-motion não esteja funcionando
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(fromToMock).not.toHaveBeenCalled();
    expect(registerPluginMock).not.toHaveBeenCalled();
  });
});

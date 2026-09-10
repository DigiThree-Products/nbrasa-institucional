import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Reveal } from "@/components/motion/Reveal";

const { fromToMock, toMock, killTweensOfMock, registerPluginMock, createMock } = vi.hoisted(() => ({
  fromToMock: vi.fn(() => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })),
  toMock: vi.fn(),
  killTweensOfMock: vi.fn(),
  registerPluginMock: vi.fn(),
  createMock: vi.fn(() => ({ kill: vi.fn() })),
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: fromToMock, to: toMock, killTweensOf: killTweensOfMock,
    registerPlugin: registerPluginMock,
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: createMock },
}));

/** Espera o import dinâmico resolver e devolve as vars do gatilho de saída. */
async function varsDoGatilho() {
  await waitFor(() => expect(createMock).toHaveBeenCalled());
  return (createMock.mock.calls[0] as unknown[])[0] as Record<string, () => void>;
}

describe("Reveal", () => {
  beforeEach(() => {
    fromToMock.mockClear();
    toMock.mockClear();
    killTweensOfMock.mockClear();
    registerPluginMock.mockClear();
    createMock.mockClear();
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

  it("por padrão dispara uma vez só e nunca desfaz", async () => {
    // O comportamento histórico, de que Depoimentos depende: revelou, ficou.
    render(<Reveal><p>Cardápio</p></Reveal>);

    await waitFor(() => expect(fromToMock).toHaveBeenCalled());

    const vars = (fromToMock.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
    const gatilho = vars.scrollTrigger as Record<string, unknown>;
    expect(gatilho.once).toBe(true);
    expect(gatilho.toggleActions).toBeUndefined();
  });

  it("com `saida`, o gatilho tem fim e não é de uma vez só", async () => {
    render(<Reveal saida><p>Cardápio</p></Reveal>);

    const vars = await varsDoGatilho() as unknown as Record<string, unknown>;
    expect(vars.end).toBe("bottom top");
    expect(vars.once).toBeUndefined();
  });

  it("com `saida`, anima o conteúdo para fora quando ele deixa a tela", async () => {
    // Cada travessia ganha uma tween nova, em vez de reverter a de entrada.
    // Reverter não pinta o quadro final quando `lagSmoothing(0)` está ligado,
    // que é o caso no site, e o conteúdo ficava visível para sempre.
    render(<Reveal saida><p>Cardápio</p></Reveal>);

    const vars = await varsDoGatilho();
    vars.onLeave();

    const alvo = toMock.mock.calls.at(-1)![1] as Record<string, unknown>;
    expect(alvo.opacity).toBe(0);
  });

  it("com `saida`, traz o conteúdo de volta quando ele reentra na tela", async () => {
    render(<Reveal saida><p>Cardápio</p></Reveal>);

    const vars = await varsDoGatilho();
    // a ordem real: entra, sai, volta. Sem a primeira entrada, a volta ainda
    // seria a revelação inicial, e não o retorno.
    vars.onEnter();
    vars.onLeave();
    vars.onEnterBack();

    const alvo = toMock.mock.calls.at(-1)![1] as Record<string, unknown>;
    expect(alvo.opacity).toBe(1);
  });

  it("com `saida`, a primeira entrada revela a partir do estado escondido", async () => {
    // Só a primeira: nas seguintes o conteúdo já está escondido pela saída, e
    // um `fromTo` ali daria um salto em vez de continuar de onde parou.
    render(<Reveal saida><p>Cardápio</p></Reveal>);

    const vars = await varsDoGatilho();
    vars.onEnter();

    expect(fromToMock).toHaveBeenCalledTimes(1);
    const de = (fromToMock.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(de.opacity).toBe(0);

    vars.onLeave();
    vars.onEnter();
    expect(fromToMock).toHaveBeenCalledTimes(1);
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

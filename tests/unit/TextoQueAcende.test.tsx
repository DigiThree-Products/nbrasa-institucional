import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TextoQueAcende } from "@/components/motion/TextoQueAcende";

const { fromToMock, toMock, killTweensOfMock, registerPluginMock, createMock } = vi.hoisted(() => ({
  fromToMock: vi.fn(),
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

/** Vermelho de marca, duplicado aqui de propósito, como em tokens.test.ts:
 *  o teste compara com o valor do spec, não com o que o CSS disser. */
const BRASA = "#cf2434";

const semMovimento = (matches: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

async function varsDoGatilho() {
  await waitFor(() => expect(createMock).toHaveBeenCalled());
  return (createMock.mock.calls[0] as unknown[])[0] as Record<string, () => void>;
}

describe("TextoQueAcende", () => {
  beforeEach(() => {
    fromToMock.mockClear();
    toMock.mockClear();
    killTweensOfMock.mockClear();
    registerPluginMock.mockClear();
    createMock.mockClear();
    semMovimento(false);
  });

  it("entrega a frase inteira ao leitor de tela, e não letra por letra", () => {
    render(<TextoQueAcende>A semana inteira</TextoQueAcende>);
    expect(screen.getByText("A semana inteira")).toBeInTheDocument();
  });

  it("esconde a versão quebrada em letras do leitor de tela", () => {
    const { container } = render(<TextoQueAcende>Fogo</TextoQueAcende>);
    const quebrado = container.querySelector("[aria-hidden='true']");
    expect(quebrado).not.toBeNull();
  });

  it("quebra em uma peça por letra, sem contar os espaços", () => {
    const { container } = render(<TextoQueAcende>DJ na Casa</TextoQueAcende>);
    const letras = container.querySelectorAll("[data-letra]");
    // "DJnaCasa" = 8 letras; os três espaços não viram peça animável
    expect(letras).toHaveLength(8);
  });

  it("preserva os espaços entre as palavras no texto visível", () => {
    const { container } = render(<TextoQueAcende>Noite do Espetinho</TextoQueAcende>);
    const quebrado = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(quebrado.textContent).toBe("Noite do Espetinho");
  });

  it("ao entrar, acende as letras a partir do vermelho de marca", async () => {
    render(<TextoQueAcende>Fogo</TextoQueAcende>);

    const vars = await varsDoGatilho();
    vars.onEnter();

    const de = (fromToMock.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(de.color).toBe(BRASA);
    expect(de.opacity).toBe(0);
  });

  it("ao entrar, devolve a letra à cor que ela tem parada", async () => {
    // Sem isto o texto ficaria vermelho depois de acender, e cada linha da
    // seção tem a sua cor de repouso: carvão, brasa-escura ou creme-texto.
    render(<TextoQueAcende>Fogo</TextoQueAcende>);

    const vars = await varsDoGatilho();
    vars.onEnter();

    const para = (fromToMock.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
    expect(typeof para.color).toBe("function");
  });

  it("ao sair, sobe e desfoca as letras, que é o que lê como fumaça", async () => {
    render(<TextoQueAcende>Fogo</TextoQueAcende>);

    const vars = await varsDoGatilho();
    vars.onLeave();

    const alvo = (toMock.mock.calls.at(-1) as unknown[])[1] as Record<string, unknown>;
    expect(alvo.opacity).toBe(0);
    expect(alvo.y).toBeLessThan(0);
    expect(String(alvo.filter)).toMatch(/blur\(\s*[1-9]/);
  });

  it("não monta animação nenhuma quando o usuário prefere movimento reduzido", async () => {
    semMovimento(true);
    render(<TextoQueAcende>Fogo</TextoQueAcende>);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(createMock).not.toHaveBeenCalled();
    expect(fromToMock).not.toHaveBeenCalled();
  });

  it("mostra o texto mesmo sem animação, porque o conteúdo não depende dela", () => {
    semMovimento(true);
    render(<TextoQueAcende>Tarde na Orla</TextoQueAcende>);
    expect(screen.getByText("Tarde na Orla")).toBeVisible();
  });
});

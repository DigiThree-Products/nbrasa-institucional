import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Queima } from "@/components/motion/Queima";
import { LINHA_INICIAL, LINHA_FINAL, VARIAVEL_DA_LINHA } from "@/lib/queima";

const { fromToMock, toMock, setMock, killTweensOfMock, registerPluginMock, createMock } = vi.hoisted(() => ({
  fromToMock: vi.fn(),
  toMock: vi.fn(),
  setMock: vi.fn(),
  killTweensOfMock: vi.fn(),
  registerPluginMock: vi.fn(),
  createMock: vi.fn(() => ({ kill: vi.fn() })),
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: fromToMock, to: toMock, set: setMock, killTweensOf: killTweensOfMock,
    registerPlugin: registerPluginMock,
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: createMock },
}));

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

describe("Queima", () => {
  beforeEach(() => {
    fromToMock.mockClear();
    toMock.mockClear();
    setMock.mockClear();
    killTweensOfMock.mockClear();
    registerPluginMock.mockClear();
    createMock.mockClear();
    semMovimento(false);
  });

  it("mostra o conteúdo, que não depende da animação", () => {
    render(<Queima><p>Chopp gelado e música ao vivo</p></Queima>);
    expect(screen.getByText("Chopp gelado e música ao vivo")).toBeVisible();
  });

  it("não escreve máscara nenhuma antes de o GSAP entrar", () => {
    // Máscara escrita na marcação esconderia o bloco para sempre em quem
    // carregasse a página sem o GSAP.
    const { container } = render(<Queima><p>Avaliação</p></Queima>);
    expect(container.innerHTML).not.toContain("linear-gradient");
  });

  it("ao entrar, sobe a linha de fogo da base ao topo do bloco", async () => {
    render(<Queima><p>Avaliação</p></Queima>);

    const vars = await varsDoGatilho();
    vars.onEnter();

    const de = (fromToMock.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    const para = (fromToMock.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
    expect(de[VARIAVEL_DA_LINHA]).toBe(LINHA_INICIAL);
    expect(para[VARIAVEL_DA_LINHA]).toBe(LINHA_FINAL);
  });

  it("ao entrar, limpa o desfoque, que é a fumaça saindo da frente", async () => {
    // No bloco a fumaça não é uma cópia da letra, como no título: é o próprio
    // conteúdo entrando borrado e ganhando foco enquanto o fogo sobe.
    render(<Queima><p>Avaliação</p></Queima>);

    const vars = await varsDoGatilho();
    vars.onEnter();

    const de = (fromToMock.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    const para = (fromToMock.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
    expect(String(de.filter)).toMatch(/blur\(\s*[1-9]/);
    expect(String(para.filter)).toMatch(/blur\(\s*0/);
  });

  it("escalona pelo atraso, que é o que faz um card entrar depois do outro", async () => {
    render(<Queima delay={0.2}><p>Avaliação</p></Queima>);

    const vars = await varsDoGatilho();
    vars.onEnter();

    const para = (fromToMock.mock.calls[0] as unknown[])[2] as Record<string, unknown>;
    expect(para.delay).toBe(0.2);
  });

  it("nasce escondido quando ainda está abaixo da janela", async () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () =>
      ({ top: window.innerHeight + 400 }) as DOMRect;

    render(<Queima><p>Avaliação</p></Queima>);
    await waitFor(() => expect(setMock).toHaveBeenCalled());

    const vars = setMock.mock.calls.map((c) => (c as unknown[])[1] as Record<string, unknown>);
    expect(vars.some((v) => v[VARIAVEL_DA_LINHA] === LINHA_INICIAL)).toBe(true);
    Element.prototype.getBoundingClientRect = original;
  });

  it("não esconde o que o visitante já tem à vista", async () => {
    render(<Queima><p>Avaliação</p></Queima>);
    await varsDoGatilho();

    const vars = setMock.mock.calls.map((c) => (c as unknown[])[1] as Record<string, unknown>);
    expect(vars.some((v) => v[VARIAVEL_DA_LINHA] === LINHA_INICIAL)).toBe(false);
  });

  it("ao sair, sobe e desfoca, que é o que lê como fumaça", async () => {
    render(<Queima><p>Avaliação</p></Queima>);

    const vars = await varsDoGatilho();
    vars.onLeave();

    const alvo = (toMock.mock.calls.at(-1) as unknown[])[1] as Record<string, unknown>;
    expect(alvo.opacity).toBe(0);
    expect(alvo.y).toBeLessThan(0);
    expect(String(alvo.filter)).toMatch(/blur\(\s*[1-9]/);
  });

  it("não monta animação nenhuma quando o usuário prefere movimento reduzido", async () => {
    semMovimento(true);
    render(<Queima><p>Avaliação</p></Queima>);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(createMock).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });
});

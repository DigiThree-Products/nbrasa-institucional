import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AcendeEmBrasa } from "@/components/motion/AcendeEmBrasa";
import { EMENDA_DAS_FASES } from "@/lib/brasa";

const { timelineMock, fromToMock, toMock, setMock, killTweensOfMock, registerPluginMock, createMock } =
  vi.hoisted(() => {
    const fromTo = vi.fn();
    const to = vi.fn();
    const linha = { fromTo, to };
    fromTo.mockReturnValue(linha);
    to.mockReturnValue(linha);
    return {
      timelineMock: vi.fn(() => linha),
      fromToMock: fromTo,
      toMock: to,
      setMock: vi.fn(),
      killTweensOfMock: vi.fn(),
      registerPluginMock: vi.fn(),
      createMock: vi.fn(() => ({ kill: vi.fn() })),
    };
  });

vi.mock("gsap", () => ({
  gsap: {
    timeline: timelineMock, to: toMock, set: setMock,
    killTweensOf: killTweensOfMock, registerPlugin: registerPluginMock,
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { create: createMock } }));

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

/** O estado de partida e o de chegada da primeira tween da linha do tempo. */
function fases() {
  const chamada = fromToMock.mock.calls.at(-1) as unknown[];
  return {
    brasa: chamada[1] as Record<string, unknown>,
    chama: chamada[2] as Record<string, unknown>,
  };
}

describe("AcendeEmBrasa", () => {
  beforeEach(() => {
    timelineMock.mockClear();
    fromToMock.mockClear();
    toMock.mockClear();
    setMock.mockClear();
    killTweensOfMock.mockClear();
    registerPluginMock.mockClear();
    createMock.mockClear();
    semMovimento(false);
  });

  it("mostra o conteúdo, que não depende da animação", () => {
    render(<AcendeEmBrasa><h2>A semana inteira pede brasa</h2></AcendeEmBrasa>);
    expect(screen.getByText("A semana inteira pede brasa")).toBeVisible();
  });

  it("anima UM elemento, e não um por letra", async () => {
    /*
     * É a correção inteira, e o teste existe para ela não se perder. A queima
     * animava letra a letra e media 62,4 ms por quadro contra 16,7 ms do
     * controle; o custo é linear no número de alvos. Quem voltar a quebrar o
     * texto em `span` por letra faz este teste falhar.
     */
    const { container } = render(
      <AcendeEmBrasa><h2>A semana inteira pede brasa</h2></AcendeEmBrasa>,
    );
    const vars = await varsDoGatilho();
    vars.onEnter();

    expect(container.querySelectorAll("[data-letra]")).toHaveLength(0);
    const alvo = (fromToMock.mock.calls.at(-1) as unknown[])[0];
    expect(Array.isArray(alvo)).toBe(false);
  });

  it("nasce brasa fosca e vira chama acesa", async () => {
    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    const vars = await varsDoGatilho();
    vars.onEnter();

    const { brasa, chama } = fases();
    expect(brasa.opacity).toBe(0);
    expect(chama.opacity).toBe(1);
    expect(String(brasa.filter)).toMatch(/blur\(\s*[1-9]/);
  });

  it("emenda o assento antes de a chama acabar", async () => {
    // Sem sobreposição o texto trava em vermelho cheio entre as duas tweens.
    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    const vars = await varsDoGatilho();
    vars.onEnter();

    const posicao = (toMock.mock.calls.at(-1) as unknown[])[2];
    expect(posicao).toBe(EMENDA_DAS_FASES);
  });

  it("limpa brilho e desfoque quando o fogo acaba", async () => {
    /*
     * Halo esquecido fica vermelho na tela para sempre, e o desfoque deixa o
     * título borrado parado. Nada lança nos dois casos.
     */
    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    const vars = await varsDoGatilho();
    vars.onEnter();

    const assento = (toMock.mock.calls.at(-1) as unknown[])[1] as Record<string, unknown>;
    expect(String(assento.filter)).toMatch(/blur\(\s*0/);
    (assento.onComplete as () => void)();
    const limpeza = setMock.mock.calls.at(-1) as unknown[];
    expect(String((limpeza[1] as Record<string, unknown>).clearProps)).toContain("textShadow");
  });

  it("usa o brilho que recebe, para a seção com foto poder fugir do vermelho", async () => {
    render(
      <AcendeEmBrasa brilho="#241e1f"><h2>Quem veio, volta</h2></AcendeEmBrasa>,
    );
    const vars = await varsDoGatilho();
    vars.onEnter();

    expect(String(fases().chama.textShadow)).toContain("#241e1f");
  });

  it("escalona pelo atraso, que é o que faz um card entrar depois do outro", async () => {
    render(<AcendeEmBrasa delay={0.2}><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    const vars = await varsDoGatilho();
    vars.onEnter();

    expect((timelineMock.mock.calls.at(-1) as unknown[])[0]).toMatchObject({ delay: 0.2 });
  });

  it("nasce escondido quando ainda está abaixo da janela", async () => {
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () =>
      ({ top: window.innerHeight + 400 }) as DOMRect;

    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    await waitFor(() => expect(setMock).toHaveBeenCalled());

    const vars = setMock.mock.calls.map((c) => (c as unknown[])[1] as Record<string, unknown>);
    expect(vars.some((v) => v.opacity === 0)).toBe(true);
    Element.prototype.getBoundingClientRect = original;
  });

  it("não esconde o que o visitante já tem à vista", async () => {
    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    await varsDoGatilho();

    const vars = setMock.mock.calls.map((c) => (c as unknown[])[1] as Record<string, unknown>);
    expect(vars.some((v) => v.opacity === 0)).toBe(false);
  });

  it("ao sair, sobe e desfoca, que é o que lê como fumaça", async () => {
    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);
    const vars = await varsDoGatilho();
    vars.onLeave();

    const alvo = (toMock.mock.calls.at(-1) as unknown[])[1] as Record<string, unknown>;
    expect(alvo.opacity).toBe(0);
    expect(alvo.y).toBeLessThan(0);
  });

  it("não monta animação nenhuma quando o usuário prefere movimento reduzido", async () => {
    semMovimento(true);
    render(<AcendeEmBrasa><h2>Quem veio, volta</h2></AcendeEmBrasa>);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(createMock).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });
});

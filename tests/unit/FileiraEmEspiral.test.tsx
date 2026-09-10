import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FileiraEmEspiral } from "@/components/sections/FileiraEmEspiral";

const { addMock, matchMediaMock, registerPluginMock, createMock } = vi.hoisted(() => {
  const addMock = vi.fn();
  return {
    addMock,
    matchMediaMock: vi.fn(() => ({ add: addMock, revert: vi.fn() })),
    registerPluginMock: vi.fn(),
    createMock: vi.fn(() => ({ kill: vi.fn() })),
  };
});

vi.mock("gsap", () => ({
  gsap: { matchMedia: matchMediaMock, registerPlugin: registerPluginMock },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: createMock },
}));

function montar() {
  return render(
    <FileiraEmEspiral cabecalho={<h2>Feito na hora</h2>}>
      <article>Burgers</article>
      <article>Espetinhos</article>
      <article>Drinks</article>
    </FileiraEmEspiral>,
  );
}

describe("FileiraEmEspiral", () => {
  beforeEach(() => {
    addMock.mockClear();
    matchMediaMock.mockClear();
    registerPluginMock.mockClear();
    createMock.mockClear();
  });

  it("mostra o cabeçalho e todos os cards, sem depender de animação", () => {
    montar();
    expect(screen.getByText("Feito na hora")).toBeVisible();
    expect(screen.getByText("Burgers")).toBeVisible();
    expect(screen.getByText("Espetinhos")).toBeVisible();
    expect(screen.getByText("Drinks")).toBeVisible();
  });

  it("não escreve transformação nenhuma no primeiro quadro", () => {
    montar();
    for (const card of screen.getAllByRole("article")) {
      expect((card as HTMLElement).style.transform).toBe("");
    }
  });

  it("preserva a ordem recebida, que é a ordem de pouso", () => {
    montar();
    const textos = screen.getAllByRole("article").map((e) => e.textContent);
    expect(textos).toEqual(["Burgers", "Espetinhos", "Drinks"]);
  });

  it("prende a cena só no desktop e só sem pedido de menos movimento", async () => {
    montar();
    await waitFor(() => expect(addMock).toHaveBeenCalled());

    const consulta = addMock.mock.calls[0]![0] as string;
    expect(consulta).toContain("min-width: 1024px");
    expect(consulta).toContain("prefers-reduced-motion: no-preference");
  });

  it("usa matchMedia do GSAP, e não uma saída antecipada por largura", async () => {
    // Saída antecipada só decide na montagem. Quem redimensiona a janela
    // atravessando 1024px ficaria com palco preso em layout de coluna única.
    montar();
    await waitFor(() => expect(matchMediaMock).toHaveBeenCalled());
  });
});

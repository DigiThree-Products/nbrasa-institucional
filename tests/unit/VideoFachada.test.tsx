import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { VideoFachada } from "@/components/sections/VideoFachada";

/** Faz `matchMedia` responder o que o teste quiser sobre reduced-motion. */
function fingirReducedMotion(ativo: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: ativo,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("VideoFachada", () => {
  it("não monta o vídeo sob prefers-reduced-motion", () => {
    vi.useFakeTimers();
    fingirReducedMotion(true);

    const { container } = render(
      <VideoFachada poster="/fachada-nbrasa-1600.jpg" recorte="58% 50%" />,
    );
    act(() => { vi.advanceTimersByTime(5000); });

    // Não é só sobre movimento: sem o elemento, o 1 MB não é nem requisitado.
    expect(container.querySelector("video")).toBeNull();
  });

  it("monta o vídeo depois da primeira pintura quando o movimento é permitido", () => {
    vi.useFakeTimers();
    fingirReducedMotion(false);

    const { container } = render(
      <VideoFachada poster="/fachada-nbrasa-1600.jpg" recorte="58% 50%" />,
    );
    // Antes do adiamento, nada: é isso que tira o vídeo da disputa com o LCP.
    expect(container.querySelector("video")).toBeNull();

    act(() => { vi.advanceTimersByTime(1500); });

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("poster", "/fachada-nbrasa-1600.jpg");
    expect(video).toHaveAttribute("aria-hidden", "true");
  });

  it("herda o mesmo recorte da foto, para a troca não deslocar o enquadramento", () => {
    vi.useFakeTimers();
    fingirReducedMotion(false);

    const { container } = render(
      <VideoFachada poster="/fachada-nbrasa-1600.jpg" recorte="58% 50%" />,
    );
    act(() => { vi.advanceTimersByTime(1500); });

    const video = container.querySelector("video");
    expect(video).toHaveStyle({ objectPosition: "58% 50%" });
  });
});

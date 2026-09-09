import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { RolagemDoCabecalho } from "@/components/layout/RolagemDoCabecalho";

/**
 * O componente não desenha nada: ele existe para escrever duas coisas no
 * header, e é isso que estes testes leem. A conta em si mora em
 * `lib/cabecalho.ts` e tem teste próprio; aqui o que se prova é a ligação com
 * o DOM, que é onde este tipo de efeito costuma falhar calado.
 */

const ALTURA_DO_HEROI = 900;

function montaPagina({ comHeroi = true } = {}) {
  const cabecalho = document.createElement("header");
  cabecalho.id = "cabecalho";
  document.body.appendChild(cabecalho);

  if (comHeroi) {
    const heroi = document.createElement("section");
    heroi.id = "heroi";
    // jsdom não faz layout, então offsetHeight é sempre zero: sem fixar a
    // altura aqui o limiar nunca sairia do caso "ainda não medi".
    Object.defineProperty(heroi, "offsetHeight", { value: ALTURA_DO_HEROI });
    document.body.appendChild(heroi);
  }

  return cabecalho;
}

function rolaAte(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

describe("RolagemDoCabecalho", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("não acrescenta marcação nenhuma à página", () => {
    montaPagina();
    const { container } = render(<RolagemDoCabecalho />);
    expect(container).toBeEmptyDOMElement();
  });

  it("escreve o deslocamento da máscara no header ao rolar", async () => {
    const cabecalho = montaPagina();
    render(<RolagemDoCabecalho />);

    rolaAte(300);

    await waitFor(() => {
      expect(cabecalho.style.getPropertyValue("--costura-rolagem")).toBe("300px");
    });
  });

  it("deixa a variável em zero no topo, antes de qualquer rolagem", async () => {
    const cabecalho = montaPagina();
    render(<RolagemDoCabecalho />);

    await waitFor(() => {
      expect(cabecalho.style.getPropertyValue("--costura-rolagem")).toBe("0px");
    });
  });

  it("não estende a barra enquanto o herói cobre a faixa do header", async () => {
    const cabecalho = montaPagina();
    render(<RolagemDoCabecalho />);

    rolaAte(400);

    await waitFor(() => {
      expect(cabecalho.style.getPropertyValue("--costura-rolagem")).toBe("400px");
    });
    expect(cabecalho.hasAttribute("data-fora-do-heroi")).toBe(false);
  });

  it("estende a barra quando o herói sai de trás da faixa", async () => {
    const cabecalho = montaPagina();
    render(<RolagemDoCabecalho />);

    rolaAte(ALTURA_DO_HEROI);

    await waitFor(() => {
      expect(cabecalho.hasAttribute("data-fora-do-heroi")).toBe(true);
    });
  });

  it("recolhe a barra ao voltar para dentro do herói", async () => {
    const cabecalho = montaPagina();
    render(<RolagemDoCabecalho />);

    rolaAte(ALTURA_DO_HEROI);
    await waitFor(() => {
      expect(cabecalho.hasAttribute("data-fora-do-heroi")).toBe(true);
    });

    rolaAte(0);
    await waitFor(() => {
      expect(cabecalho.hasAttribute("data-fora-do-heroi")).toBe(false);
    });
  });

  it("para de escrever depois de desmontado", async () => {
    const cabecalho = montaPagina();
    const { unmount } = render(<RolagemDoCabecalho />);

    rolaAte(300);
    await waitFor(() => {
      expect(cabecalho.style.getPropertyValue("--costura-rolagem")).toBe("300px");
    });

    unmount();
    rolaAte(800);
    // tempo de sobra para um quadro que não deve mais existir
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(cabecalho.style.getPropertyValue("--costura-rolagem")).toBe("300px");
  });

  it("libera a transição só depois da primeira pintura", async () => {
    // O CSS prende `transition` a este atributo. Sem ele nenhuma transição
    // roda, e a barra passa a saltar entre os dois estados sem ninguém
    // perceber que a abertura sumiu.
    const cabecalho = montaPagina();
    render(<RolagemDoCabecalho />);

    await waitFor(() => {
      expect(cabecalho.hasAttribute("data-pronto")).toBe(true);
    });
  });

  it("não quebra numa página sem herói", async () => {
    const cabecalho = montaPagina({ comHeroi: false });
    const aviso = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<RolagemDoCabecalho />);
    rolaAte(300);
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(cabecalho.hasAttribute("data-fora-do-heroi")).toBe(false);
    expect(aviso).not.toHaveBeenCalled();
    aviso.mockRestore();
  });
});

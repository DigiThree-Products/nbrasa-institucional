import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RotaMascote } from "@/components/sections/RotaMascote";

const paradas = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "pontal", bairro: "Pontal" },
  { id: "verolme", bairro: "Verolme" },
];

describe("RotaMascote", () => {
  it("renderiza todas as paradas, sem depender de animação", () => {
    render(<RotaMascote paradas={paradas} />);
    for (const p of paradas) {
      expect(screen.getByText(p.bairro)).toBeInTheDocument();
    }
  });

  it("mantém a ordem da viagem, do topo da seção para a base", () => {
    // POSICOES é uma lista posicional: o card de índice 0 fica em cima e o
    // de índice 4 embaixo. Quem reordenar o `map`, ou parear as paradas com
    // as posições por outro critério, troca a ordem da viagem sem quebrar o
    // teste de presença acima, que só olha se cada nome existe.
    const { container } = render(<RotaMascote paradas={paradas} />);
    const cards = [...container.querySelectorAll("[data-parada]")];
    expect(cards.map((c) => c.getAttribute("data-parada"))).toEqual(
      paradas.map((p) => p.id),
    );
  });

  it("expõe o path da rota para o MotionPath", () => {
    const { container } = render(<RotaMascote paradas={paradas} />);
    expect(container.querySelector("#rota-entrega")).toBeInTheDocument();
  });

  it("marca a arte da rota como decorativa", () => {
    // Escopado ao <svg> que é ANCESTRAL de #rota-entrega: um querySelector
    // solto por "svg[aria-hidden='true']" também casa com o <Mascote>, que
    // tem o mesmo atributo — o teste passaria mesmo se o SVG da rota não
    // fosse decorativo, contanto que o mascote continuasse sendo.
    const { container } = render(<RotaMascote paradas={paradas} />);
    const rota = container.querySelector("#rota-entrega");
    const svgDaRota = rota?.closest("svg");
    expect(svgDaRota).toHaveAttribute("aria-hidden", "true");
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RotaMascote } from "@/components/sections/RotaMascote";

const paradas = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "japuiba", bairro: "Japuíba" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "mambucaba", bairro: "Mambucaba" },
];

describe("RotaMascote", () => {
  it("renderiza todas as paradas, sem depender de animação", () => {
    render(<RotaMascote paradas={paradas} />);
    for (const p of paradas) {
      expect(screen.getByText(p.bairro)).toBeInTheDocument();
    }
  });

  it("expõe o path da rota para o MotionPath", () => {
    const { container } = render(<RotaMascote paradas={paradas} />);
    expect(container.querySelector("#rota-entrega")).toBeInTheDocument();
  });

  it("marca a arte da rota como decorativa", () => {
    const { container } = render(<RotaMascote paradas={paradas} />);
    expect(container.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
  });
});

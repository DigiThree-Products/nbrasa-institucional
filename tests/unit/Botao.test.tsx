import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Botao } from "@/components/ui/Botao";

describe("Botao", () => {
  it("renderiza um link quando recebe href", () => {
    render(<Botao href="https://wa.me/123">Pedir no WhatsApp</Botao>);
    expect(screen.getByRole("link", { name: "Pedir no WhatsApp" }))
      .toHaveAttribute("href", "https://wa.me/123");
  });

  it("renderiza um botão quando não recebe href", () => {
    render(<Botao>Abrir menu</Botao>);
    expect(screen.getByRole("button", { name: "Abrir menu" })).toBeInTheDocument();
  });

  it("usa fundo brasa na variante sólida", () => {
    render(<Botao href="#">Pedir</Botao>);
    expect(screen.getByRole("link")).toHaveClass("bg-brasa");
  });

  it("não usa fundo brasa na variante fantasma", () => {
    render(<Botao href="#" variante="fantasma">Pedir</Botao>);
    expect(screen.getByRole("link")).not.toHaveClass("bg-brasa");
  });
});

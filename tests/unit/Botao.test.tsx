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

  it("na variante clara, inverte para fundo branco e texto carvão", () => {
    // O botão sólido é bg-brasa: dentro da faixa vermelha da Delivery ele
    // sumiria no fundo. A variante clara existe só para superfície de marca
    // saturada.
    render(<Botao href="#" variante="claro">Pedir no WhatsApp</Botao>);
    const link = screen.getByRole("link", { name: "Pedir no WhatsApp" });
    expect(link).toHaveClass("bg-branco");
    expect(link).toHaveClass("text-carvao");
    expect(link).not.toHaveClass("bg-brasa");
  });
});

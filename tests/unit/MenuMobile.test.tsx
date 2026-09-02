import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuMobile } from "@/components/layout/MenuMobile";

const links = [
  { href: "#cardapio", rotulo: "Cardápio" },
  { href: "#delivery", rotulo: "Delivery" },
];

describe("MenuMobile", () => {
  it("começa fechado", () => {
    render(<MenuMobile links={links} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre ao clicar no botão", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cardápio" })).toBeVisible();
  });

  it("fecha ao pressionar Esc", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha ao clicar num link", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    await userEvent.click(screen.getByRole("link", { name: "Delivery" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

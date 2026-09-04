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

  it("prende o foco: Tab a partir do último elemento volta ao primeiro", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    const fechar = screen.getByRole("button", { name: /fechar menu/i });
    const delivery = screen.getByRole("link", { name: "Delivery" });

    delivery.focus();
    expect(document.activeElement).toBe(delivery);

    await userEvent.tab();
    expect(document.activeElement).toBe(fechar);
  });

  it("devolve o foco ao botão de alternância ao fechar com Esc", async () => {
    render(<MenuMobile links={links} />);
    const alternar = screen.getByRole("button", { name: /abrir menu/i });
    await userEvent.click(alternar);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(alternar);
  });

  it("só há um botão acessível 'Fechar menu' enquanto o painel está aberto", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getAllByRole("button", { name: /fechar menu/i })).toHaveLength(1);
  });

  // Regressão: o MenuMobile mora dentro do <header>, que tem backdrop-blur, e
  // backdrop-filter faz do elemento o bloco de contenção dos descendentes
  // `fixed`. Sem o portal, o `inset-0` do painel se media pelos 75px do header
  // em vez da viewport e o menu virava uma tarja no topo, com os links por
  // cima da página. Passou meses despercebido porque painel e página eram os
  // dois carvão; só apareceu quando a página ficou branca.
  it("monta o painel direto no body, fora da árvore do header", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getByRole("dialog").parentElement).toBe(document.body);
  });

  it("trava o scroll do body enquanto aberto e libera ao fechar", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });
});

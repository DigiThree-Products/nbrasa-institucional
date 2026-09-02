import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preloader } from "@/components/motion/Preloader";

beforeEach(() => sessionStorage.clear());

describe("Preloader", () => {
  it("aparece na primeira visita da sessão", () => {
    render(<Preloader />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("não aparece se já foi exibido nesta sessão", () => {
    sessionStorage.setItem("nbrasa:preloader", "1");
    render(<Preloader />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("some ao pressionar uma tecla", async () => {
    render(<Preloader />);
    await userEvent.keyboard(" ");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("some sozinho dentro do teto de 1,2 s", async () => {
    render(<Preloader />);
    await waitFor(
      () => expect(screen.queryByRole("status")).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
  });
});

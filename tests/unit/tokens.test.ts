import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");

describe("tokens de marca", () => {
  it.each([
    ["--color-carvao", "#241e1f"],
    ["--color-brasa", "#cf2434"],
    ["--color-creme", "#f0e6dc"],
    ["--color-creme-texto", "#6b5c55"],
    ["--color-creme-borda", "#e3d5c8"],
    ["--color-branco", "#ffffff"],
    ["--color-brasa-escura", "#b81f2c"],
    ["--color-brasa-funda", "#8a1a24"],
  ])("declara %s como %s", (token, valor) => {
    expect(css).toMatch(new RegExp(`${token}\\s*:\\s*${valor}`));
  });

  it.each(["--color-cinza", "--color-fumaca", "--color-brasa-texto"])(
    "não declara mais %s, que reprovava contraste sobre a faixa vermelha",
    (token) => {
      // Os três existiam só para a faixa escura. Com a Delivery em vermelho
      // eles ficaram sem consumidor e reprovavam sobre o novo fundo, então
      // saíram do projeto. Ver tests/unit/contraste.test.ts.
      expect(css).not.toMatch(new RegExp(`${token}\\s*:`));
    },
  );
});

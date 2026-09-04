import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");

describe("tokens de marca", () => {
  it.each([
    ["--color-carvao", "#241e1f"],
    ["--color-brasa", "#cf2434"],
    ["--color-brasa-texto", "#ee6b76"],
    ["--color-fumaca", "#2f2728"],
    ["--color-cinza", "#a39596"],
    ["--color-creme", "#f0e6dc"],
    ["--color-creme-texto", "#6b5c55"],
    ["--color-creme-borda", "#e3d5c8"],
    ["--color-branco", "#ffffff"],
    ["--color-brasa-escura", "#b81f2c"],
  ])("declara %s como %s", (token, valor) => {
    expect(css).toMatch(new RegExp(`${token}\\s*:\\s*${valor}`));
  });
});

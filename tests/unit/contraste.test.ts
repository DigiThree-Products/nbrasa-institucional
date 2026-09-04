import { describe, it, expect } from "vitest";

/**
 * Razão de contraste WCAG 2.x, calculada diretamente a partir da fórmula de
 * luminância relativa sRGB — sem depender de biblioteca externa. Isto existe
 * porque um token de contraste já falhou quatro vezes neste projeto por não
 * ser medido contra as superfícies onde de fato é usado (ver a correção de
 * `--color-brasa-texto` nesta mesma leva). Qualquer novo par cor-de-texto/
 * cor-de-fundo introduzido no site deve ganhar uma linha aqui.
 */
function paraLinear(canal: number): number {
  const c = canal / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminanciaRelativa(hex: string): number {
  const limpo = hex.replace("#", "");
  const r = parseInt(limpo.slice(0, 2), 16);
  const g = parseInt(limpo.slice(2, 4), 16);
  const b = parseInt(limpo.slice(4, 6), 16);
  return 0.2126 * paraLinear(r) + 0.7152 * paraLinear(g) + 0.0722 * paraLinear(b);
}

function razaoDeContraste(corA: string, corB: string): number {
  const la = luminanciaRelativa(corA);
  const lb = luminanciaRelativa(corB);
  const clara = Math.max(la, lb);
  const escura = Math.min(la, lb);
  return (clara + 0.05) / (escura + 0.05);
}

// Tokens de marca (app/globals.css) — duplicados aqui de propósito: este
// teste deve continuar comparando os valores literais do spec, não os que
// globals.css disser que são, senão um erro de digitação nos dois lugares
// passaria despercebido.
const CARVAO = "#241e1f";
const BRASA = "#cf2434";
const BRANCO = "#ffffff";
const BRASA_TEXTO = "#ee6b76";
const FUMACA = "#2f2728";
const CINZA = "#a39596";
const CREME = "#f0e6dc";
const CREME_TEXTO = "#6b5c55";
const BRASA_ESCURA = "#b81f2c";

const AA_NORMAL = 4.5;

describe("contraste WCAG — pares de superfície realmente usados no site", () => {
  it.each([
    // Página clara: branco é o fundo do body, creme é a superfície dos cards.
    ["carvao sobre branco (texto principal)", CARVAO, BRANCO],
    ["carvao sobre creme (texto dentro do card)", CARVAO, CREME],
    ["creme-texto sobre branco (texto secundário)", CREME_TEXTO, BRANCO],
    ["creme-texto sobre creme (texto secundário no card)", CREME_TEXTO, CREME],
    ["brasa-escura sobre branco (rótulo pequeno na página)", BRASA_ESCURA, BRANCO],
    ["brasa-escura sobre creme (rótulo pequeno no card)", BRASA_ESCURA, CREME],
    ["branco sobre brasa (texto em botão sólido)", BRANCO, BRASA],
    ["brasa sobre branco (traço e ícone, texto display grande)", BRASA, BRANCO],
    // Faixa escura, hoje só a Delivery.
    ["branco sobre carvao (texto principal da Delivery)", BRANCO, CARVAO],
    ["cinza sobre carvao (texto secundário da Delivery)", CINZA, CARVAO],
    ["brasa-texto sobre carvao (reservado à faixa escura)", BRASA_TEXTO, CARVAO],
    ["brasa-texto sobre fumaca (reservado à faixa escura)", BRASA_TEXTO, FUMACA],
  ])("%s atinge AA (≥ %s:1)", (_descricao, cor, fundo) => {
    expect(razaoDeContraste(cor, fundo)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("cf2434 (brasa) sobre creme NÃO atinge AA para texto normal, e é por isso que brasa-escura existe", () => {
    // Documenta a decisão do spec §9: o vermelho de marca não é texto pequeno
    // em nenhuma superfície. Com a página clara os cards viraram creme, e todo
    // rótulo pequeno vermelho migrou para brasa-escura. Se este teste começar
    // a falhar (ratio subir), reavalie se a restrição ainda é necessária.
    expect(razaoDeContraste(BRASA, CREME)).toBeLessThan(AA_NORMAL);
  });
});

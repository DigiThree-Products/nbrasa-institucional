import { describe, it, expect } from "vitest";
import {
  VEU,
  TETO_DO_TEXTO,
  opacidadeDoVeu,
  sobrepor,
  veuDaFoto,
} from "@/lib/veuDaFoto";

/**
 * O véu é a única superfície do site cujo fundo ninguém consegue medir: por
 * baixo dele há fotografia, e fotografia muda de pixel para pixel. Este
 * arquivo cobre a mecânica (a rampa de opacidade e a conta de sobreposição);
 * quem cobra a razão WCAG do par branco/véu é `contraste.test.ts`, onde mora
 * a regra "todo par novo ganha uma linha lá".
 */
describe("opacidadeDoVeu, a rampa", () => {
  it("é cheia na base e nula no topo do card", () => {
    expect(opacidadeDoVeu(0)).toBeCloseTo(VEU.naBase, 5);
    expect(opacidadeDoVeu(1)).toBeCloseTo(0, 5);
  });

  it("segura o platô inteiro antes de começar a desbotar", () => {
    expect(opacidadeDoVeu(VEU.plato)).toBeCloseTo(VEU.noPlato, 5);
    // No meio do platô ela já caiu um pouco, porque a rampa começa na base.
    const meio = opacidadeDoVeu(VEU.plato / 2);
    expect(meio).toBeLessThan(VEU.naBase);
    expect(meio).toBeGreaterThan(VEU.noPlato);
  });

  it("nunca sobe quando se afasta da base", () => {
    let anterior = Infinity;
    for (let f = 0; f <= 1.0001; f += 0.05) {
      const atual = opacidadeDoVeu(f);
      expect(atual).toBeLessThanOrEqual(anterior + 1e-9);
      anterior = atual;
    }
  });

  it("não devolve valor fora de 0..1 nem além das bordas do card", () => {
    for (const f of [-1, -0.2, 0, 0.5, 1, 1.4, 9]) {
      const a = opacidadeDoVeu(f);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  /**
   * O número que protege o texto.
   *
   * `TETO_DO_TEXTO` é a altura máxima, em fração do card medida da base, que o
   * bloco de kicker mais nome pode alcançar. Medido no card mais apertado, o
   * de 216x144 entre 1024px e 1279px, ele chega a 0,45. A folga existe porque
   * o corpo do texto muda com a tipografia e ninguém vai remedir isto.
   */
  it("deixa o teto do texto com folga larga dentro do platô", () => {
    expect(TETO_DO_TEXTO).toBeGreaterThan(VEU.plato);
    expect(opacidadeDoVeu(TETO_DO_TEXTO)).toBeGreaterThan(0.6);
  });
});

describe("sobrepor, a conta de composição", () => {
  it("com alfa zero devolve o fundo, com alfa cheio devolve a tinta", () => {
    expect(sobrepor("#241e1f", "#ffffff", 0)).toBe("#ffffff");
    expect(sobrepor("#241e1f", "#ffffff", 1)).toBe("#241e1f");
  });

  it("na metade fica entre as duas", () => {
    expect(sobrepor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("aceita hex de três dígitos e devolve sempre seis", () => {
    expect(sobrepor("#000", "#fff", 1)).toBe("#000000");
  });
});

describe("veuDaFoto, o degradê que vai para o CSS", () => {
  const css = veuDaFoto();

  it("sobe da base para o topo do card", () => {
    expect(css.startsWith("linear-gradient(to top,")).toBe(true);
  });

  /**
   * A cor sai do token, e não de um `#241e1f` cru, pelo mesmo motivo do papel
   * do texto: é o mesmo carvão que `contraste.test.ts` assume ao medir o par,
   * e um literal aqui sairia de sincronia no dia em que o token mudar.
   */
  it("pinta com o token de marca, nunca com hex cru", () => {
    expect(css).toContain("var(--color-carvao)");
    expect(css).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  /**
   * `color-mix` com `transparent`, e não a palavra `transparent` sozinha no
   * último ponto: o degradê que termina em `transparent` puro interpola
   * passando por preto transparente em alguns motores, e o meio da rampa sai
   * acinzentado sobre a foto. Misturar o próprio carvão a 0% guarda a cor.
   */
  it("termina em carvão a zero por cento, não na palavra transparent solta", () => {
    expect(css).toContain("color-mix(in srgb, var(--color-carvao) 0%, transparent) 100%");
    expect(css).not.toMatch(/,\s*transparent\s+100%/);
  });

  it("declara os três pontos da rampa, na ordem", () => {
    // Ancorado em `transparent)` de propósito: um `\)\s+N%` solto casaria
    // também com o `var(--color-carvao) 92%` de dentro de cada `color-mix`.
    const posicoes = [...css.matchAll(/transparent\)\s+(\d+(?:\.\d+)?)%/g)].map((m) =>
      Number(m[1]),
    );
    expect(posicoes).toEqual([0, VEU.plato * 100, 100]);
  });
});

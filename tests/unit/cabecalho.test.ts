import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  ALTURA_DO_CABECALHO,
  deslocamentoDaMascara,
  passouDoHeroi,
} from "@/lib/cabecalho";

/**
 * O header fixo do desktop tem duas contas, e as duas são silenciosas quando
 * erram: a máscara sai de alinhamento sem nada quebrar, e a barra se estende
 * cedo ou tarde demais sem nenhum erro no console. Por isso elas saem do
 * componente de cliente e viram função pura aqui, na mesma linha de
 * `tituloHero` e `horarios`.
 */

describe("deslocamentoDaMascara", () => {
  it("espelha a rolagem, que é o que mantém o recorte casado com a foto", () => {
    expect(deslocamentoDaMascara(300)).toBe(300);
  });

  it("é zero no topo, onde a máscara do header e a da foto coincidem", () => {
    expect(deslocamentoDaMascara(0)).toBe(0);
  });

  it("trava em zero na rolagem negativa do repique de fim de curso", () => {
    // Safari e o trackpad do macOS entregam scrollY negativo no repique. Sem
    // travar, a máscara DESCE, e o recorte abre um vão branco no alto da foto
    // justamente no quadro em que o usuário está olhando para ele.
    expect(deslocamentoDaMascara(-120)).toBe(0);
  });
});

describe("passouDoHeroi", () => {
  const ALTURA = 900;

  it("não passou no topo da página", () => {
    expect(passouDoHeroi(0, ALTURA)).toBe(false);
  });

  it("não passou enquanto a base do herói ainda cobre a faixa do header", () => {
    // Neste pixel exato a base do herói encosta na base do header: a foto
    // ainda cobre a faixa inteira, então o recorte continua legítimo.
    expect(passouDoHeroi(ALTURA - ALTURA_DO_CABECALHO, ALTURA)).toBe(false);
  });

  it("passou um pixel depois disso, quando a faixa fica sem foto atrás", () => {
    expect(passouDoHeroi(ALTURA - ALTURA_DO_CABECALHO + 1, ALTURA)).toBe(true);
  });

  it("segue passado lá embaixo, no fim do site", () => {
    expect(passouDoHeroi(12000, ALTURA)).toBe(true);
  });

  it("mantém o recorte enquanto a altura do herói não foi medida", () => {
    // Entre a primeira pintura e o efeito que mede o herói a altura é zero.
    // Devolver `true` ali faria a barra piscar estendida antes de recolher.
    expect(passouDoHeroi(0, 0)).toBe(false);
  });

  it("mantém o recorte na rolagem negativa do repique", () => {
    expect(passouDoHeroi(-120, ALTURA)).toBe(false);
  });
});

describe("ALTURA_DO_CABECALHO", () => {
  /**
   * O número vive em três lugares que precisam concordar: aqui, na classe do
   * Header e na altura do pseudoelemento que pinta a metade esquerda. Se um
   * deles mudar sozinho, o limiar erra por essa diferença e a barra se estende
   * antes ou depois da hora, sem nada acusar.
   */
  it("bate com a altura da faixa no Header", () => {
    const jsx = readFileSync("components/layout/Header.tsx", "utf8");
    expect(jsx).toContain(`h-[${ALTURA_DO_CABECALHO}px]`);
  });

  it("bate com a altura do pseudoelemento em globals.css", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain(`height: ${ALTURA_DO_CABECALHO}px;`);
  });
});

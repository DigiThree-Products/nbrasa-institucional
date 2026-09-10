import { describe, it, expect } from "vitest";
import {
  MACIEZ,
  LINHA_INICIAL,
  LINHA_FINAL,
  VARIAVEL_DA_LINHA,
  mascaraDaQueima,
  escondeNaMontagem,
} from "@/lib/queima";

/** Conta parênteses abertos e fechados de uma declaração de CSS. */
function saldoDeParenteses(css: string): number {
  return [...css].reduce((saldo, c) => saldo + (c === "(" ? 1 : c === ")" ? -1 : 0), 0);
}

describe("a queima que revela o texto de baixo para cima", () => {
  it("começa com a linha de fogo abaixo do glifo", () => {
    // Se a linha nascesse em zero, a base da letra já apareceria acesa antes
    // de qualquer movimento, e a queima começaria pela metade. A banda de
    // fogo tem largura, então o começo precisa estar uma banda inteira
    // abaixo da caixa.
    expect(LINHA_INICIAL + MACIEZ).toBeLessThanOrEqual(0);
  });

  it("termina com a linha de fogo acima do glifo", () => {
    // Parar antes de 100 deixaria o topo da letra sem tinta para sempre, e
    // nada lança: o texto simplesmente fica com a cabeça cortada.
    expect(LINHA_FINAL).toBeGreaterThanOrEqual(100);
  });

  it("pinta a tinta abaixo da linha de fogo", () => {
    // A parte já queimada é a de baixo. Invertida, a letra apareceria de
    // cima para baixo, que é o contrário do que o cliente pediu.
    const tinta = mascaraDaQueima("tinta");
    expect(tinta.indexOf("#000")).toBeLessThan(tinta.indexOf("transparent"));
  });

  it("pinta a fumaça acima da linha de fogo", () => {
    // A fumaça é o que ainda não virou tinta, e ela vive do lado de cima da
    // linha. As duas camadas são complementares.
    const fumaca = mascaraDaQueima("fumaca");
    expect(fumaca.indexOf("transparent")).toBeLessThan(fumaca.indexOf("#000"));
  });

  it("faz as duas camadas se encontrarem na mesma linha de fogo", () => {
    // Vão entre elas abre um rasgo no glifo; sobra faz a fumaça e a tinta
    // aparecerem juntas no mesmo pedaço, e a letra sai suja. As duas leem a
    // mesma variável e as mesmas paradas.
    const tinta = mascaraDaQueima("tinta");
    const fumaca = mascaraDaQueima("fumaca");
    const paradas = (css: string) => css.match(/calc\([^)]*\)*[^,]*/g);

    expect(tinta).toContain(VARIAVEL_DA_LINHA);
    expect(fumaca).toContain(VARIAVEL_DA_LINHA);
    expect(paradas(fumaca)).toEqual(paradas(tinta));
  });

  it("sobe, e não desce nem atravessa", () => {
    expect(mascaraDaQueima("tinta")).toContain("to top");
    expect(mascaraDaQueima("fumaca")).toContain("to top");
  });

  it("fecha todos os parênteses que abre", () => {
    // `calc` mal fechado não lança: o navegador descarta a declaração
    // inteira, a máscara some e a letra aparece pronta, sem queima nenhuma.
    expect(saldoDeParenteses(mascaraDaQueima("tinta"))).toBe(0);
    expect(saldoDeParenteses(mascaraDaQueima("fumaca"))).toBe(0);
  });

  it("esconde na montagem o que ainda está abaixo da janela", () => {
    // É o que evita a piscada: sem isto o elemento sobe a tela em opacidade
    // cheia, é visto, e só então salta para escondido quando o gatilho pega.
    expect(escondeNaMontagem(900, 800)).toBe(true);
  });

  it("não esconde na montagem o que já está à vista", () => {
    // Esconder aqui seria pior que a piscada: o conteúdo já lido pelo
    // visitante sumiria na frente dele.
    expect(escondeNaMontagem(300, 800)).toBe(false);
  });
});

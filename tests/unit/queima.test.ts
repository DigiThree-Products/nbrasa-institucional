import { describe, it, expect } from "vitest";
import {
  MACIEZ,
  LINHA_INICIAL,
  LINHA_FINAL,
  VARIAVEL_DA_LINHA,
  mascaraDaQueima,
  escondeNaMontagem,
  emRgba,
  plumaDeFumaca,
  estiloDaPluma,
  PASSOS_DA_PLUMA,
} from "@/lib/queima";

/** Todos os números que um padrão captura na pluma, na ordem das cópias. */
function numeros(padrao: RegExp): number[] {
  return [...plumaDeFumaca("#241e1f").matchAll(padrao)].map((m) => Number(m[1]));
}

/** Os multiplicadores que jogam cada cópia para cima. */
function deslocamentos(): number[] {
  return numeros(/0 calc\(var\(--altura-da-pluma\) \* (-[\d.]+)\)/g);
}

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

  it("escreve a cor com alfa a partir do hex do token", () => {
    expect(emRgba("#241e1f", 0.5)).toBe("rgba(36, 30, 31, 0.5)");
  });

  it("aceita também a forma que o navegador devolve", () => {
    // `getComputedStyle` pode entregar `rgb(...)` em vez do hex escrito no
    // `@theme`, e a pluma não pode sair sem alfa por causa disso: sem alfa
    // por cópia ela vira um borrão sólido, e não fumaça.
    expect(emRgba("rgb(36, 30, 31)", 0.5)).toBe("rgba(36, 30, 31, 0.5)");
  });

  it("sobe a pluma inteira, sem cópia abaixo da letra", () => {
    // Fumaça que desce lê como queda. O deslocamento de toda cópia multiplica
    // a altura por um número negativo, que é o que a joga para cima.
    expect(deslocamentos()).toHaveLength(PASSOS_DA_PLUMA);
    for (const f of deslocamentos()) expect(f).toBeLessThan(0);
  });

  it("afasta, borra e enfraquece cada cópia mais que a anterior", () => {
    // É o degradê que faz a pilha ler como pluma. Cópias iguais empilhadas
    // viram uma mancha só, do mesmo jeito que o halo simétrico de antes.
    const alturas = deslocamentos();
    const desfoques = numeros(/\+ var\(--altura-da-pluma\) \* ([\d.]+)\)/g);
    const forcas = numeros(/calc\(([\d.]+) \* \(1 -/g);
    expect(desfoques).toHaveLength(PASSOS_DA_PLUMA);
    expect(forcas).toHaveLength(PASSOS_DA_PLUMA);

    for (let i = 1; i < PASSOS_DA_PLUMA; i++) {
      expect(alturas[i]).toBeLessThan(alturas[i - 1]);
      expect(desfoques[i]).toBeGreaterThan(desfoques[i - 1]);
      expect(forcas[i]).toBeLessThan(forcas[i - 1]);
    }
  });

  it("apaga a pluma exatamente quando o fogo acaba", () => {
    // O alfa é a força vezes o que falta do avanço. Em avanço 1, que é o fim
    // da queima, sobra zero: a fumaça não pode ficar pendurada na letra
    // parada depois que a máscara sai.
    const avanco = [...plumaDeFumaca("#241e1f").matchAll(/\(1 - var\(--avanco-da-queima\)\)/g)];
    expect(avanco).toHaveLength(PASSOS_DA_PLUMA);
  });

  it("deriva o avanço da mesma linha que move a máscara", () => {
    // As duas dessincronizariam no dia em que alguém mexesse num dos dois
    // lugares, e a pluma passaria a subir antes ou depois do fogo.
    const estilo = estiloDaPluma("#241e1f");
    expect(estilo["--avanco-da-queima"]).toContain(VARIAVEL_DA_LINHA);
    expect(estilo["--altura-da-pluma"]).toContain("--avanco-da-queima");
    expect(estilo.textShadow).toContain("--altura-da-pluma");
  });

  it("fecha todos os parênteses que a pluma abre", () => {
    // Mesmo perigo da máscara: `calc` mal fechado descarta a declaração e a
    // sombra some inteira, sem nada lançar.
    for (const valor of Object.values(estiloDaPluma("#241e1f"))) {
      expect(saldoDeParenteses(valor)).toBe(0);
    }
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

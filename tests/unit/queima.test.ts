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
  contasDaQueima,
  derivaDaLetra,
  PASSOS_DA_PLUMA,
  SUBIDA_DA_PLUMA,
  DESFOQUE_BASE,
} from "@/lib/queima";

/** Todos os números que um padrão captura na pluma, na ordem das cópias. */
function numeros(padrao: RegExp): number[] {
  return [...plumaDeFumaca("#241e1f").matchAll(padrao)].map((m) => Number(m[1]));
}

/**
 * Os multiplicadores que jogam cada cópia para cima. São o segundo `calc` de
 * cada sombra, logo antes do desfoque; o primeiro é a deriva lateral.
 *
 * O `calc(` do fim é só a âncora que diz que acabou o deslocamento e começou
 * o desfoque. Ele já citou o valor de `DESFOQUE_BASE`, e isso quebrou calado
 * quando o número mudou em 2026-09-11: a busca não achava nada, a lista vinha
 * vazia e dois testes passavam a afirmar coisa nenhuma.
 */
function deslocamentos(): number[] {
  return numeros(/calc\(var\(--altura-da-pluma\) \* (-[\d.]+)\) calc\(/g);
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

  it("afasta as cópias mais do que as borra, para a letra aparecer na fumaça", () => {
    /*
     * O cliente pediu em 2026-09-11 para enxergar a letra dentro da fumaça, e
     * isso não é uma conta de desfoque, é uma de vão contra desfoque: cópia
     * que carrega mais desfoque do que a distância até a vizinha se funde com
     * ela, e a pilha inteira volta a ser a mancha que a pluma era antes.
     *
     * O pior caso é o NASCIMENTO da pluma, e não o fim dela: ali a altura é a
     * menor, então as cópias estão mais juntas, e é também quando o alfa está
     * no máximo, então é o instante em que a fusão mais apareceria.
     *
     * A margem existe porque vão igual ao desfoque ainda lê fundido: as duas
     * metades da transição de uma cópia encostam na vizinha. Medido nestes
     * números, o nascimento dá 1,44.
     */
    const SEPARACAO_MINIMA = 1.3;
    const espalhas = numeros(/\+ var\(--altura-da-pluma\) \* ([\d.]+)\)/g);
    const altura = SUBIDA_DA_PLUMA.comeco;
    const vao = altura / PASSOS_DA_PLUMA;

    expect(espalhas).toHaveLength(PASSOS_DA_PLUMA);
    for (const espalha of espalhas) {
      const desfoque = DESFOQUE_BASE + altura * espalha;
      expect(vao / desfoque).toBeGreaterThanOrEqual(SEPARACAO_MINIMA);
    }
  });

  it("dá a cada letra uma deriva própria, para a palavra não sair carimbada", () => {
    // Fumaça idêntica em catorze letras lê como padrão, não como fumaça. A
    // deriva é o que inclina a pluma de cada uma para um lado.
    const derivas = Array.from({ length: 14 }, (_, i) => derivaDaLetra(i));
    expect(new Set(derivas).size).toBe(derivas.length);
    for (const d of derivas) {
      expect(d).toBeGreaterThanOrEqual(-1);
      expect(d).toBeLessThanOrEqual(1);
    }
  });

  it("mantém a deriva estável entre chamadas", () => {
    // Ela é recalculada a cada entrada na seção. Sorteio de verdade faria a
    // pluma pular de lado quando o visitante voltasse, sem motivo visível.
    expect(derivaDaLetra(7)).toBe(derivaDaLetra(7));
  });

  it("escora a pluma para o lado conforme ela sobe", () => {
    // Coluna reta não lê como fumaça. O deslocamento lateral cresce com a
    // altura da cópia, então a pluma inclina em vez de subir empilhada.
    const lados = [...plumaDeFumaca("#241e1f", 3)
      .matchAll(/calc\(var\(--altura-da-pluma\) \* (-?[\d.]+)\) calc\(var/g)]
      .map((m) => Math.abs(Number(m[1])));
    expect(lados).toHaveLength(PASSOS_DA_PLUMA);
    expect(lados.at(-1)).toBeGreaterThan(lados[0]);
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
    const contas = contasDaQueima();
    expect(contas["--avanco-da-queima"]).toContain(VARIAVEL_DA_LINHA);
    expect(contas["--altura-da-pluma"]).toContain("--avanco-da-queima");
    expect(plumaDeFumaca("#241e1f")).toContain("--altura-da-pluma");
  });

  it("fecha todos os parênteses que a pluma abre", () => {
    // Mesmo perigo da máscara: `calc` mal fechado descarta a declaração e a
    // sombra some inteira, sem nada lançar.
    for (const valor of [...Object.values(contasDaQueima()), plumaDeFumaca("#241e1f", 5)]) {
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

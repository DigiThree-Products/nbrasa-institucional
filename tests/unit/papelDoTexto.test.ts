import { describe, it, expect } from "vitest";
import { anelDePapel, RAIO_DO_PAPEL } from "@/lib/papelDoTexto";

/** Devolve os deslocamentos do `text-shadow` como pares de número. */
function pontos(css: string): Array<[number, number]> {
  return css.split(", ").map((sombra) => {
    const [x, y] = sombra.split(" ");
    return [Number(x.replace("px", "")), Number(y.replace("px", ""))];
  });
}

describe("o papel colado nas letras", () => {
  it("põe todas as cópias à mesma distância da tinta", () => {
    // É o que faz a auréola ter espessura constante em volta do glifo. Um
    // ponto fora do raio engorda o papel de um lado só, e isso só aparece
    // com card colorido atrás, no meio da cena presa.
    for (const [x, y] of pontos(anelDePapel(9))) {
      expect(Math.hypot(x, y)).toBeCloseTo(9, 1);
    }
  });

  it("fecha a volta inteira, sem deixar setor descoberto", () => {
    // Meia volta de cópias deixaria o outro lado da letra sem papel. Somando
    // os vetores de um anel completo o resultado é o vetor nulo; num anel
    // incompleto sobra resultante apontando para o lado coberto.
    const soma = pontos(anelDePapel(9)).reduce(
      ([sx, sy], [x, y]) => [sx + x, sy + y],
      [0, 0],
    );

    expect(Math.hypot(soma[0], soma[1])).toBeCloseTo(0, 6);
  });

  it("mantém o vão entre cópias vizinhas bem abaixo do raio", () => {
    // É esta razão que decide se a borda do papel sai lisa ou serrilhada. Com
    // poucos passos o vão cresce e abre dente entre um ponto e outro, e dente
    // branco em cima de card colorido só se vê em movimento.
    const p = pontos(anelDePapel(9));
    const vao = Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]);

    expect(vao).toBeLessThan(9 * 0.5);
    // E o contra-exemplo, para o número de passos não cair sem alarme.
    const poucos = pontos(anelDePapel(9, 8));
    expect(
      Math.hypot(poucos[0][0] - poucos[1][0], poucos[0][1] - poucos[1][1]),
    ).toBeGreaterThan(9 * 0.5);
  });

  it("pinta com o token de branco, não com literal", () => {
    // O papel é a mesma superfície que `contraste.test.ts` assume como fundo
    // dos pares de texto da seção. Um `#fff` cru aqui sairia de sincronia no
    // dia em que o branco do site mudasse, e a conta de contraste passaria a
    // medir uma cor que a tela não pinta.
    expect(anelDePapel(9)).toContain("var(--color-branco)");
    expect(anelDePapel(9)).not.toContain("#");
  });

  it("dá ao título auréola mais larga que ao corpo", () => {
    // O título é display pesado e aguenta papel largo sem fechar contraforma;
    // o parágrafo é corpo de 14px, e auréola do tamanho da do título colaria
    // uma linha na outra.
    expect(RAIO_DO_PAPEL.titulo).toBeGreaterThan(RAIO_DO_PAPEL.corpo);
  });
});

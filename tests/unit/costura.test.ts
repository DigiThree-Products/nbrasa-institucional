import { describe, it, expect } from "vitest";
import { mascaraChama } from "@/lib/costura";

/** Devolve o SVG de dentro do `url("data:...")` para poder inspecionar. */
function decodificar(url: string): string {
  return decodeURIComponent(url.slice('url("data:image/svg+xml,'.length, -2));
}

describe("mascaraChama", () => {
  it("não deixa caractere cru que o parser de CSS rejeita", () => {
    const url = mascaraChama("borda");

    expect(url.startsWith('url("data:image/svg+xml,')).toBe(true);
    // `<` e aspas crus dentro do data URI fazem o Chrome descartar a
    // declaração inteira — sem erro nenhum, a máscara simplesmente some.
    const dados = url.slice('url("data:image/svg+xml,'.length, -2);
    expect(dados).not.toContain("<");
    expect(dados).not.toContain('"');
  });

  it("declara tamanho intrínseco, não só viewBox", () => {
    // Sem width/height o SVG não tem dimensão intrínseca, e `mask-size: auto`
    // no outro eixo fica a cargo do navegador — a chama sai de proporção.
    const svg = decodificar(mascaraChama("borda"));

    expect(svg).toContain("width='600'");
    expect(svg).toContain("height='116'");
  });

  it("no topo, preenche a largura inteira abaixo do eixo da chama", () => {
    const svg = decodificar(mascaraChama("topo"));

    // O preenchimento precisa ser tão largo quanto o quadro: se ele tivesse
    // só a largura da chama, a máscara não alcançaria as laterais e a foto
    // sumiria fora dela.
    expect(svg).toContain("viewBox='0 0 600 600'");
    // y=78 é onde a chama é mais larga, e não a cintura dela (58). Na cintura
    // o contorno chega inclinado e a união com o retângulo deixa um fiapo
    // solto; na parte mais larga a tangente é vertical e a curva encosta na
    // reta sem quebra.
    expect(svg).toContain("<rect x='0' y='78' width='600' height='522'");
  });

  it("no topo, centraliza a chama no quadro", () => {
    const svg = decodificar(mascaraChama("topo"));

    expect(svg).toContain("translate(250,0)");
  });
});

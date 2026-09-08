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
    // declaração inteira, sem erro nenhum, a máscara simplesmente some.
    const dados = url.slice('url("data:image/svg+xml,'.length, -2);
    expect(dados).not.toContain("<");
    expect(dados).not.toContain('"');
  });

  it("declara tamanho intrínseco, não só viewBox", () => {
    // Sem width/height o SVG não tem dimensão intrínseca, e `mask-size: auto`
    // no outro eixo fica a cargo do navegador, a chama sai de proporção.
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
    // O caminho inteiro, e não um pedaço: os números saem calculados da
    // silhueta em lib/costura.ts, então fixá-los aqui é o que trava a
    // geometria do filete. Lendo os marcos:
    //
    //   M0 74 ... L600 74  a base segue em y=74, o ponto mais largo da chama
    //   Q ... 259.88 54    filete esquerdo, tangente ao contorno em y=54
    //   Q ... 339.81 54    filete direito, o espelho dele
    //   L270 80 L330 80    travessia por DENTRO da chama. Atravessar reto na
    //                      altura do encontro taparia a lambida, que vive
    //                      entre y=40 e y=57.
    expect(svg).toContain(
      "<path d='M0 74 L231.65 74 Q251.65 74 259.88 54 L270 80 L330 80 " +
        "L339.81 54 Q348.27 74 368.27 74 L600 74 L600 600 L0 600 Z' fill='black'/>",
    );

    // O retângulo cru saiu de cena: ele encostava na chama em 90°, porque a
    // lateral dela tem tangente vertical ali, e a chama lia como peça pousada
    // sobre a foto em vez de forma saindo dela.
    expect(svg).not.toContain("<rect x='0' y='74'");
  });

  it("no topo, centraliza a chama no quadro", () => {
    const svg = decodificar(mascaraChama("topo"));

    expect(svg).toContain("translate(250,0)");
  });
});

describe("o filete acompanha a silhueta", () => {
  it("os trechos de ombro continuam dentro de D_SILHUETA", async () => {
    const { D_SILHUETA } = await import("@/lib/marca");

    // lib/costura.ts guarda estes dois comandos como pontos de controle, para
    // achar a tangente do contorno no ombro e apoiar o filete nela. Se o
    // desenho da chama mudar, aqueles números param de valer em silêncio e o
    // filete chega torto. Este teste é o alarme.
    expect(D_SILHUETA).toContain("C9 52 6 63 6 74");
    expect(D_SILHUETA).toContain("c0-19-11-33-19-43");
  });
});

describe("as duas formas da chama", () => {
  it("a máscara usa a silhueta sólida, não a chama oficial", async () => {
    const { D_SILHUETA, D_CHAMA_OFICIAL } = await import("@/lib/marca");
    const svg = decodificar(mascaraChama("borda"));

    // A silhueta é um path só e fechado: é isso que permite unir com o
    // retângulo e produzir uma borda contínua. A chama oficial são três
    // pinceladas separadas, e a mesma união produziria fitas rasgadas.
    expect(svg).toContain(D_SILHUETA);
    for (const path of D_CHAMA_OFICIAL) {
      expect(svg).not.toContain(path);
    }
  });
});

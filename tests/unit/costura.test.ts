import { describe, it, expect } from "vitest";
import { AJUSTES_DA_RESERVA, mascaraChama } from "@/lib/costura";

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

describe("a reserva do Cardápio", () => {
  it("traz a chama e mais nada, no tamanho dela", () => {
    // O corpo do papel é uma SEGUNDA camada de máscara, escrita no CSS. Com um
    // retângulo aqui dentro, o quadro inteiro passa a ter a altura da chama, e
    // `mask-size: auto <altura da chama>` deixa o resto da caixa sem máscara
    // nenhuma: o papel some embaixo do parágrafo e um card volta a passar por
    // cima do texto.
    const svg = decodificar(mascaraChama("reserva"));

    expect(svg).toContain("width='100'");
    expect(svg).toContain("height='116'");
    expect(svg).not.toContain("<rect");
  });

  it("espelha a chama, para a lambida ficar na beirada que a bobina cruza", () => {
    // `D_SILHUETA` é assimétrica: o entalhe que faz a forma ler como chama vive
    // só no lado esquerdo dela, e o direito é um ombro liso. Sem espelhar, o
    // recorte do papel vira um calombo arredondado.
    const svg = decodificar(mascaraChama("reserva"));

    expect(svg).toContain("translate(0,0) translate(100,0) scale(-1,1)");
    // O herói não espelha: lá quem desenha o contorno já é o lado do entalhe.
    expect(decodificar(mascaraChama("borda"))).not.toContain("scale(-1,1)");
    expect(decodificar(mascaraChama("topo"))).not.toContain("scale(-1,1)");
  });

  it("dá ao CSS a meia largura certa, senão abre degrau ou tapa a lambida", () => {
    // A borda do retângulo do corpo cai no eixo da chama, e o CSS só sabe onde
    // ele fica por este número, em múltiplos da altura da chama. Ele é a
    // proporção da silhueta dividida por dois, não um valor escolhido.
    expect(AJUSTES_DA_RESERVA.meiaLargura).toBeCloseTo(100 / 116 / 2, 10);
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

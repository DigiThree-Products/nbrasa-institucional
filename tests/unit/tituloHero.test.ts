import { describe, it, expect } from "vitest";
import { partesDoTitulo } from "@/lib/tituloHero";
import { conteudoSeed } from "@/lib/conteudo.seed";

describe("partesDoTitulo", () => {
  it("reparte o título do seed em abertura, foco e fecho", () => {
    expect(partesDoTitulo(conteudoSeed.heroTitulo))
      .toEqual({ abertura: "Sua fome", foco: "acende", fecho: "aqui." });
  });

  it("joga tudo que vem antes das duas últimas palavras na abertura", () => {
    expect(partesDoTitulo("a b c d e"))
      .toEqual({ abertura: "a b c", foco: "d", fecho: "e" });
  });

  it("deixa a abertura vazia num título de duas palavras", () => {
    expect(partesDoTitulo("acende aqui."))
      .toEqual({ abertura: "", foco: "acende", fecho: "aqui." });
  });

  it("faz da palavra única o foco, sem fecho, num título de uma palavra", () => {
    expect(partesDoTitulo("N'brasar"))
      .toEqual({ abertura: "", foco: "N'brasar", fecho: "" });
  });

  it("ignora espaço repetido e espaço nas pontas", () => {
    expect(partesDoTitulo("  Sua   fome  acende   aqui.  "))
      .toEqual({ abertura: "Sua fome", foco: "acende", fecho: "aqui." });
  });

  it("devolve as três partes vazias para texto vazio", () => {
    expect(partesDoTitulo("   ")).toEqual({ abertura: "", foco: "", fecho: "" });
  });
});

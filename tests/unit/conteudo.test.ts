import { describe, it, expect } from "vitest";
import {
  getCategorias, getProgramacao, getHorarios, getDepoimentos, getConteudo,
} from "@/lib/conteudo";

describe("getCategorias", () => {
  it("devolve as 6 categorias do spec, na ordem", async () => {
    const cats = await getCategorias();
    expect(cats.map((c) => c.nome)).toEqual([
      "Burgers", "Espetinhos", "Carnes Nobres", "Petiscos", "Drinks", "Sobremesas",
    ]);
  });

  it("omite categorias inativas", async () => {
    const cats = await getCategorias();
    // O seed inclui "chopp" (ativo: false) exatamente para este teste: sem
    // uma linha inativa de verdade, `every(ativo)` passa mesmo se o filtro
    // de getCategorias() for apagado.
    expect(cats.find((c) => c.slug === "chopp")).toBeUndefined();
    expect(cats.every((c) => c.ativo)).toBe(true);
  });
});

describe("getHorarios", () => {
  it("devolve os 7 dias da semana", async () => {
    expect(await getHorarios()).toHaveLength(7);
  });

  it("marca segunda como fechado", async () => {
    const seg = (await getHorarios()).find((h) => h.diaSemana === 1)!;
    expect(seg.fechado).toBe(true);
  });

  it("abre terça às 14h e fecha às 22h", async () => {
    const ter = (await getHorarios()).find((h) => h.diaSemana === 2)!;
    expect(ter).toMatchObject({ abre: "14:00", fecha: "22:00", fechado: false });
  });

  it("fecha sábado às 03h da manhã seguinte", async () => {
    const sab = (await getHorarios()).find((h) => h.diaSemana === 6)!;
    expect(sab).toMatchObject({ abre: "16:00", fecha: "03:00" });
  });

  it("ordena com a semana começando na segunda", async () => {
    // Sem `.sort()` aqui: getHorarios() já promete devolver ordenado por
    // `ordem` (ver Task 2 do plano). Ordenar de novo no teste mascarava um
    // `.sort()` apagado dentro de getHorarios() — o teste passava do mesmo
    // jeito porque ele mesmo reordenava o resultado antes de comparar.
    const dias = (await getHorarios()).map((h) => h.diaSemana);
    expect(dias).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe("getConteudo", () => {
  it("traz o contato real do estabelecimento", async () => {
    const c = await getConteudo();
    expect(c.telefone).toBe("(24) 3364-5253");
    expect(c.endereco).toBe("Av. Júlio Maria, 235 — Centro");
    expect(c.cep).toBe("23900-504");
    expect(c.instagram).toBe("@nbrasaangra");
  });

  it("nasce com a campanha desligada", async () => {
    expect((await getConteudo()).campanhaAtiva).toBe(false);
  });
});

describe("getProgramacao e getDepoimentos", () => {
  it("trazem os quatro dias temáticos, ordenados", async () => {
    expect((await getProgramacao()).map((i) => i.titulo)).toEqual([
      "Noite do Espetinho", "Burger Preço Único", "DJ na Casa", "Tarde na Orla",
    ]);
  });

  it("trazem depoimentos ativos com nota entre 1 e 5", async () => {
    const d = await getDepoimentos();
    // O seed inclui "d4" (ativo: false) exatamente para este teste: sem um
    // depoimento inativo de verdade, `every(ativo)` passa mesmo se o filtro
    // de getDepoimentos() for apagado.
    expect(d.find((x) => x.id === "d4")).toBeUndefined();
    expect(d.length).toBeGreaterThan(0);
    expect(d.every((x) => x.nota >= 1 && x.nota <= 5 && x.ativo)).toBe(true);
  });
});

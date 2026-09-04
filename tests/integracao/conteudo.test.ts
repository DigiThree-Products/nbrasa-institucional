import { describe, it, expect } from "vitest";
import {
  getCategorias, getProgramacao, getHorarios, getDepoimentos, getConteudo,
} from "@/lib/conteudo";
import { conteudoSeed } from "@/lib/conteudo.seed";

describe("fachada contra o banco real", () => {
  it("devolve as 6 categorias ativas na ordem", async () => {
    expect((await getCategorias()).map((c) => c.nome)).toEqual([
      "Burgers", "Espetinhos", "Carnes Nobres", "Petiscos", "Drinks", "Sobremesas",
    ]);
  });

  it("marca exatamente uma categoria como destaque", async () => {
    const d = (await getCategorias()).filter((c) => c.destaque);
    expect(d).toHaveLength(1);
    expect(d[0].slug).toBe("burgers");
  });

  it("devolve os 7 horários com a semana começando na segunda", async () => {
    expect((await getHorarios()).map((h) => h.diaSemana)).toEqual([1,2,3,4,5,6,0]);
  });

  it("preserva o fechamento de madrugada do sábado", async () => {
    const sab = (await getHorarios()).find((h) => h.diaSemana === 6)!;
    expect(sab).toMatchObject({ abre: "16:00", fecha: "03:00" });
  });

  it("devolve o contato real, sem travessão no endereço", async () => {
    const c = await getConteudo();
    expect(c.telefone).toBe("(24) 3364-5253");
    expect(c.endereco).toBe("Av. Júlio Maria, 235, Centro");
  });

  it("devolve a copy do herói que está no seed", async () => {
    const c = await getConteudo();
    expect(c.heroTitulo).toBe(conteudoSeed.heroTitulo);
    expect(c.heroSubtitulo).toBe(conteudoSeed.heroSubtitulo);
  });

  it("não tem travessão em nenhum texto servido", async () => {
    const c = await getConteudo();
    const depoimentos = (await getDepoimentos()).map((d) => d.texto);
    const textos = [
      c.heroTitulo, c.heroSubtitulo, c.endereco, c.cidadeUf,
      c.depoimentosTitulo, c.horariosTitulo, ...depoimentos,
    ];

    expect(textos.filter((t) => t.includes("—"))).toEqual([]);
  });

  it("devolve os 4 itens de programação e os 3 depoimentos ativos", async () => {
    expect(await getProgramacao()).toHaveLength(4);
    expect(await getDepoimentos()).toHaveLength(3);
  });
});

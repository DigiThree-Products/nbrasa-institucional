import { describe, it, expect } from "vitest";
import { criarClienteServidor } from "@/lib/supabase/servidor";

const anon = criarClienteServidor();

describe("RLS: leitura pública", () => {
  it("lê as categorias ativas", async () => {
    const { data, error } = await anon.from("categorias").select("slug").eq("ativo", true);
    expect(error).toBeNull();
    expect(data!.length).toBe(6);
  });

  it("NÃO enxerga a categoria inativa", async () => {
    const { data } = await anon.from("categorias").select("slug");
    expect(data!.map((c) => c.slug)).not.toContain("chopp");
  });

  it("NÃO enxerga o depoimento inativo", async () => {
    const { data } = await anon.from("depoimentos").select("id");
    expect(data!.map((d) => d.id)).not.toContain("d4");
  });

  it("lê os sete horários, inclusive o dia fechado", async () => {
    const { data } = await anon.from("horarios").select("dia_semana, fechado");
    expect(data!.length).toBe(7);
    expect(data!.some((h) => h.fechado)).toBe(true);
  });
});

describe("RLS: escrita anônima é bloqueada", () => {
  it("não insere categoria", async () => {
    const { error } = await anon.from("categorias").insert({
      slug: "invasor", nome: "x", kicker: "x", descricao: "x", ordem: 99,
    });
    expect(error).not.toBeNull();
  });

  it("não altera o conteúdo", async () => {
    const { error } = await anon.from("conteudo")
      .update({ telefone: "(00) 0000-0000" }).eq("id", 1);
    // Postgres devolve erro OU zero linhas afetadas, conforme a policy.
    const { data } = await anon.from("conteudo").select("telefone").eq("id", 1).single();
    expect(error !== null || data!.telefone !== "(00) 0000-0000").toBe(true);
    expect(data!.telefone).toBe("(24) 3364-5253");
  });

  it("não apaga depoimento", async () => {
    await anon.from("depoimentos").delete().eq("id", "d1");
    const { data } = await anon.from("depoimentos").select("id").eq("id", "d1");
    expect(data!.length).toBe(1);
  });
});

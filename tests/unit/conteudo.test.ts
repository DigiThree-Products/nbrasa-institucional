import { describe, it, expect, vi } from "vitest";

// `lib/supabase/servidor.ts` valida NEXT_PUBLIC_SUPABASE_* no topo do modulo,
// de proposito — o contrato esta em tests/unit/supabaseConfig.test.ts. Como a
// fachada agora importa aquele modulo, importa-la aqui explodiria: a suite
// unitaria roda offline e sem .env.local.
//
// vi.hoisted roda antes dos imports, entao os valores sinteticos abaixo ja
// estao no ambiente quando a fachada e avaliada. Nenhum teste deste arquivo
// faz rede: porOrdem e ativos sao funcoes puras, e as cinco funcoes get* sao
// exercidas contra o banco real em tests/integracao/conteudo.test.ts.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://teste.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "chave-de-teste";
});

import { porOrdem, ativos } from "@/lib/conteudo";

describe("porOrdem", () => {
  it("ordena crescente pelo campo ordem", () => {
    const itens = [{ ordem: 3 }, { ordem: 1 }, { ordem: 2 }];
    expect([...itens].sort(porOrdem).map((i) => i.ordem)).toEqual([1, 2, 3]);
  });

  it("não muda a ordem de itens com o mesmo valor", () => {
    const a = { ordem: 1, id: "a" }, b = { ordem: 1, id: "b" };
    expect([a, b].sort(porOrdem).map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("ativos", () => {
  it("mantém apenas itens com ativo true", () => {
    const itens = [{ ativo: true, id: "x" }, { ativo: false, id: "y" }];
    expect(itens.filter(ativos).map((i) => i.id)).toEqual(["x"]);
  });
});

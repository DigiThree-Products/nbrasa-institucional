import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ORIGINAL = { ...process.env };

beforeEach(() => { vi.resetModules(); });
afterEach(() => { process.env = { ...ORIGINAL }; });

describe("configuração do Supabase", () => {
  it("falha com mensagem clara quando falta a URL", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "chave";
    await expect(import("@/lib/supabase/servidor")).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("falha com mensagem clara quando falta a chave anônima", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    await expect(import("@/lib/supabase/servidor")).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("expõe as variáveis quando ambas existem", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "chave-anonima";
    const mod = await import("@/lib/supabase/servidor");
    expect(mod.SUPABASE_URL).toBe("https://exemplo.supabase.co");
    expect(mod.SUPABASE_ANON_KEY).toBe("chave-anonima");
  });
});

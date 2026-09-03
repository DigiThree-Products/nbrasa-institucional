import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

describe("segredos", () => {
  it("a service role key não aparece em nenhum arquivo servido ao navegador", () => {
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(chave, "rode com .env.local carregado").toBeTruthy();
    const publicos = arquivos(".next/static");
    const vazando = publicos.filter((f) =>
      readFileSync(f, "utf8").includes(chave!),
    );
    expect(vazando, `chave vazou em: ${vazando.join(", ")}`).toEqual([]);
  });

  it("nenhum modulo de app/ ou components/ importa o cliente admin", () => {
    const fontes = [...arquivos("app"), ...arquivos("components")]
      .filter((f) => /\.tsx?$/.test(f));
    const culpados = fontes.filter((f) =>
      readFileSync(f, "utf8").includes("supabase/admin"),
    );
    expect(culpados, `importam o cliente admin: ${culpados.join(", ")}`).toEqual([]);
  });
});

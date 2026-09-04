import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { D_CHAMA_OFICIAL } from "@/lib/marca";

/**
 * O favicon é gerado por `python scripts/gerar-favicon.py` a partir de
 * `lib/marca.ts`, mas os arquivos ficam versionados: ninguém roda o script
 * num deploy. Isso abre espaço para eles envelhecerem em silêncio se a curva
 * da chama mudar e o script não for rodado de novo.
 *
 * Este teste fecha essa porta para o SVG, que é o único dos três legível em
 * texto. O `.ico` e o `.png` saem do mesmo script no mesmo passo, então
 * cobrir o SVG já denuncia a desatualização.
 */

const icone = readFileSync("app/icon.svg", "utf8");

describe("favicon", () => {
  it.each(D_CHAMA_OFICIAL)(
    "usa o path %#  da chama oficial, sem cópia divergente",
    (path) => {
      expect(icone).toContain(path);
    },
  );

  it("é chama branca sobre azulejo brasa, e não a chama vermelha solta", () => {
    // A 16px, que é o tamanho que aparece na aba, a chama solta vira mancha:
    // ela é bem mais alta que larga e sobra pouca massa. O azulejo dá presença
    // e branco sobre brasa faz 5,31:1, o mesmo par que contraste.test.ts já
    // valida. Ver o cabeçalho de scripts/gerar-favicon.py.
    expect(icone).toContain('fill="#cf2434"');
    expect(icone).toContain('fill="#ffffff"');
  });

  it("é quadrado, senão o navegador distorce ou sobra vão", () => {
    // A chama oficial é 468×684. Um viewBox com essa proporção viraria um
    // ícone achatado ou com tarja nas laterais.
    const viewBox = icone.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    expect(viewBox).not.toBeNull();
    expect(viewBox![1]).toBe(viewBox![2]);
  });

  it("mantém os três arquivos que o App Router serve", () => {
    // icon.svg cobre Chrome e Firefox, favicon.ico cobre Safari e o pedido
    // cru a /favicon.ico, apple-icon.png cobre o atalho do iOS.
    for (const arquivo of ["app/icon.svg", "app/favicon.ico", "app/apple-icon.png"]) {
      expect(statSync(arquivo).size).toBeGreaterThan(0);
    }
  });
});

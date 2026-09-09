import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { conteudoSeed } from "@/lib/conteudo.seed";
import { partesDoTitulo } from "@/lib/tituloHero";

/**
 * A Combust desenha o foco do título do herói, e só ele. Ela vem subsetada
 * por `scripts/gerar-combust.py`: a fonte cheia tem 305 code points e 84 kB
 * em WOFF2, e servir tudo isso por uma palavra não se paga.
 *
 * O risco que este arquivo cobre é o do subset: alguém troca `heroTitulo` no
 * banco por uma palavra com um caractere que ficou de fora, e o navegador
 * desenha metade em Combust e metade no fallback, no meio da palavra. É o
 * mesmo perigo que `owners.test.ts` cobre para o resto do display, e a mesma
 * cura: ler a fonte de verdade em vez de confiar na memória de quem editou.
 *
 * A fonte de verdade aqui é a constante `GLIFOS` do script gerador, e não o
 * WOFF2 servido. Ler o WOFF2 exigiria desfazer o brotli e as transformações
 * de tabela que o formato aplica, o que em Node significa dependência nova
 * para conferir um dado que o script já declara. Se o script mudar, o teste
 * acompanha sozinho; se alguém gerar o arquivo com outro conjunto, o script
 * é que está errado, e é ele que o teste deve espelhar.
 */

const SCRIPT = "scripts/gerar-combust.py";
const WOFF2 = "app/fontes/combust.woff2";

/**
 * Extrai a constante `GLIFOS` do script gerador.
 *
 * Ela é escrita como literais de string adjacentes entre parênteses, que é
 * como o Python concatena sem operador. Pegamos o bloco inteiro e juntamos
 * o conteúdo de cada literal.
 */
function glifosDoSubset(): Set<number> {
  const fonte = readFileSync(SCRIPT, "utf8");
  const bloco = fonte.match(/GLIFOS = \(([\s\S]*?)\n\)/);
  if (!bloco) throw new Error(`GLIFOS não encontrado em ${SCRIPT}`);

  const pedacos = [...bloco[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  if (pedacos.length === 0) throw new Error(`GLIFOS sem literais em ${SCRIPT}`);

  const pontos = new Set<number>();
  for (const p of pedacos) {
    for (const c of p.replace(/\\(.)/g, "$1")) pontos.add(c.codePointAt(0)!);
  }
  return pontos;
}

describe("subset da Combust", () => {
  const glifos = glifosDoSubset();
  const { foco } = partesDoTitulo(conteudoSeed.heroTitulo);

  /**
   * O `h1` do herói aplica `uppercase`, então o glifo que o navegador procura
   * é sempre o maiúsculo. Testar a string crua deixaria passar um "ç" que
   * vira "Ç" na tela e some do mesmo jeito.
   */
  function faltando(texto: string): string[] {
    return [...texto.toUpperCase()].filter((c) => !glifos.has(c.codePointAt(0)!));
  }

  it("cobre o foco do título do herói", () => {
    expect(foco).not.toBe("");
    expect(faltando(foco)).toEqual([]);
  });

  it("cobre toda a caixa alta acentuada do português", () => {
    // O foco vem do banco e o painel de admin vai poder trocá-lo. Cobrir o
    // alfabeto acentuado inteiro é o que permite trocar a palavra sem
    // regerar a fonte, que é justamente o que ninguém lembraria de fazer.
    expect(faltando("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toEqual([]);
    expect(faltando("ÁÀÂÃÇÉÊÍÓÔÕÚÜ")).toEqual([]);
  });

  it("não carrega minúsculas, que o uppercase do h1 nunca pede", () => {
    // Não é preciosismo de bytes: é a afirmação de que o subset foi pensado.
    // Se alguém usar a Combust em texto corrido, este teste falha e obriga a
    // revisar o script em vez de descobrir o buraco em produção.
    expect(glifos.has("a".codePointAt(0)!)).toBe(false);
  });

  it("serve um arquivo pequeno, que é o motivo de subsetar", () => {
    // A fonte cheia dá 84 kB em WOFF2. O teto aqui é folgado contra os 28 kB
    // atuais, e existe para que voltar a servir a fonte inteira, por engano
    // ou por atalho, falhe aqui e não no orçamento de performance.
    const bytes = readFileSync(WOFF2).byteLength;
    expect(bytes).toBeLessThan(40_000);
  });
});

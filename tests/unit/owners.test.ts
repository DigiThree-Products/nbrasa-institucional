import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  categoriasSeed, programacaoSeed, conteudoSeed,
} from "@/lib/conteudo.seed";

/**
 * A Owners que o site usa é a versão TRIAL, e ela tem 73 glifos: nenhuma
 * letra acentuada, nenhum apóstrofo reto, nenhum hífen. Uma string de display
 * com acento não some, faz coisa pior: renderiza metade em Owners e metade na
 * fonte de fallback, no meio da palavra, e ninguém percebe até estar no ar.
 *
 * Este teste lê o `cmap` do OTF de origem, não do WOFF2 gerado, porque a
 * origem é o que manda: trocar o OTF pela versão licenciada (que tem os
 * acentos) deve fazer as restrições caírem sozinhas, sem editar teste.
 *
 * Todo título de display novo escrito direto na JSX ganha uma linha em
 * LITERAIS_DE_DISPLAY. O que vem do seed já é coberto automaticamente.
 */

const PASTA_OTF = "fotos-site/owners-font-family";
const PREFIXO = "OwnersTRIALXNarrow-Black";

/** Lê os code points do `cmap` do OTF, sem depender de biblioteca de fonte. */
function glifosDaOwners(): Set<number> {
  const arquivo = readdirSync(PASTA_OTF).find((n) => n.startsWith(PREFIXO));
  if (!arquivo) throw new Error(`OTF ${PREFIXO}* não encontrado em ${PASTA_OTF}`);
  const buf = readFileSync(join(PASTA_OTF, arquivo));
  return lerCmap(buf);
}

/**
 * Percorre a tabela `cmap` do OpenType e devolve os code points mapeados.
 * Trata só o formato 4, que é o único que a Owners TRIAL usa; qualquer outro
 * vira erro explícito, porque devolver conjunto vazio faria o teste passar
 * por acidente.
 */
function lerCmap(buf: Buffer): Set<number> {
  const numTabelas = buf.readUInt16BE(4);
  let inicioCmap = -1;
  for (let i = 0; i < numTabelas; i++) {
    const reg = 12 + i * 16;
    if (buf.toString("ascii", reg, reg + 4) === "cmap") {
      inicioCmap = buf.readUInt32BE(reg + 8);
      break;
    }
  }
  if (inicioCmap < 0) throw new Error("OTF sem tabela cmap");

  const numSub = buf.readUInt16BE(inicioCmap + 2);
  let inicioSub = -1;
  for (let i = 0; i < numSub; i++) {
    const reg = inicioCmap + 4 + i * 8;
    const plataforma = buf.readUInt16BE(reg);
    const codificacao = buf.readUInt16BE(reg + 2);
    // 3/1 é Windows Unicode BMP, a subtabela que todo OTF de texto traz.
    if (plataforma === 3 && codificacao === 1) {
      inicioSub = inicioCmap + buf.readUInt32BE(reg + 4);
      break;
    }
  }
  if (inicioSub < 0) throw new Error("OTF sem subtabela cmap 3/1");

  const formato = buf.readUInt16BE(inicioSub);
  if (formato !== 4) throw new Error(`cmap formato ${formato}, esperado 4`);

  const segX2 = buf.readUInt16BE(inicioSub + 6);
  const segs = segX2 / 2;
  const fim = inicioSub + 14;
  const inicio = fim + segX2 + 2;

  const pontos = new Set<number>();
  for (let s = 0; s < segs; s++) {
    const ultimo = buf.readUInt16BE(fim + s * 2);
    const primeiro = buf.readUInt16BE(inicio + s * 2);
    if (primeiro === 0xffff) continue;
    for (let c = primeiro; c <= ultimo; c++) pontos.add(c);
  }
  return pontos;
}

/**
 * Títulos de display escritos direto na JSX. Os que vêm do banco entram por
 * `textosDoSeed()`. Esta lista precisa ser mantida à mão porque não existe
 * jeito honesto de extrair literal de JSX sem parsear TypeScript.
 */
const LITERAIS_DE_DISPLAY = [
  "Algo saiu do ponto",                       // app/error.tsx
  "Nada por aqui",                            // app/not-found.tsx
  "Feito na hora,",                           // Cardapio.tsx
  "servido no capricho",                      // Cardapio.tsx
  "Vai",                                      // Delivery.tsx
  "N’brasando",                               // Delivery.tsx
  "Tem motivo",                               // HorariosProgramacao.tsx
  "pra vir todo dia",                         // HorariosProgramacao.tsx
  "Estamos a um passo",                       // OndeEstamos.tsx
  "da vista mar",                             // OndeEstamos.tsx
  "n’Brasa",                                  // Header.tsx e Footer.tsx
  "feel",                                     // Delivery.tsx, empilhado
  "the",                                      // Delivery.tsx, empilhado
  "fire",                                     // Delivery.tsx, empilhado
  "FIRE",                                     // ParedeDeTipos.tsx
  "N’BRASA",                                  // ParedeDeTipos.tsx
  "VAI N’BRASANDO",                           // ParedeDeTipos.tsx
];

function textosDoSeed(): string[] {
  return [
    conteudoSeed.heroTitulo,
    conteudoSeed.depoimentosTitulo,
    conteudoSeed.horariosTitulo,
    ...categoriasSeed.map((c) => c.nome),
    ...programacaoSeed.map((p) => p.titulo),
  ];
}

describe("charset da Owners TRIAL", () => {
  const glifos = glifosDaOwners();

  // O site inteiro usa display em caixa alta, então o glifo que o navegador
  // procura é o maiúsculo. Testar a string crua deixaria passar um "ç" que
  // vira "Ç" na tela e some do mesmo jeito.
  function faltando(texto: string): string[] {
    return [...texto.toUpperCase()].filter((c) => !glifos.has(c.codePointAt(0)!));
  }

  it("tem os 72 code points esperados da versão trial", () => {
    // 72, e não 74: o OTF traz uma subtabela Macintosh que mapeia tab e CR
    // para o mesmo glifo de espaço. Contamos só a 3/1, que é a que o
    // navegador usa. Se este número subir, chegou a versão licenciada:
    // reavalie se as restrições de copy desta leva ainda são necessárias.
    expect(glifos.size).toBe(72);
  });

  it.each(LITERAIS_DE_DISPLAY)("cobre o literal de display %j", (texto) => {
    expect(faltando(texto)).toEqual([]);
  });

  it.each(textosDoSeed())("cobre o texto de display do seed %j", (texto) => {
    expect(faltando(texto)).toEqual([]);
  });

  it("continua sem apóstrofo reto, que é o motivo de a marca usar a aspa curva", () => {
    expect(glifos.has("'".codePointAt(0)!)).toBe(false);
    expect(glifos.has("’".codePointAt(0)!)).toBe(true);
  });
});

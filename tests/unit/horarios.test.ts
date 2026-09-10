import { describe, it, expect } from "vitest";
import { agruparHorarios, diasAbertos, horarioDosDias, FECHADO } from "@/lib/horarios";
import { horariosSeed } from "@/lib/conteudo.seed";
import type { Horario } from "@/lib/conteudo.tipos";

const h = (
  diaSemana: number, ordem: number,
  abre: string | null, fecha: string | null, fechado = false,
): Horario => ({ diaSemana, ordem, abre, fecha, fechado });

describe("agruparHorarios", () => {
  it("junta três dias consecutivos iguais numa faixa com 'a'", () => {
    expect(agruparHorarios([
      h(2, 1, "14:00", "22:00"), h(3, 2, "14:00", "22:00"), h(4, 3, "14:00", "22:00"),
    ])).toEqual([{ label: "Terça a quinta", texto: "14h às 22h" }]);
  });

  it("junta dois dias consecutivos iguais com 'e'", () => {
    expect(agruparHorarios([
      h(5, 1, "16:00", "03:00"), h(6, 2, "16:00", "03:00"),
    ])).toEqual([{ label: "Sexta e sábado", texto: "16h às 03h" }]);
  });

  it("mantém um dia isolado com o próprio nome", () => {
    expect(agruparHorarios([h(0, 1, "14:00", "22:00")]))
      .toEqual([{ label: "Domingo", texto: "14h às 22h" }]);
  });

  it("escreve 'Fechado' para dia fechado", () => {
    expect(agruparHorarios([h(1, 1, null, null, true)]))
      .toEqual([{ label: "Segunda-feira", texto: "Fechado" }]);
  });

  it("usa exatamente a constante FECHADO para dia fechado", () => {
    const [faixa] = agruparHorarios([h(1, 1, null, null, true)]);
    expect(faixa.texto).toBe(FECHADO);
  });

  it("NÃO junta dias de mesmo horário que não são consecutivos", () => {
    // segunda fechada separa domingo de terça, mesmo com horário igual
    expect(agruparHorarios(horariosSeed)).toEqual([
      { label: "Segunda-feira",   texto: "Fechado"   },
      { label: "Terça a quinta",  texto: "14h às 22h" },
      { label: "Sexta e sábado",  texto: "16h às 03h" },
      { label: "Domingo",         texto: "14h às 22h" },
    ]);
  });

  it("não junta horários iguais quando há um buraco na ordem (não adjacentes)", () => {
    // ordem 2 e 5, mesmo horário, mas sem nada preenchendo 3-4: não deve virar uma faixa
    expect(agruparHorarios([
      h(2, 2, "14:00", "22:00"), h(5, 5, "14:00", "22:00"),
    ])).toEqual([
      { label: "Terça-feira", texto: "14h às 22h" },
      { label: "Sexta-feira", texto: "14h às 22h" },
    ]);
  });

  it("devolve lista vazia para entrada vazia", () => {
    expect(agruparHorarios([])).toEqual([]);
  });

  it("preenche a hora com zero à esquerda quando o horário vem sem padding (ex.: digitado no admin)", () => {
    // "9:00" tem 4 caracteres, não 5 — slice(0,2) sozinho leria "9:" e
    // renderizaria "9:h". Inalcançável pelo seed atual (sempre "HH:MM"),
    // mas alcançável assim que um form de admin deixar o dono digitar livre.
    expect(agruparHorarios([h(2, 1, "9:00", "22:00")]))
      .toEqual([{ label: "Terça-feira", texto: "09h às 22h" }]);
  });
});

// Desde 2026-09-10 o horário mora dentro do card de programação, e o card
// sabe seus dias pelo campo `dias`. Estas duas funções são a ponte: uma
// traduz um conjunto de dias no texto do card, a outra resume os dias
// abertos para o subtítulo da seção.
describe("horarioDosDias", () => {
  it("devolve um texto só quando todos os dias do card abrem no mesmo horário", () => {
    // "Terça e quinta" (Noite do Espetinho): dias 2 e 4, ambos 14h às 22h.
    expect(horarioDosDias(horariosSeed, [2, 4])).toBe("14h às 22h");
  });

  it("mantém a ordem da semana, e não a ordem em que os dias foram pedidos", () => {
    // pedidos fora de ordem: sábado (ordem 6) antes de terça (ordem 2)
    expect(horarioDosDias(horariosSeed, [6, 2])).toBe("14h às 22h, 16h às 03h");
  });

  it("lista os dois horários quando os dias do card divergem", () => {
    // quinta fecha 22h e sexta fecha 03h: o card não pode fingir um horário só
    expect(horarioDosDias(horariosSeed, [4, 5])).toBe("14h às 22h, 16h às 03h");
  });

  it("escreve Fechado quando o dia do card está fechado", () => {
    expect(horarioDosDias(horariosSeed, [1])).toBe(FECHADO);
  });

  it("ignora dia que não existe na tabela em vez de quebrar o texto", () => {
    // um `dias` desalinhado com a tabela some do card, não vira "undefined"
    expect(horarioDosDias(horariosSeed, [2, 9])).toBe("14h às 22h");
  });

  it("devolve null quando nenhum dia do card tem horário cadastrado", () => {
    expect(horarioDosDias(horariosSeed, [9])).toBeNull();
  });

  it("devolve null para card sem dias", () => {
    expect(horarioDosDias(horariosSeed, [])).toBeNull();
  });
});

describe("diasAbertos", () => {
  it("resume o seed na faixa que vai de terça a domingo", () => {
    // é a frase do subtítulo: a segunda é o único dia fechado
    expect(diasAbertos(horariosSeed)).toBe("terça a domingo");
  });

  it("volta em minúscula, porque entra no meio de uma frase", () => {
    expect(diasAbertos(horariosSeed)).toBe(diasAbertos(horariosSeed).toLowerCase());
  });

  it("junta com 'e' quando os dias abertos não são uma faixa só", () => {
    expect(diasAbertos([
      h(2, 2, "14:00", "22:00"), h(3, 3, "14:00", "22:00"),
      h(5, 5, null, null, true), h(6, 6, "16:00", "03:00"),
    ])).toBe("terça e quarta e sábado");
  });

  it("nomeia o dia por extenso quando a casa abre um dia só", () => {
    expect(diasAbertos([h(0, 7, "14:00", "22:00"), h(1, 1, null, null, true)]))
      .toBe("domingo");
  });

  it("devolve string vazia quando a casa não abre nenhum dia", () => {
    // o componente esconde o subtítulo em vez de escrever "Abrimos de".
    expect(diasAbertos([h(1, 1, null, null, true)])).toBe("");
  });

  it("devolve string vazia para entrada vazia", () => {
    expect(diasAbertos([])).toBe("");
  });
});

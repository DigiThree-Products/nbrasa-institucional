import { describe, it, expect } from "vitest";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
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
    ])).toEqual([{ label: "Terça a quinta", texto: "14h — 22h" }]);
  });

  it("junta dois dias consecutivos iguais com 'e'", () => {
    expect(agruparHorarios([
      h(5, 1, "16:00", "03:00"), h(6, 2, "16:00", "03:00"),
    ])).toEqual([{ label: "Sexta e sábado", texto: "16h — 03h" }]);
  });

  it("mantém um dia isolado com o próprio nome", () => {
    expect(agruparHorarios([h(0, 1, "14:00", "22:00")]))
      .toEqual([{ label: "Domingo", texto: "14h — 22h" }]);
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
      { label: "Terça a quinta",  texto: "14h — 22h" },
      { label: "Sexta e sábado",  texto: "16h — 03h" },
      { label: "Domingo",         texto: "14h — 22h" },
    ]);
  });

  it("não junta horários iguais quando há um buraco na ordem (não adjacentes)", () => {
    // ordem 2 e 5, mesmo horário, mas sem nada preenchendo 3-4: não deve virar uma faixa
    expect(agruparHorarios([
      h(2, 2, "14:00", "22:00"), h(5, 5, "14:00", "22:00"),
    ])).toEqual([
      { label: "Terça-feira", texto: "14h — 22h" },
      { label: "Sexta-feira", texto: "14h — 22h" },
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
      .toEqual([{ label: "Terça-feira", texto: "09h — 22h" }]);
  });
});

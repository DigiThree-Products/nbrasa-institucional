import type { Horario } from "./conteudo.tipos";

export type FaixaHorario = { label: string; texto: string };

/** Texto usado quando o dia está fechado. Consumido também fora deste módulo (ex.: Hero). */
export const FECHADO = "Fechado";

const NOMES = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

/** Forma curta usada dentro de faixas: "Terça a quinta", não "Terça-feira a quinta-feira". */
const CURTOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// padStart antes do slice: sem ele, um horário não-preenchido em zero (ex.:
// digitado como "9:00" num futuro form de admin) renderiza "9:h" em vez de
// "09h". Inalcançável a partir do seed de hoje (sempre "HH:MM"), mas
// alcançável assim que o painel deixar o dono digitar o horário.
const hhmm = (v: string) => `${v.padStart(5, "0").slice(0, 2)}h`;

function texto(h: Horario): string {
  if (h.fechado || !h.abre || !h.fecha) return FECHADO;
  return `${hhmm(h.abre)} — ${hhmm(h.fecha)}`;
}

const mesmoHorario = (a: Horario, b: Horario) => texto(a) === texto(b);

function rotulo(grupo: Horario[]): string {
  if (grupo.length === 1) return NOMES[grupo[0].diaSemana];
  const primeiro = CURTOS[grupo[0].diaSemana];
  const ultimo = CURTOS[grupo[grupo.length - 1].diaSemana].toLowerCase();
  return grupo.length === 2 ? `${primeiro} e ${ultimo}` : `${primeiro} a ${ultimo}`;
}

export function agruparHorarios(horarios: Horario[]): FaixaHorario[] {
  if (horarios.length === 0) return [];

  const ordenados = [...horarios].sort((a, b) => a.ordem - b.ordem);
  const grupos: Horario[][] = [[ordenados[0]]];

  for (const atual of ordenados.slice(1)) {
    const grupo = grupos[grupos.length - 1];
    const anterior = grupo[grupo.length - 1];
    // só agrupa se for adjacente na ordem de exibição E tiver o mesmo horário
    if (atual.ordem === anterior.ordem + 1 && mesmoHorario(atual, anterior)) {
      grupo.push(atual);
    } else {
      grupos.push([atual]);
    }
  }

  return grupos.map((g) => ({ label: rotulo(g), texto: texto(g[0]) }));
}

import type { Horario } from "./conteudo.tipos";

export type FaixaHorario = { label: string; texto: string };

/** Texto usado quando o dia está fechado. */
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
  // "às", e não travessão: o cliente pediu que ele não apareça em lugar
  // nenhum do site.
  return `${hhmm(h.abre)} às ${hhmm(h.fecha)}`;
}

const mesmoHorario = (a: Horario, b: Horario) => texto(a) === texto(b);

function rotulo(grupo: Horario[]): string {
  if (grupo.length === 1) return NOMES[grupo[0].diaSemana];
  const primeiro = CURTOS[grupo[0].diaSemana];
  const ultimo = CURTOS[grupo[grupo.length - 1].diaSemana].toLowerCase();
  return grupo.length === 2 ? `${primeiro} e ${ultimo}` : `${primeiro} a ${ultimo}`;
}

/**
 * Texto do horário de um conjunto de dias, para dentro do card de
 * programação. Desde 2026-09-10 o horário não tem mais lista própria: cada
 * card de programação carrega o seu, e o card sabe quais dias cobre pelo
 * campo `dias`.
 *
 * Devolve os horários **distintos** dos dias pedidos, na ordem de exibição
 * da semana e não na ordem em que o card os listou. Quase sempre é um só,
 * porque os dias de um evento costumam abrir junto; quando divergem, mostrar
 * os dois é a única saída honesta, e um card que finge horário único manda o
 * cliente na hora errada.
 *
 * Dia que não está na tabela é ignorado em vez de virar texto quebrado: um
 * `dias` desalinhado com `horarios` é erro de dado do painel, não motivo
 * para escrever "undefined" no card. Sem nenhum dia conhecido devolve null,
 * e aí o card sai sem a linha do horário.
 */
export function horarioDosDias(horarios: Horario[], dias: number[]): string | null {
  const porDia = new Map(horarios.map((h) => [h.diaSemana, h]));
  const encontrados = dias
    .map((d) => porDia.get(d))
    .filter((h): h is Horario => h !== undefined)
    .sort((a, b) => a.ordem - b.ordem);

  if (encontrados.length === 0) return null;
  // Set preserva a ordem de inserção, então a deduplicação sai já ordenada.
  return [...new Set(encontrados.map(texto))].join(", ");
}

/**
 * Faixa de dias em que a casa abre, para o subtítulo da seção ("Abrimos de
 * terça a domingo").
 *
 * Sai daqui, e não de um texto fixo na JSX, porque a frase cita quais dias a
 * casa abre e os dias vêm do banco: escrita à mão, ela passaria a mentir no
 * dia em que o dono abrisse na segunda pelo painel. É a mesma amarra que o
 * comentário de `horariosTitulo` registra, que é não deixar o título
 * contradizer a lista que ele encabeça.
 *
 * Agrupa por adjacência na ordem de exibição e **ignora o horário**, ao
 * contrário de `agruparHorarios`: aqui só interessa abrir ou não abrir, e
 * agrupar por horário partiria "terça a domingo" em três pedaços.
 *
 * Volta em minúscula porque o destino dela é o meio de uma frase. Sem
 * nenhum dia aberto volta string vazia, e o componente esconde o subtítulo
 * em vez de escrever "Abrimos de" sozinho.
 */
export function diasAbertos(horarios: Horario[]): string {
  const abertos = horarios
    .filter((h) => texto(h) !== FECHADO)
    .sort((a, b) => a.ordem - b.ordem);

  if (abertos.length === 0) return "";

  const grupos: Horario[][] = [[abertos[0]]];
  for (const atual of abertos.slice(1)) {
    const grupo = grupos[grupos.length - 1];
    if (atual.ordem === grupo[grupo.length - 1].ordem + 1) grupo.push(atual);
    else grupos.push([atual]);
  }

  return grupos.map(rotulo).join(" e ").toLowerCase();
}

/**
 * Agrupa dias adjacentes de mesmo horário numa faixa só ("Terça a quinta").
 *
 * **Sem consumidor na interface desde 2026-09-10**, quando a lista de
 * horários saiu da seção e o horário passou a morar dentro do card de
 * programação. Continua exportado e testado de propósito: é a forma de
 * exibir a semana inteira, e o painel de admin e o rodapé são os candidatos
 * naturais a pedi-la de volta. Apagar agora custaria reescrever o
 * agrupamento por adjacência do zero.
 */
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

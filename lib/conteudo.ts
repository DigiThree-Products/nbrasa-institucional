import type {
  Categoria, ItemProgramacao, Horario, Depoimento, Conteudo,
} from "./conteudo.tipos";
import {
  categoriasSeed, programacaoSeed, horariosSeed, depoimentosSeed, conteudoSeed,
} from "./conteudo.seed";

const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem;
const ativos = <T extends { ativo: boolean }>(x: T) => x.ativo;

export async function getCategorias(): Promise<Categoria[]> {
  return categoriasSeed.filter(ativos).sort(porOrdem);
}

export async function getProgramacao(): Promise<ItemProgramacao[]> {
  return programacaoSeed.filter(ativos).sort(porOrdem);
}

export async function getHorarios(): Promise<Horario[]> {
  return [...horariosSeed].sort(porOrdem);
}

export async function getDepoimentos(): Promise<Depoimento[]> {
  return depoimentosSeed.filter(ativos).sort(porOrdem);
}

export async function getConteudo(): Promise<Conteudo> {
  return conteudoSeed;
}

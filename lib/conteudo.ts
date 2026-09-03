import type {
  Categoria, ItemProgramacao, Horario, Depoimento, Conteudo,
} from "./conteudo.tipos";
import { unstable_cache } from "next/cache";
import { criarClienteServidor } from "./supabase/servidor";

/** Tags de cache. A rota de revalidacao so aceita estes valores, e a Fase B
 *  chamara revalidateTag com eles direto das Server Actions. */
export const TAGS = {
  categorias: "categorias",
  programacao: "programacao",
  horarios: "horarios",
  depoimentos: "depoimentos",
  conteudo: "conteudo",
} as const;

export const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem;
export const ativos = <T extends { ativo: boolean }>(x: T) => x.ativo;

/** Falha alto em vez de devolver lista vazia: uma seção silenciosamente vazia
 *  em produção é pior que um erro visível, porque ninguém percebe. */
function exigirSemErro(erro: { message: string } | null, o_que: string) {
  if (erro) throw new Error(`Falha ao ler ${o_que} do Supabase: ${erro.message}`);
}

export const getCategorias = unstable_cache(
  async (): Promise<Categoria[]> => {
    const { data, error } = await criarClienteServidor()
      .from("categorias")
      .select("slug, nome, kicker, descricao, foto_path, ordem, ativo, destaque")
      .eq("ativo", true)
      .order("ordem");
    exigirSemErro(error, "categorias");
    return (data ?? []).map((r) => ({
      slug: r.slug, nome: r.nome, kicker: r.kicker, descricao: r.descricao,
      fotoPath: r.foto_path, ordem: r.ordem, ativo: r.ativo, destaque: r.destaque,
    }));
  },
  ["categorias"],
  { tags: [TAGS.categorias] },
);

export const getProgramacao = unstable_cache(
  async (): Promise<ItemProgramacao[]> => {
    const { data, error } = await criarClienteServidor()
      .from("programacao")
      .select("id, dias_label, titulo, descricao, ordem, ativo")
      .eq("ativo", true)
      .order("ordem");
    exigirSemErro(error, "programacao");
    return (data ?? []).map((r) => ({
      id: r.id, diasLabel: r.dias_label, titulo: r.titulo,
      descricao: r.descricao, ordem: r.ordem, ativo: r.ativo,
    }));
  },
  ["programacao"],
  { tags: [TAGS.programacao] },
);

export const getHorarios = unstable_cache(
  async (): Promise<Horario[]> => {
    const { data, error } = await criarClienteServidor()
      .from("horarios")
      .select("dia_semana, abre, fecha, fechado, ordem")
      .order("ordem");
    exigirSemErro(error, "horarios");
    return (data ?? []).map((r) => ({
      diaSemana: r.dia_semana, abre: r.abre, fecha: r.fecha,
      fechado: r.fechado, ordem: r.ordem,
    }));
  },
  ["horarios"],
  { tags: [TAGS.horarios] },
);

export const getDepoimentos = unstable_cache(
  async (): Promise<Depoimento[]> => {
    const { data, error } = await criarClienteServidor()
      .from("depoimentos")
      .select("id, texto, autor, nota, ordem, ativo")
      .eq("ativo", true)
      .order("ordem");
    exigirSemErro(error, "depoimentos");
    return (data ?? []).map((r) => ({
      id: r.id, texto: r.texto, autor: r.autor,
      nota: r.nota, ordem: r.ordem, ativo: r.ativo,
    }));
  },
  ["depoimentos"],
  { tags: [TAGS.depoimentos] },
);

export const getConteudo = unstable_cache(
  async (): Promise<Conteudo> => {
    const { data, error } = await criarClienteServidor()
      .from("conteudo")
      .select("*").eq("id", 1).single();
    exigirSemErro(error, "conteudo");
    const r = data!;
    return {
      heroTitulo: r.hero_titulo, heroSubtitulo: r.hero_subtitulo,
      telefone: r.telefone, endereco: r.endereco, cidadeUf: r.cidade_uf, cep: r.cep,
      whatsappUrl: r.whatsapp_url, instagram: r.instagram,
      campanhaAtiva: r.campanha_ativa, campanhaTitulo: r.campanha_titulo,
      depoimentosTitulo: r.depoimentos_titulo, horariosTitulo: r.horarios_titulo,
    };
  },
  ["conteudo"],
  { tags: [TAGS.conteudo] },
);

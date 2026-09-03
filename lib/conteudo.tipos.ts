export type Categoria = {
  slug: string;
  nome: string;
  kicker: string;
  descricao: string;
  fotoPath: string | null;
  ordem: number;
  ativo: boolean;
  /** Marca a categoria que ocupa o tile grande do bento. Substitui a escolha
   *  por posição no array, que fazia reordenar mover o destaque sem intenção. */
  destaque: boolean;
};

export type ItemProgramacao = {
  id: string;
  diasLabel: string;
  titulo: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
};

/** diaSemana segue Date.getDay(): 0 = domingo … 6 = sábado.
 *  ordem controla a exibição, com a semana começando na segunda. */
export type Horario = {
  diaSemana: number;
  abre: string | null;
  fecha: string | null;
  fechado: boolean;
  ordem: number;
};

export type Depoimento = {
  id: string;
  texto: string;
  autor: string;
  nota: number;
  ordem: number;
  ativo: boolean;
};

export type Conteudo = {
  heroTitulo: string;
  heroSubtitulo: string;
  telefone: string;
  endereco: string;
  cidadeUf: string;
  cep: string;
  whatsappUrl: string;
  instagram: string;
  campanhaAtiva: boolean;
  campanhaTitulo: string;
  /** Título da seção de depoimentos. Editável no painel — não deixar uma
   *  reprovação de marketing hardcoded no componente. */
  depoimentosTitulo: string;
  /** Título acima da lista de horários. Deve ser um texto que os próprios
   *  horários não possam contradizer (ex.: não citar um horário específico). */
  horariosTitulo: string;
};

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
  /** Rótulo escrito do evento ("Terça e quinta"). É copy, não dado: quem diz
   *  quais dias o evento cobre é `dias`. */
  diasLabel: string;
  /** Dias do evento, seguindo Date.getDay() como em `Horario.diaSemana`.
   *
   *  Existe desde 2026-09-10, quando o horário de funcionamento passou a
   *  morar dentro do card. O card precisa achar o horário dos seus dias, e
   *  interpretar `diasLabel` para isso quebraria calado no dia em que o
   *  painel deixar o dono escrever "Toda quarta" ou "Quartas e sextas".
   *  `horarioDosDias`, em `lib/horarios.ts`, é quem faz a tradução. */
  dias: number[];
  titulo: string;
  /** Continua no banco e no painel, mas a home parou de renderizá-la em
   *  2026-09-10: o card em forma de chama comporta título e horário, e um
   *  parágrafo não cabe na barriga. */
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
  /** Título único da seção de horários e programação, acima das duas colunas.
   *  Titulava só a lista de horários até 2026-09-10, quando o cliente pediu
   *  uma frase que conversasse com os dois conteúdos e convidasse a conhecer
   *  a casa; o segundo título, que era literal na JSX, saiu junto.
   *
   *  Duas amarras. Os próprios horários não podem contradizê-lo, então ele não
   *  cita horário específico. E ele é display: a Owners trial servida não
   *  desenha letra acentuada nenhuma, nem cedilha, então o texto tem que
   *  caber no alfabeto sem acento. `tests/unit/owners.test.ts` cobra as duas
   *  coisas, a segunda automaticamente, por vir do seed. */
  horariosTitulo: string;
};

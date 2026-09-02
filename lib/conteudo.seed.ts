import type {
  Categoria, ItemProgramacao, Horario, Depoimento, Conteudo,
} from "./conteudo.tipos";

export const categoriasSeed: Categoria[] = [
  { slug: "burgers", nome: "Burgers", kicker: "O mais pedido da casa",
    descricao: "Blend suculento selado na chapa, pão com a marca da casa e a nossa geleia de pimenta que vira assunto na mesa.",
    fotoPath: null, ordem: 1, ativo: true },
  { slug: "espetinhos", nome: "Espetinhos", kicker: "Combina com chopp gelado",
    descricao: "Cortes selecionados e grelhados, farofa artesanal e vinagrete fresquinho. Simples, generoso e perfeito com chopp.",
    fotoPath: null, ordem: 2, ativo: true },
  { slug: "carnes-nobres", nome: "Carnes Nobres", kicker: "Nossa porção premium",
    descricao: "Iscas de carne nobre na chapa, fritas douradas e molho de blue cheese cremoso. Porção farta servida na tábua.",
    fotoPath: null, ordem: 3, ativo: true },
  { slug: "petiscos", nome: "Petiscos", kicker: "Feito para compartilhar",
    descricao: "Porções fartas para dividir (ou não): carne na chapa, fritas douradas e acompanhamentos que ninguém deixa sobrar.",
    fotoPath: null, ordem: 4, ativo: true },
  { slug: "drinks", nome: "Drinks", kicker: "Autorais da casa",
    descricao: "Coquetelaria autoral com gin, frutas frescas e especiarias. Bonito de ver, difícil de tomar só um.",
    fotoPath: null, ordem: 5, ativo: true },
  { slug: "sobremesas", nome: "Sobremesas", kicker: "O final perfeito",
    descricao: "Petit gâteau com recheio quente escorrendo e sorvete cremoso. O final feliz que a sua noite merece.",
    fotoPath: null, ordem: 6, ativo: true },
];

export const programacaoSeed: ItemProgramacao[] = [
  { id: "espetinho", diasLabel: "Terça e quinta", titulo: "Noite do Espetinho",
    descricao: "Espetinhos saindo sem parar e chopp gelado para acompanhar até o fim da noite.",
    ordem: 1, ativo: true },
  { id: "burger", diasLabel: "Quarta", titulo: "Burger Preço Único",
    descricao: "Todos os burgers da casa por um preço único. Traga a turma e escolha o seu sem pensar duas vezes.",
    ordem: 2, ativo: true },
  { id: "dj", diasLabel: "Sexta e sábado", titulo: "DJ na Casa",
    descricao: "DJ comandando a pista, drinks autorais e cozinha aberta até tarde.",
    ordem: 3, ativo: true },
  { id: "orla", diasLabel: "Domingo", titulo: "Tarde na Orla",
    descricao: "Porções para dividir em família, pôr do sol na Av. Júlio Maria e chopp sempre gelado.",
    ordem: 4, ativo: true },
];

// diaSemana: 0=domingo … 6=sábado. ordem: semana começa na segunda.
export const horariosSeed: Horario[] = [
  { diaSemana: 1, abre: null,    fecha: null,    fechado: true,  ordem: 1 },
  { diaSemana: 2, abre: "14:00", fecha: "22:00", fechado: false, ordem: 2 },
  { diaSemana: 3, abre: "14:00", fecha: "22:00", fechado: false, ordem: 3 },
  { diaSemana: 4, abre: "14:00", fecha: "22:00", fechado: false, ordem: 4 },
  { diaSemana: 5, abre: "16:00", fecha: "03:00", fechado: false, ordem: 5 },
  { diaSemana: 6, abre: "16:00", fecha: "03:00", fechado: false, ordem: 6 },
  { diaSemana: 0, abre: "14:00", fecha: "22:00", fechado: false, ordem: 7 },
];

export const depoimentosSeed: Depoimento[] = [
  { id: "d1", nota: 5, autor: "Phellipe K.", ordem: 1, ativo: true,
    texto: "Lugar perfeito para fazer um lanche de qualidade! Experimentei o hambúrguer com geleia de pimenta — simplesmente maravilhoso." },
  { id: "d2", nota: 5, autor: "Roni L.", ordem: 2, ativo: true,
    texto: "Pratos excelentes, chopp gelado e ótimo atendimento. Voltarei com certeza." },
  { id: "d3", nota: 5, autor: "Cliente Google", ordem: 3, ativo: true,
    texto: "Ambiente acolhedor e música ao vivo. Viramos clientes da casa." },
];

export const conteudoSeed: Conteudo = {
  heroTitulo: "A fome acende aqui.",
  heroSubtitulo:
    "Bar com atrações musicais, chopp gelado, burguers, espetos e petiscos. Na Av. Júlio Maria, no Centro — onde a noite de Angra começa.",
  telefone: "(24) 3364-5253",
  endereco: "Av. Júlio Maria, 235 — Centro",
  cidadeUf: "Angra dos Reis, RJ",
  cep: "23900-504",
  whatsappUrl: "https://wa.me/552433645253",
  ifoodUrl: "https://www.ifood.com.br/",
  instagram: "@nbrasaangra",
  campanhaAtiva: false,
  campanhaTitulo: "",
  depoimentosTitulo: "4,2 estrelas e quase 300 avaliações",
  // Não cita um horário específico: os horários mudam por edição no painel e
  // este título não pode ficar contradizendo a lista logo abaixo dele.
  horariosTitulo: "A casa abre à tarde",
};

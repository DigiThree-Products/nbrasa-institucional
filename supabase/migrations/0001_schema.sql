-- Categorias do cardápio. `destaque` marca qual ocupa o tile grande do bento;
-- sem ela o destaque seria a posição 0 do array, e reordenar no painel moveria
-- a ênfase sem intenção.
create table public.categorias (
  slug        text primary key,
  nome        text not null,
  kicker      text not null,
  descricao   text not null,
  foto_path   text,
  ordem       integer not null,
  ativo       boolean not null default true,
  destaque    boolean not null default false,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index categorias_ordem_idx on public.categorias (ordem);

create table public.programacao (
  id          text primary key,
  dias_label  text not null,
  titulo      text not null,
  descricao   text not null,
  ordem       integer not null,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index programacao_ordem_idx on public.programacao (ordem);

-- dia_semana segue Date.getDay(): 0 = domingo … 6 = sábado.
-- ordem controla a exibição, com a semana começando na segunda.
-- abre/fecha em texto "HH:MM" para preservar o fechamento de madrugada
-- (sábado 16:00 -> 03:00), que um tipo `time` não representa como intervalo.
create table public.horarios (
  dia_semana  smallint primary key check (dia_semana between 0 and 6),
  abre        text check (abre ~ '^[0-2][0-9]:[0-5][0-9]$'),
  fecha       text check (fecha ~ '^[0-2][0-9]:[0-5][0-9]$'),
  fechado     boolean not null default false,
  ordem       integer not null unique,
  atualizado_em timestamptz not null default now(),
  -- um dia aberto precisa de ambos os horários; um dia fechado pode ter os dois
  -- preenchidos (o painel permite marcar fechado sem limpar as horas)
  constraint horario_aberto_completo
    check (fechado or (abre is not null and fecha is not null))
);

create table public.depoimentos (
  id          text primary key,
  texto       text not null,
  autor       text not null,
  nota        smallint not null check (nota between 1 and 5),
  ordem       integer not null,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index depoimentos_ordem_idx on public.depoimentos (ordem);

-- Linha única. `id` fixo em 1 com check garante que nunca exista uma segunda.
create table public.conteudo (
  id                 smallint primary key default 1 check (id = 1),
  hero_titulo        text not null,
  hero_subtitulo     text not null,
  telefone           text not null,
  endereco           text not null,
  cidade_uf          text not null,
  cep                text not null,
  whatsapp_url       text not null,
  instagram          text not null,
  campanha_ativa     boolean not null default false,
  campanha_titulo    text not null default '',
  depoimentos_titulo text not null,
  horarios_titulo    text not null,
  atualizado_em      timestamptz not null default now()
);

-- Mantém atualizado_em correto sem depender de a aplicação lembrar.
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger categorias_touch   before update on public.categorias
  for each row execute function public.tocar_atualizado_em();
create trigger programacao_touch  before update on public.programacao
  for each row execute function public.tocar_atualizado_em();
create trigger horarios_touch     before update on public.horarios
  for each row execute function public.tocar_atualizado_em();
create trigger depoimentos_touch  before update on public.depoimentos
  for each row execute function public.tocar_atualizado_em();
create trigger conteudo_touch     before update on public.conteudo
  for each row execute function public.tocar_atualizado_em();

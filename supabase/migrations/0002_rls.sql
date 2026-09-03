-- ---------------------------------------------------------------------------
-- CAMADA 1 — privilégios: revoga tudo e concede o mínimo.
-- Sem isto, anon herda grants padrão e só o RLS separa a internet do banco.
-- ---------------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- anon SÓ LÊ. Não recebe insert/update/delete: uma escrita anônima é barrada
-- no privilégio, antes mesmo de qualquer policy ser avaliada.
grant select on public.categorias, public.programacao, public.horarios,
                public.depoimentos, public.conteudo to anon;

-- authenticated pode tentar escrever; QUEM pode de fato é decidido pela policy.
grant select, insert, update, delete
  on public.categorias, public.programacao, public.horarios,
     public.depoimentos, public.conteudo to authenticated;

-- ---------------------------------------------------------------------------
-- CAMADA 2 — RLS ligado e forçado.
-- `force` faz as policies valerem também para o dono da tabela; sem ele, uma
-- conexão como owner ignora tudo. service_role continua passando (bypassrls),
-- que é o necessário para o seed.
-- ---------------------------------------------------------------------------
alter table public.categorias  enable row level security;
alter table public.programacao enable row level security;
alter table public.horarios    enable row level security;
alter table public.depoimentos enable row level security;
alter table public.conteudo    enable row level security;

alter table public.categorias  force row level security;
alter table public.programacao force row level security;
alter table public.horarios    force row level security;
alter table public.depoimentos force row level security;
alter table public.conteudo    force row level security;

-- ---------------------------------------------------------------------------
-- CAMADA 3 — a função de papel.
--
-- Lê de `app_metadata`, NUNCA de `user_metadata`: o segundo é editável pelo
-- próprio usuário pelo SDK do cliente, então usá-lo para papel seria escalada
-- de privilégio de uma linha. `app_metadata` só muda pelo lado servidor.
--
-- `search_path = ''` impede sequestro por objeto homônimo em outro schema;
-- por isso tudo aqui é qualificado.
-- ---------------------------------------------------------------------------
create or replace function public.e_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

revoke all on function public.e_admin() from public, anon;
grant execute on function public.e_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- POLICIES DE LEITURA — públicas, restritas a linhas ativas.
-- ---------------------------------------------------------------------------
create policy "leitura publica de categorias ativas"
  on public.categorias for select to anon, authenticated using (ativo);
create policy "leitura publica de programacao ativa"
  on public.programacao for select to anon, authenticated using (ativo);
create policy "leitura publica de depoimentos ativos"
  on public.depoimentos for select to anon, authenticated using (ativo);

-- horarios e conteudo não têm coluna `ativo`: as sete linhas de horário e a
-- linha única de conteúdo são públicas por inteiro.
create policy "leitura publica de horarios"
  on public.horarios for select to anon, authenticated using (true);
create policy "leitura publica de conteudo"
  on public.conteudo for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- POLICIES DE ESCRITA — apenas admin, e apenas para `authenticated`.
-- Separadas por operação em vez de `for all`, para que um erro numa não abra
-- as outras.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['categorias','programacao','horarios','depoimentos','conteudo']
  loop
    execute format(
      'create policy "admin insere em %1$s" on public.%1$I
         for insert to authenticated with check (public.e_admin())', t);
    execute format(
      'create policy "admin altera %1$s" on public.%1$I
         for update to authenticated using (public.e_admin()) with check (public.e_admin())', t);
    execute format(
      'create policy "admin apaga de %1$s" on public.%1$I
         for delete to authenticated using (public.e_admin())', t);
  end loop;
end $$;

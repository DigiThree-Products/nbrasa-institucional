-- Coluna `dias` na programacao, de 2026-09-10. A secao de horarios deixou de
-- ter lista propria: o horario de funcionamento passou a morar dentro do card
-- de cada evento, e o card precisa achar na tabela `horarios` os dias que ele
-- cobre.
--
-- O card ja tinha `dias_label`, mas aquilo e copy, nao dado. Ler os dias
-- interpretando o texto quebraria calado no dia em que o painel deixar o dono
-- escrever "Toda quarta" ou "Quartas e sextas": o card simplesmente ficaria
-- sem horario e ninguem seria avisado. Com a coluna, a copy e os dias mudam
-- separados e de proposito.
--
-- `dias` segue Date.getDay() (0=domingo … 6=sabado), igual a
-- horarios.dia_semana, e nao a coluna `ordem`. Cuidado ao preencher: o
-- rotulo "Terça e quinta" sao os dias 2 e 4, e nao a faixa de 2 a 4.
--
-- Esta migration existe porque 0003_seed.sql e um INSERT sem `on conflict`:
-- reaplica-lo num banco ja semeado quebra por chave duplicada. O 0001 e o
-- 0003 tambem foram atualizados, para que uma instalacao nova ja nasca com a
-- coluna preenchida e continue batendo com lib/conteudo.seed.ts; esta aqui e
-- o que leva a mudanca aos bancos que ja rodaram o seed.
--
-- Reentrante nas duas metades: `add column if not exists` e UPDATE por id.
-- O default '{}' e o que deixa o ALTER passar numa tabela ja populada.

alter table public.programacao
  add column if not exists dias smallint[] not null default '{}';

update public.programacao set dias = '{2,4}', atualizado_em = now() where id = 'espetinho';
update public.programacao set dias = '{3}',   atualizado_em = now() where id = 'burger';
update public.programacao set dias = '{5,6}', atualizado_em = now() where id = 'dj';
update public.programacao set dias = '{0}',   atualizado_em = now() where id = 'orla';

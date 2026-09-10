-- Titulo unico para a secao de horarios e programacao, pedido pelo cliente em
-- 2026-09-10. A secao abria com dois titulos lado a lado, "A casa abre de
-- tarde" (este campo) e "Tem motivo pra vir todo dia" (literal na JSX), e eles
-- competiam entre si. Agora e um titulo so, acima das duas colunas, e o
-- literal saiu do componente junto com as duas linhas dele em
-- tests/unit/owners.test.ts.
--
-- Esta migration existe porque 0003_seed.sql e um INSERT sem `on conflict`:
-- reaplica-lo num banco ja semeado quebra por chave duplicada. Aquele arquivo
-- tambem foi atualizado, para que uma instalacao nova ja nasca com este texto
-- e continue batendo caractere por caractere com lib/conteudo.seed.ts; esta
-- aqui e o que leva a mudanca aos bancos que ja rodaram o seed.
--
-- Sem acento e sem cedilha de proposito: o titulo e display, e a Owners trial
-- servida nao desenha letra acentuada nenhuma. tests/unit/owners.test.ts le o
-- cmap do OTF e falha se este texto pedir um glifo que ela nao tem.
--
-- Reentrante: e um UPDATE por id, pode rodar quantas vezes for.

update public.conteudo
set horarios_titulo = 'A semana inteira pede brasa',
    atualizado_em = now()
where id = 1;

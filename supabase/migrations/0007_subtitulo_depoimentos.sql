-- Subtitulo da secao de avaliacoes, escolhido pelo cliente em 2026-09-10.
--
-- O campo depoimentos_titulo era o titulo da secao ("Nota 4,2 de quase 300
-- clientes") e o cliente tirou aquele texto da tela. Quem titula agora e o
-- literal "Quem veio, volta", que subiu de linha de apoio, e este campo
-- passou a carregar a frase que apresenta os cards. O nome da coluna ficou,
-- porque renomear coluna por mudanca de papel na tela custa migration de
-- schema e nao paga.
--
-- A frase leva acento de proposito, e isso so e seguro porque ela virou
-- fonte de corpo: como display, a Owners trial servida nao desenharia
-- "musica" nem "ja". Por isso o campo saiu de textosDoSeed() em
-- tests/unit/owners.test.ts na mesma leva.
--
-- Esta migration existe porque 0003_seed.sql e um INSERT sem `on conflict`:
-- reaplica-lo num banco ja semeado quebra por chave duplicada. Aquele arquivo
-- tambem foi atualizado, para que uma instalacao nova ja nasca com este texto
-- e continue batendo caractere por caractere com lib/conteudo.seed.ts; esta
-- aqui e o que leva a mudanca aos bancos que ja rodaram o seed.
--
-- Reentrante: e um UPDATE por id, pode rodar quantas vezes for.

update public.conteudo
set depoimentos_titulo = 'Ambiente acolhedor, chopp gelado e música ao vivo. Palavra de quem já sentou aqui.',
    atualizado_em = now()
where id = 1;

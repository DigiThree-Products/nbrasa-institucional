-- Alinha o conteudo do banco com a copy que cabe no charset da Owners.
--
-- A Owners TRIAL que o site serve tem 73 glifos e nenhuma letra acentuada.
-- Um titulo de display com acento nao some: renderiza metade em Owners e
-- metade na fonte de fallback, no meio da palavra. Ver
-- tests/unit/owners.test.ts e a spec de 2026-09-04.
--
-- Estes tres campos chegam a elementos com font-display e traziam acento:
--
--   conteudo.depoimentos_titulo   "avaliacoes"  ->  C cedilha e O til
--   conteudo.horarios_titulo      "a tarde"     ->  A crase
--   programacao.titulo (burger)   "Preco Unico" ->  C cedilha e U agudo
--
-- 0003_seed.sql ja foi corrigido e continua batendo caractere por caractere
-- com lib/conteudo.seed.ts, mas ele e um insert puro: nao da para reaplicar
-- num banco que ja tem as linhas. Dai esta migration, feita de updates, que
-- e naturalmente reentrante e pode rodar quantas vezes for preciso.
--
-- Depois de aplicar, `npm run test:integracao` deve ficar verde.

update public.conteudo
   set depoimentos_titulo = 'Nota 4,2 de quase 300 clientes',
       horarios_titulo    = 'A casa abre de tarde'
 where id = 1;

update public.programacao
   set titulo = 'Noite do Burger'
 where id = 'burger';

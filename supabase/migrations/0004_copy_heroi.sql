-- Nova copy do heroi, definida pelo cliente em 2026-09-04.
--
-- Existe porque 0003_seed.sql e um INSERT sem `on conflict`: reaplica-lo num
-- banco ja semeado quebra por chave duplicada. Aquele arquivo tambem foi
-- atualizado, para que uma instalacao nova ja nasca com este texto e continue
-- batendo caractere por caractere com lib/conteudo.seed.ts; esta migration e
-- o que leva a mudanca aos bancos que ja rodaram o seed.
--
-- Sem travessao no subtitulo, a pedido do cliente: onde havia um em dash
-- ('no Centro — onde a noite') agora ha virgula.
--
-- Reentrante: um UPDATE por id pode rodar quantas vezes for.
update public.conteudo
set hero_titulo = 'Sua fome acende aqui.',
    hero_subtitulo = 'Porção farta pra dividir, chopp sempre gelado e música ao vivo pra ninguém querer ir embora. Av. Júlio Maria, no Centro, onde a noite de Angra começa.',
    atualizado_em = now()
where id = 1;

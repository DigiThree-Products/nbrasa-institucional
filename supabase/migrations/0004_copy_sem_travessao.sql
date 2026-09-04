-- Nova copy do heroi e remocao do travessao de todo o conteudo, definidas
-- pelo cliente em 2026-09-04. A regra e absoluta: travessao nao entra em
-- texto nenhum do site.
--
-- Esta migration existe porque 0003_seed.sql e um INSERT sem `on conflict`:
-- reaplica-lo num banco ja semeado quebra por chave duplicada. Aquele arquivo
-- tambem foi atualizado, para que uma instalacao nova ja nasca com estes
-- textos e continue batendo caractere por caractere com lib/conteudo.seed.ts;
-- esta aqui e o que leva a mudanca aos bancos que ja rodaram o seed.
--
-- O separador de horario nao aparece aqui porque nao e dado: o travessao
-- ficava entre `abre` e `fecha`, montado em lib/horarios.ts, e virou 'as' la.
--
-- Reentrante: sao UPDATEs por id, podem rodar quantas vezes for.

update public.conteudo
set hero_titulo = 'Sua fome acende aqui.',
    hero_subtitulo = 'Porção farta pra dividir, chopp sempre gelado e música ao vivo pra ninguém querer ir embora. Av. Júlio Maria, no Centro, onde a noite de Angra começa.',
    -- o bairro vinha separado por travessao
    endereco = 'Av. Júlio Maria, 235, Centro',
    atualizado_em = now()
where id = 1;

-- Depoimento real de cliente: so a pontuacao muda, o texto continua o mesmo.
update public.depoimentos
set texto = 'Lugar perfeito para fazer um lanche de qualidade! Experimentei o hambúrguer com geleia de pimenta, simplesmente maravilhoso.',
    atualizado_em = now()
where id = 'd1';

-- Inativo, nao aparece no site; atualizado so para o banco nao ficar
-- divergente do seed.
update public.depoimentos
set texto = 'Registro de antes da reforma da casa, mantido desativado, não deve aparecer no site.',
    atualizado_em = now()
where id = 'd4';

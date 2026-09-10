-- As fotos dos pratos nos cards do Cardapio (2026-09-10).
--
-- O card do Cardapio deixou de ser creme chapado e passou a ser fotografia
-- sangrando nos quatro lados, com um veu de carvao na base sustentando o
-- texto. Esta migration so preenche `foto_path` nas seis categorias ativas.
--
-- Por que uma migration de UPDATE, e nao editar o seed: `0003_seed.sql` e um
-- insert puro, sem `on conflict`, e reaplica-lo num banco ja semeado quebra
-- por chave duplicada. Entao toda mudanca de conteudo anda em duas pontas. O
-- texto novo entra no 0003, para uma instalacao nova ja nascer certa e
-- continuar batendo com lib/conteudo.seed.ts, e uma migration nova de UPDATE
-- por id leva a mudanca aos bancos que ja rodaram o seed. As duas 0004 e a
-- 0005 sao exatamente isto.
--
-- Reentrante: sao UPDATEs por slug, rodar duas vezes grava o mesmo valor.
--
-- O valor NAO e uma URL de arquivo, e o CAMINHO BASE dos derivados que
-- `python scripts/gerar-pratos.py` grava em public/. O componente completa com
-- a largura e o formato, por exemplo `/prato-burgers` vira
-- `/prato-burgers-640.avif`. Ha teste unitario que falha se um derivado citado
-- pelo card nao existir em public/.
--
-- A categoria inativa 'chopp' continua com foto_path nulo de proposito: ela e
-- a fixture do caminho sem foto, que o card ainda sabe desenhar.

update public.categorias set foto_path = '/prato-burgers'       where slug = 'burgers';
update public.categorias set foto_path = '/prato-espetinhos'    where slug = 'espetinhos';
update public.categorias set foto_path = '/prato-carnes-nobres' where slug = 'carnes-nobres';
update public.categorias set foto_path = '/prato-petiscos'      where slug = 'petiscos';
update public.categorias set foto_path = '/prato-drinks'        where slug = 'drinks';
update public.categorias set foto_path = '/prato-sobremesas'    where slug = 'sobremesas';

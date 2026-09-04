-- Seed do conteudo real do N'Brasa.
--
-- Gerado a partir de lib/conteudo.seed.ts, que continua sendo a fonte de
-- verdade e a fixture dos testes unitarios. Os textos batem caractere por
-- caractere com aquele arquivo — inclusive o travessao em
-- 'Av. Julio Maria, 235 — Centro', que e em dash (—), nao hifen.
--
-- Inclui de proposito as linhas INATIVAS (categoria 'chopp', depoimento 'd4'):
-- elas provam que o filtro de ativo funciona e servem de fixture do painel.
insert into public.categorias (slug, nome, kicker, descricao, foto_path, ordem, ativo, destaque) values
  ('burgers', 'Burgers', 'O mais pedido da casa', 'Blend suculento selado na chapa, pão com a marca da casa e a nossa geleia de pimenta que vira assunto na mesa.', null, 1, true, true),
  ('espetinhos', 'Espetinhos', 'Combina com chopp gelado', 'Cortes selecionados e grelhados, farofa artesanal e vinagrete fresquinho. Simples, generoso e perfeito com chopp.', null, 2, true, false),
  ('carnes-nobres', 'Carnes Nobres', 'Nossa porção premium', 'Iscas de carne nobre na chapa, fritas douradas e molho de blue cheese cremoso. Porção farta servida na tábua.', null, 3, true, false),
  ('petiscos', 'Petiscos', 'Feito para compartilhar', 'Porções fartas para dividir (ou não): carne na chapa, fritas douradas e acompanhamentos que ninguém deixa sobrar.', null, 4, true, false),
  ('drinks', 'Drinks', 'Autorais da casa', 'Coquetelaria autoral com gin, frutas frescas e especiarias. Bonito de ver, difícil de tomar só um.', null, 5, true, false),
  ('sobremesas', 'Sobremesas', 'O final perfeito', 'Petit gâteau com recheio quente escorrendo e sorvete cremoso. O final feliz que a sua noite merece.', null, 6, true, false),
  ('chopp', 'Chopp', 'Descontinuada nesta versão', 'Categoria do mockup inicial, substituída por Carnes Nobres e Sobremesas na versão final do spec.', null, 7, false, false);

insert into public.programacao (id, dias_label, titulo, descricao, ordem, ativo) values
  ('espetinho', 'Terça e quinta', 'Noite do Espetinho', 'Espetinhos saindo sem parar e chopp gelado para acompanhar até o fim da noite.', 1, true),
  ('burger', 'Quarta', 'Burger Preço Único', 'Todos os burgers da casa por um preço único. Traga a turma e escolha o seu sem pensar duas vezes.', 2, true),
  ('dj', 'Sexta e sábado', 'DJ na Casa', 'DJ comandando a pista, drinks autorais e cozinha aberta até tarde.', 3, true),
  ('orla', 'Domingo', 'Tarde na Orla', 'Porções para dividir em família, pôr do sol na Av. Júlio Maria e chopp sempre gelado.', 4, true);

-- dia_semana segue Date.getDay(): 0 = domingo … 6 = sabado.
-- ordem exibe a semana comecando na segunda, por isso domingo leva ordem 7.
insert into public.horarios (dia_semana, abre, fecha, fechado, ordem) values
  (0, '14:00', '22:00', false, 7),
  (1, null, null, true, 1),
  (2, '14:00', '22:00', false, 2),
  (3, '14:00', '22:00', false, 3),
  (4, '14:00', '22:00', false, 4),
  (5, '16:00', '03:00', false, 5),
  (6, '16:00', '03:00', false, 6);

insert into public.depoimentos (id, texto, autor, nota, ordem, ativo) values
  ('d1', 'Lugar perfeito para fazer um lanche de qualidade! Experimentei o hambúrguer com geleia de pimenta — simplesmente maravilhoso.', 'Phellipe K.', 5, 1, true),
  ('d2', 'Pratos excelentes, chopp gelado e ótimo atendimento. Voltarei com certeza.', 'Roni L.', 5, 2, true),
  ('d3', 'Ambiente acolhedor e música ao vivo. Viramos clientes da casa.', 'Cliente Google', 5, 3, true),
  ('d4', 'Registro de antes da reforma da casa, mantido desativado — não deve aparecer no site.', 'Depoimento antigo', 2, 4, false);

-- Linha unica: id fixo em 1, garantido pelo check da tabela.
insert into public.conteudo (id, hero_titulo, hero_subtitulo, telefone, endereco, cidade_uf, cep, whatsapp_url, instagram, campanha_ativa, campanha_titulo, depoimentos_titulo, horarios_titulo) values
  (1, 'Sua fome acende aqui.', 'Porção farta pra dividir, chopp sempre gelado e música ao vivo pra ninguém querer ir embora. Av. Júlio Maria, no Centro, onde a noite de Angra começa.', '(24) 3364-5253', 'Av. Júlio Maria, 235 — Centro', 'Angra dos Reis, RJ', '23900-504', 'https://wa.me/552433645253', '@nbrasaangra', false, '', '4,2 estrelas e quase 300 avaliações', 'A casa abre à tarde');

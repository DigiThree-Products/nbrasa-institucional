# Site N'Brasa Angra — documento de design

**Data:** 2026-09-02
**Status:** aprovado seção a seção; aguardando revisão final do spec
**Repositório:** https://github.com/nbrasasite/institucional

---

## 1. Contexto e objetivo

O N'Brasa é um bar, choperia e casa de carnes na Av. Júlio Maria, 235, Centro, Angra
dos Reis (RJ). Existe hoje um site gerado no Lovable
(`nbrasa-site-maker.lovable.app`) que será **recriado**, não migrado.

O objetivo desta v1 é entregar o site institucional com um painel de administração
onde o dono e a agência editam o conteúdo sem tocar em código.

Três características do negócio determinam as decisões técnicas deste documento:

- **Não há lógica de aplicação no site público.** Nenhum carrinho, login de cliente
  ou banco consultado pelo visitante. Todos os CTAs saem para WhatsApp e iFood.
- **O conteúdo muda pouco.** Cardápio e programação mudam esporadicamente; endereço,
  telefone e horário ficam parados por meses.
- **O tráfego é mobile e vem de busca local.** Pessoas procurando "n'brasa angra" no
  celular, muitas vezes em 4G instável, querendo horário, endereço e programação.

## 2. Escopo

### Dentro da v1

- Site institucional público, página única, com todas as seções do inventário (§7).
- Painel de admin com login, editando cardápio, programação, horários, depoimentos e
  os dados de contato.
- Migrations SQL versionadas criando todo o schema.
- Deploy na Vercel a partir do repositório acima.

### Fora da v1, mas previsto na arquitetura

- **Página de campanha** (`/campanha`). A rota fica reservada e o botão no header
  nasce controlado por `conteudo.campanha_ativa`; enquanto desligado, o botão não
  renderiza. Não haverá código morto no ar.
- **Pedido online próprio** com carrinho e pagamento. É o motivo de a stack ser
  Next.js e não um gerador estático: pagamento exige segredo no servidor.
- Vídeos nas seções — o Storage e as regras de `<video>` já ficam definidos aqui.

### Explicitamente não construído

Editor de texto rico, versionamento de conteúdo, rascunho e agendamento de
publicação, gestão de múltiplos usuários e qualquer estrutura de itens ou preço
dentro do cardápio. Nada disso foi pedido e cada um é superfície extra para falhar.

## 3. Stack e justificativa

| Camada | Escolha |
|---|---|
| Framework | Next.js 15, App Router |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 |
| Dados, auth e mídia | Supabase (Postgres + Auth + Storage), região South America (São Paulo) |
| Scroll suave | Lenis |
| Animação | GSAP + ScrollTrigger + MotionPathPlugin |
| Hospedagem | Vercel |

**Por que Next.js.** O fator decisivo é o pedido online no roadmap: chave secreta e
webhook de pagamento precisam rodar no servidor, e Route Handlers resolvem isso no
mesmo projeto. Some-se o painel de admin, que exige rotas protegidas e escrita
autenticada. Astro foi considerado e descartado — exigiria um backend separado.

**Por que não React puro com Vite.** É SPA: o pior SEO das opções, para um negócio
que vive de busca local.

**A regra que mantém o site leve.** Tudo é Server Component por padrão. Apenas
cinco componentes são cliente: o provider do Lenis, o menu mobile, o `<Reveal>`, a
`<RotaMascote>` e o `<Preloader>` de §8. Cardápio, horários, programação, depoimentos, contato e rodapé
chegam ao navegador como HTML puro, com zero JavaScript. Se essa fronteira vazar, o
site engorda — por isso ela é medida (§8).

## 4. Direção visual

Hierarquia definida pelo cliente: **o manual de marca tem prioridade sobre as
referências**. As referências entram como linguagem de layout e de movimento, nunca
sobrescrevendo cor ou tipografia.

- **Referência de estrutura:** "FreshBox — Food Delivery & Restaurant Website"
  (Behance). Dela vêm a escala tipográfica display, o grid bento assimétrico, a
  fileira de categorias em chips e os raios generosos.
- **Referência de movimento:** `cravburgers.shop`. Dela vêm o preloader de marca, as
  divisórias curvas, os reveals de scroll e o componente de rota (§7.3).

### Paleta

| Token | Hex | Uso |
|---|---|---|
| `--carvao` | `#241e1f` | fundo padrão |
| `--brasa` | `#cf2434` | preenchimento, botões, rota, display grande |
| `--branco` | `#ffffff` | texto principal |
| `--brasa-texto` | `#e8505f` | **texto pequeno vermelho sobre fundo escuro** |
| `--fumaca` | `#2f2728` | superfície elevada |
| `--cinza` | `#a39596` | texto secundário |
| `--creme` | `#f0e6dc` | faixa clara de respiro |

Os três primeiros vêm do manual. Os demais são derivados; o `--brasa-texto` existe
por uma razão de acessibilidade documentada em §9.

### Tipografia

- **Hanken Grotesk** — corpo e interface. É a fonte de apoio do manual e está no
  Google Fonts.
- **Owners** — display, conforme o manual. **Pendência aberta:** é comercial da
  Latinotype e exige licença de webfont. Até a decisão, o display usa **Anton** como
  substituta, carregada por `next/font`.
- O wordmark `n'Brasa` é reproduzido em fonte script no mockup; no site final deve
  ser o **logo vetorial oficial**, exportado de `apresentação site/mascote.cdr`.

### Copy da marca

Assinatura: **"O sabor que encontra, o som."** Slogans aprovados e reutilizáveis:
`vamos N'brasar?`, `feel the fire`, `VAI N'BRASANDO`, `A fome acende aqui.`,
`Vem sentir a vida acontecer de gole em gole.`,
`Tem decisões que ficam melhores com o copo cheio.`

O verbo "N'brasar" é central: manter apóstrofo e grafia exatos em qualquer texto novo.

## 5. Arquitetura

Três camadas, cada uma com uma responsabilidade:

| Camada | Rota | Renderização |
|---|---|---|
| Site público | `/` | Server Components, dados lidos em build e revalidação (ISR) |
| Painel | `/admin/*` | Protegido por Auth; escrita por Server Actions |
| API interna | Route Handlers | Apenas o que exige segredo |

**Fluxo de dados.** Admin salva → Server Action grava no Supabase → `revalidateTag`
invalida a seção afetada → a home reconstrói em segundos. O visitante sempre recebe
HTML estático de CDN; nada é buscado no cliente.

**Camada de acesso a dados.** Todo acesso ao Supabase passa por um módulo único,
`lib/conteudo.ts`, com funções tipadas (`getCategorias`, `getHorarios`,
`getProgramacao`, `getDepoimentos`, `getConteudo`). Nenhuma seção da página fala com
o banco diretamente. Isso permite construir e validar o site inteiro contra dados
semeados antes do Supabase estar ligado — trocar a implementação é alterar um arquivo.

## 6. Modelo de dados

Cinco tabelas. Nomes de coluna em português, coerentes com o conteúdo.

| Tabela | Colunas principais | Linhas |
|---|---|---|
| `categorias` | `id`, `slug`, `nome`, `kicker`, `descricao`, `foto_path`, `ordem`, `ativo` | 6 |
| `programacao` | `id`, `dias_label`, `titulo`, `descricao`, `ordem`, `ativo` | ~4 |
| `horarios` | `id`, `dia_semana` (0–6), `abre`, `fecha`, `fechado`, `ordem` | 7 |
| `depoimentos` | `id`, `texto`, `autor`, `nota`, `ordem`, `ativo` | ~3 |
| `conteudo` | linha única: copy do herói, telefone, endereço, CEP, links de WhatsApp e iFood, `instagram`, `campanha_ativa`, `campanha_titulo` | 1 |

**Por que banco e não arquivo.** Para este volume, um arquivo JSON seria mais simples.
O que justifica o Postgres é o painel: o dono precisa editar sem abrir código, e isso
exige escrita autenticada em runtime.

**Por que `conteudo` é linha única.** Telefone, endereço e links de pedido aparecem em
vários pontos da página e do rodapé. Centralizados, trocar o WhatsApp é uma edição.

**Permissões (RLS ligado em todas as tabelas).** Leitura pública apenas de linhas com
`ativo = true`. Escrita apenas para usuário autenticado com papel `admin`.

**Autenticação.** Link mágico por e-mail, dois usuários (agência e dono). Escolhido
para não haver senha a esquecer e para que nenhuma credencial em texto passe por
conversa ou código. Reversível para senha se necessário.

**Mídia.** Bucket `midia` no Storage, leitura pública, upload apenas por admin, com
limite de tamanho por arquivo e whitelist de tipo (imagem e vídeo).

**Seed inicial.** As migrations semeiam o conteúdo real já levantado:

- Endereço: Av. Júlio Maria, 235 — Centro, Angra dos Reis, RJ, 23900-504
- Telefone: (24) 3364-5253 · Instagram: @nbrasaangra
- Horários: segunda fechado; terça a quinta e domingo 14h–22h; sexta e sábado 16h–03h
- Categorias: Burgers, Espetinhos, Carnes Nobres, Petiscos, Drinks, Sobremesas
- Programação: Ter/Qui "Noite do Espetinho"; Qua "Burger Preço Único";
  Sex/Sáb "DJ na Casa"; Dom "Tarde na Orla"

> **Nota de divergência.** Os horários vêm da bio do Instagram, confirmados pelo
> cliente em 2026-09-02. O folder impresso traz horários diferentes (16h–00h /
> 16h–02h30 / 16h–00h) e está **desatualizado** — não usar como fonte.

## 7. Páginas, seções e componentes

### 7.1 Rotas

| Rota | Descrição |
|---|---|
| `/` | Home com todas as seções |
| `/admin` | Login e índice do painel |
| `/admin/cardapio`, `/programacao`, `/horarios`, `/depoimentos`, `/ajustes` | Uma tela por bloco |
| `/campanha` | **Não criada na v1.** O nome fica reservado e o botão do header permanece oculto até `conteudo.campanha_ativa` ser ligado. Nenhum arquivo de rota é criado agora. |

### 7.2 Inventário da home, em ordem

1. Header fixo — logo, navegação, botão CAMPANHA condicional
2. Herói — display grande, dois CTAs, foto da fachada, faixa de horário resumido
3. Chips das 6 categorias — selos circulares de chama, **não fotográficos** (§10)
4. Cardápio — grid bento assimétrico, 6 cards
5. **Rota do mascote / Delivery** (§7.3)
6. Divisória curva ("jelly")
7. Horários e programação — faixa creme
8. Depoimentos
9. Onde estamos — mapa e contato
10. Rodapé

### 7.3 Componente de assinatura: rota do mascote

Adaptação do componente de avião do Crav Burgers, cuja mecânica foi verificada
diretamente no DOM da referência.

**Conceito.** O mascote chama da marca — que já existe em vetor, com óculos escuros —
percorre uma rota de entrega por Angra dos Reis: Centro, Praia do Anil, Japuíba,
Praia Grande, Mambucaba. O slogan `VAI N'BRASANDO` titula a seção e é ilustrado ao
pé da letra pelo movimento.

**Mecânica.**

- Seção alta cria a distância de scroll necessária.
- Um `<path>` SVG define a rota, desenhado com `stroke: #cf2434` e `stroke-dasharray`
  para a linha pontilhada.
- O mascote é movido pelo **GSAP MotionPathPlugin** ao longo desse mesmo path, com
  `autoRotate` — ele inclina para acompanhar a tangente, que é o que faz o movimento
  parecer trajeto e não deslize.
- Um ScrollTrigger com `scrub` amarra o progresso à rolagem; a linha se desenha junto.
- GSAP entra por `next/dynamic` com `ssr: false`, carregado ao aproximar da seção.

**Responsividade.** Um único componente, adaptado por breakpoint: rota mais curta e
três paradas no mobile em vez de cinco. A referência duplica a seção em versões
desktop e mobile; **não replicamos isso** — duplicar markup dobra a manutenção e
envia HTML morto para os dois lados.

**Custo.** O MotionPath anima um único elemento por transform; o SVG da rota é
estático. É barato e não ameaça o orçamento de peso.

### 7.4 Fronteira cliente/servidor

Componentes cliente, e apenas estes: `<SmoothScrollProvider>` (Lenis),
`<MenuMobile>`, `<Reveal>`, `<RotaMascote>` e `<Preloader>`. Todo o restante é
Server Component.

## 8. Movimento e performance

**Lenis.** Instância única no layout raiz: `duration: 1.15`, `smoothWheel: true`,
`anchors: true`. Integração com ScrollTrigger pelo padrão oficial da documentação:
`lenis.on('scroll', ScrollTrigger.update)`, `raf` amarrado ao `gsap.ticker` e
`gsap.ticker.lagSmoothing(0)`. O CSS do Lenis é obrigatório e vai embutido.

**Reveals.** Todo `<Reveal>` usa `fromTo` com `immediateRender: false`. Sem isso o
ScrollTrigger estaciona o elemento em `opacity: 0` no carregamento, e qualquer coisa
acima da dobra aparece em branco no primeiro quadro. Com a flag, o conteúdo nasce
visível e anima apenas ao entrar na tela.

**Preloader.** Painel de marca montando a chama, inspirado no Crav — mas com limites.
O preloader da referência foi cronometrado em **cerca de 45 segundos**, o que é
inaceitável. O nosso: teto de **1,2 s**, some assim que a página estiver pronta,
pulável ao primeiro toque ou scroll, exibido apenas na primeira visita da sessão
(`sessionStorage`), e nunca no caminho do LCP.

**Orçamento de peso.**

| Métrica | Meta |
|---|---|
| JS de primeira carga na home | ≤ 130 KB gzip, com o GSAP fora desse total |
| LCP em 4G simulado | ≤ 2,0 s |
| CLS | < 0,05 |
| Lighthouse mobile (Performance) | ≥ 90 |

**Imagens e vídeo.** `next/image` com AVIF e WebP, `sizes` correto e `priority`
apenas na foto do herói. Vídeo com `poster` e `preload="none"`; se houver autoplay
algum dia, será `muted` + `playsinline` e apenas acima de um breakpoint.

**Fontes.** Via `next/font`, que auto-hospeda e elimina salto de layout.

**Movimento reduzido.** O Lenis respeita `prefers-reduced-motion` nativamente
(força `lerp: 1`). Somamos: `scrub` desligado, mascote parado ao fim da rota e todas
as paradas visíveis simultaneamente. Nenhum conteúdo depende de animação para existir.

## 9. Erro, acessibilidade e testes

### Erro

**Uma queda do Supabase não derruba o site.** O conteúdo é lido em build e
revalidação, não no navegador do visitante. Com o Supabase fora do ar, a CDN segue
servindo o último HTML bom; uma revalidação que falha apenas mantém a versão
anterior. Quem sente a queda é o painel, não quem procura o telefone do bar.

**No painel:** mensagens de erro em linguagem útil, formulário que **não perde o que
foi digitado** em caso de falha, e um `error.tsx` por rota para que uma falha não
derrube a tela inteira.

### Acessibilidade

**Contraste — decisão registrada.** O vermelho `#cf2434` sobre o carvão `#241e1f` dá
razão de contraste de **3,1:1**. Isso atende texto grande (mínimo 3:1) e **reprova
texto normal** (mínimo 4,5:1). Portanto: `#cf2434` fica restrito a preenchimentos,
botões, a rota e o display grande. Texto pequeno vermelho sobre fundo escuro usa
`--brasa-texto: #e8505f`, que atinge **4,5:1**. Sobre a faixa creme, o `#cf2434`
original passa com folga. A variante deve ser confirmada com o responsável pela marca.

Demais requisitos: marcos semânticos e um único `h1`; foco visível em tudo navegável;
link de pular para o conteúdo; menu mobile com foco preso e fechamento no `Esc`;
`alt` real nas imagens de conteúdo e `alt=""` nas decorativas; rótulos associados aos
campos do painel.

### Testes

- Playwright capturando a home em **320, 768, 1024, 1440 e 1920 px**, mais uma
  passada com `prefers-reduced-motion` ativo.
- Teste funcional: `/admin` barra visitante anônimo.
- Teste funcional: editar uma categoria altera o que a home exibe.
- Teste de segurança: a chave anônima **não consegue escrever** em nenhuma tabela.
  RLS é a única barreira entre o painel e a internet e merece verificação explícita.
- Testes unitários nas funções de `lib/conteudo.ts`.
- Lighthouse sobre a build de produção, conferindo o orçamento de §8.

**Não será testado:** cobertura exaustiva de componentes de apresentação. Para um
site institucional deste porte, custa mais do que protege.

## 10. Pendências abertas

1. **Licença da fonte Owners.** Comercial (Latinotype). Enquanto não decidida, o
   display usa Anton. Alternativas: comprar a licença web; usar Owners apenas nas
   peças gráficas e Hanken Grotesk no site; ou escolher outra display. **Decisão do
   cliente.**
2. **Fotografia limpa.** O folder tem copy sobreposta na fotografia, então não é
   possível extrair fotos limpas dele. O mockup usa o que foi extraível, com
   artefatos visíveis. O site final precisa dos arquivos originais das fotos ou de um
   ensaio novo. Por isso os chips de categoria são selos de chama, e não fotos — o
   que também é mais fiel à cartela de adesivos do manual.
3. **Logo vetorial oficial** para substituir a reprodução em fonte script do mockup.
4. **Confirmar `--brasa-texto`** com o responsável pela marca.
5. **Categorias do cardápio:** o spec adota as 6 do site atual (Burgers, Espetinhos,
   Carnes Nobres, Petiscos, Drinks, Sobremesas). O mockup exibiu um conjunto
   ligeiramente diferente (Porções e Chopp no lugar de Carnes Nobres e Sobremesas).
   As do spec prevalecem.

## 11. Sequenciamento

1. Scaffold do projeto Next.js, Tailwind e tokens da marca.
2. Site público completo contra dados semeados, sem Supabase.
3. **Validação do cliente no preview local.**
4. Migrations, RLS e ligação do `lib/conteudo.ts` ao Supabase.
5. Painel de admin.
6. Testes, Lighthouse e ajustes de orçamento.
7. Push para `nbrasasite/institucional` e deploy na Vercel.

O passo 3 é um portão: **não haverá `git push` antes da validação local do cliente.**
Commits locais acontecem normalmente ao longo do caminho.

## Referências

- Site atual a ser recriado: `nbrasa-site-maker.lovable.app`
- Estrutura: `behance.net/gallery/251801463/Food-Delivery-Restaurant-Website`
- Movimento: `cravburgers.shop`
- Lenis: `github.com/darkroomengineering/lenis`
- Manual de marca, folder e fotografia: pasta `apresentação site/`, fora do controle de versão

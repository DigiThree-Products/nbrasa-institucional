# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

Site institucional do **N'Brasa**: bar, choperia e casa de carnes em Angra dos
Reis (RJ). Next.js 15 (App Router) + TypeScript + Tailwind v4, dados no
Supabase, deploy na Vercel. Uma única rota pública (`/`), toda ela Server
Components; o painel de admin (`/admin/*`) está previsto mas ainda não existe.

Documento de design completo (paleta, modelo de dados, orçamento de
performance, critérios de acessibilidade):
`docs/superpowers/specs/2026-09-02-site-nbrasa-design.md`, com a virada de
identidade de dois dias depois em
`docs/superpowers/specs/2026-09-04-identidade-visual-design.md` (página clara,
Delivery em brasa, saída da Anton). Pendências abertas
com o cliente: seção final do `README.md`. `docs/labaredas-do-heroi.md` é
**histórico**: descreve o sistema que desenhava as chamas em SVG sobre a
Owners, aposentado em 2026-09-09 quando o foco passou para a Combust, que já
traz a chama no glifo. `docs/handoff-espiral-do-cardapio.md` é **transitório**:
foi escrito para retomar a branch `espiral-no-cardapio` em outra máquina, cita
commits e contagens que envelhecem sozinhos, e some quando a branch entrar em
`main`. Não tire fato de lá sem conferir no código.
`docs/handoff-queima-das-avaliacoes.md` é da mesma espécie, para a branch
`fundo-quem-veio-volta`, e vale a mesma ressalva.

**Idioma do código:** tudo em português, incluindo nomes de arquivo, funções,
variáveis, colunas do banco, comentários e mensagens de teste. Mantenha assim.

## Comandos

```bash
npm run dev                # dev server (turbopack) em localhost:3000
npm run build              # build de produção; falha se faltar variável de ambiente
npm run lint               # ESLint
npm test                   # Vitest, unitários (tests/unit), jsdom, offline
npm run test:watch
npm run e2e                # Playwright, 5 viewports, roda build+start antes
npm run test:integracao    # Vitest contra o Supabase REAL (carrega .env.local)
```

Um teste só:

```bash
npm test -- tests/unit/horarios.test.ts
npm test -- -t "agrupa"                        # por nome
npx playwright test --project=w320 -g "menu"   # e2e: um viewport, um teste
```

`npm run e2e` **sempre** roda `npm run build && npm start`
(`reuseExistingServer: false`), não tente acelerar apontando para um dev
server já em pé; a suíte já validou build velha por causa disso. O outro lado
da mesma moeda: com um `npm run dev` ocupando a 3000 o Playwright nem começa,
ele para dizendo que a porta está em uso. Derrube o preview antes de rodar.

**E rodar o e2e derruba o preview mesmo em outra porta.** Trocar a porta do
`webServer` resolve o conflito de socket e não resolve o de disco: o
`npm run build` reescreve o `.next`, e o dev server que estava servindo a partir
dele passa a responder 500 em toda requisição. Não é defeito no código, é o
processo antigo apontando para artefatos que deixaram de existir. Depois de
qualquer build, suba o preview de novo.

`npm run test:integracao` exige `.env.local` preenchido e as migrations
aplicadas: ele lê o banco de verdade e afirma contagens do seed (6 categorias
ativas, 7 horários). `tests/integracao/segredos.test.ts` varre `.next/static`,
então rode um `npm run build` antes. Ele roda em Node puro, por
`vitest.integracao.config.mts`, que troca `next/cache` pelo esboço em
`tests/stubs/next-cache.ts`: fora de um render `unstable_cache` lança, e
memorizar entre os `it` mascararia mudança de dado no banco.

**`npm test` não passa em clone limpo**, e isso é de propósito:
`tests/unit/owners.test.ts` lê o OTF de origem em
`fotos-site/owners-font-family/`, pasta que o `.gitignore` cobre. Sem ela o
teste **lança** em vez de pular, porque medir a fonte errada, ou não medir, é
exatamente o erro que ele existe para impedir. Peça os arquivos de marca antes
de rodar a suíte pela primeira vez.

Os cinco viewports do Playwright chamam-se `w320`, `w768`, `w1024`, `w1440` e
`w1920`. A suíte unitária tem 27 arquivos e 291 testes e roda em torno de 13 s.
O e2e é **um arquivo só**, `tests/e2e/home.spec.ts`, com 25 testes que os cinco
viewports multiplicam por cinco: um `-g` errado custa 125 execuções e um build.

`vitest.config.mts` só enxerga `tests/unit/**/*.test.{ts,tsx}`: teste gravado
em outra pasta não roda e não avisa. O alias `@` aponta para a raiz, o mesmo
`@/*` do `tsconfig.json`, e todo teste importa por ele, nunca por caminho
relativo. `tests/setup.ts` carrega o `jest-dom`, faz `cleanup` entre os `it` e
esboça duas coisas que o jsdom não tem: `matchMedia`, que devolve `matches:
false` e é o que deixa montar todo componente que consulta
`prefers-reduced-motion`, e `ResizeObserver`, que nunca dispara porque o jsdom
não faz layout. Teste que depende de altura fixa `offsetHeight` na mão.

## Arquitetura

### A fachada de conteúdo é a única porta para o banco

`lib/conteudo.ts` exporta `getCategorias`, `getProgramacao`, `getHorarios`,
`getDepoimentos`, `getConteudo`. **Nenhuma seção fala com o Supabase
diretamente**. Se precisar de um dado novo na página, o caminho é
acrescentar/estender uma função ali, não importar o cliente numa seção.

Cada função é um `unstable_cache` com uma tag de `TAGS`. Traduz snake_case do
banco para camelCase do TypeScript no `.map()` e **lança** em caso de erro
(`exigirSemErro`) em vez de devolver lista vazia: seção vazia em produção passa
despercebida, erro não.

Tipos em `lib/conteudo.tipos.ts`. `lib/conteudo.seed.ts` continua sendo a fonte
de verdade do conteúdo e a fixture dos testes unitários;
`supabase/migrations/0003_seed.sql` é a cópia dele no banco e os textos batem
caractere por caractere. Alterou um, altere o outro.

Quem consome o quê, hoje:

| Consumidor | Chama |
|---|---|
| `Hero` | `getConteudo` |
| `Cardapio` | `getCategorias` |
| `Delivery` | `getConteudo` |
| `HorariosProgramacao` | `getConteudo`, `getHorarios`, `getProgramacao` |
| `Depoimentos` | `getConteudo`, `getDepoimentos` |
| `Header`, `Footer` | `getConteudo` |
| `DadosEstruturados` | `getConteudo`, `getHorarios` |

**A seção "Venha nos visitar" saiu em 2026-09-10**, a pedido do cliente, e com
ela o componente `OndeEstamos`. O motivo é repetição: endereço e contato já
viviam no rodapé, que vinha logo abaixo, e a seção gastava uma tela cheia para
dizer o mesmo. Duas coisas foram junto com ela e precisaram de destino, senão
sumiriam caladas. O link "Onde estamos" do menu passou a apontar para
`#rodape`, que é o `id` novo do `Footer`: âncora que não existe mais não leva
a lugar nenhum e nada avisa. E o "Como chegar" era **o único link para o mapa
no site inteiro**, então a montagem da URL do Google Maps mudou de arquivo e o
endereço do rodapé virou esse link. A seção também levou o único uso da
variante `fantasma` do `Botao`, que segue exportada e com teste.

`Depoimentos` fechou a página no lugar dela, e os dois textos do topo dela
trocaram de papel no mesmo dia. "Quem veio, volta", que era a linha de apoio,
subiu a título de display, e por ser literal da JSX ganhou linha em
`LITERAIS_DE_DISPLAY`. O `depoimentosTitulo` do banco desceu a subtítulo, com
copy nova, escolhida pelo cliente, que apresenta os cards em vez de titular a
seção.

**Essa descida é o que autoriza o acento na frase**, e o par de mudanças anda
junto: o campo **saiu de `textosDoSeed()`** em `owners.test.ts` porque agora é
fonte de corpo, e a Owners trial não desenha "música" nem "já". Devolver o
campo ao display obriga a desfazer as duas coisas. `0007_subtitulo_depoimentos.sql`
é o lado banco da troca, e o `0003` foi atualizado junto, como manda o fluxo
de duas pontas.

As **paradas da rota do delivery não vêm do banco**: são a constante `PARADAS`
no topo de `Delivery.tsx`, cinco bairros, passada ao `RotaMascote`. Se um dia
virarem conteúdo editável, o caminho é tabela nova mais função nova na
fachada, não consulta dentro da seção.

**Travessão (em dash) não entra em texto nenhum**, nem no site, nem em copy
nova, nem em commit: use vírgula, e "às" em faixa de horário. A regra é do
cliente, de 2026-09-04, e `0004_copy_sem_travessao.sql` foi a migration que
limpou o banco.

### Regra de negócio fora do Server Component

`lib/tituloHero.ts` existe por testabilidade, e o padrão vale para o próximo
caso igual. O título do herói é quebrado em três corpos (abertura, foco,
fecho), e `partesDoTitulo` decide quem é quem: o **foco é a penúltima
palavra**, o fecho é a última, o resto abre. A regra não mora na JSX porque
`Hero` é Server Component `async` que arrasta a fachada do Supabase junto, e
nenhum teste em jsdom conseguiria importá-lo; e porque o painel de admin ainda
vai poder trocar `heroTitulo`, e o destaque precisa acompanhar o texto novo.
`tests/unit/tituloHero.test.ts` cobre a repartição.

Mesmo motivo em `lib/horarios.ts`, `lib/costura.ts` e `lib/cabecalho.ts`:
**lógica que dá para errar sai do componente e vira função pura com teste.** O
`cabecalho` é o caso mais recente e o mais literal: as duas contas do header
fixo não lançam quando erram, só desalinham o recorte e estendem a barra na
hora errada, e um `useEffect` não tem como ser testado por isso.

O que a JSX do `Hero` guarda dessa repartição, e que se quebra fácil sem
saber: as três partes são `span` em `block` dentro de **um `h1` só**, com um
`{" "}` explícito no fim das duas primeiras, senão o JSX cola as palavras e o
`textContent` que o buscador e o leitor de tela leem vira
"Sua fomeacendeaqui.". Há e2e cobrando a frase inteira. A abertura e o fecho
dividem o corpo `--corpo-apoio`, declarado na coluna de texto e **não** na
classe, porque o mesmo número governa duas coisas que precisam bater no
pixel: o corpo dessas duas linhas e a altura da faixa em que o botão do
WhatsApp se encaixa, ao lado do fecho. O alinhamento do fecho à direita sai do
`w-fit` do `h1`, que encolhe até a largura do foco, e não de recuo calculado.

### A máscara da chama é geometria calculada, não `path` colado

`mascaraChama("borda" | "topo")` monta o SVG da máscara a partir das cúbicas de
`D_SILHUETA`: `cruzaEmY` acha onde o ombro cruza uma altura, `tangenteDaCubica`
dá a inclinação ali, e o filete emenda a curva no retângulo sem deixar canto. É
por isso que os dois consumidores, `Hero` e `Header`, recebem a mesma forma sem
copiar `path` um do outro. Houve uma terceira variante, `reserva`, que
desenhava o papel branco do Cardápio; ela saiu em 2026-09-10, quando o papel
passou a ser colado nas letras, ver a seção da espiral.

`AJUSTES.altura` **depende de `AJUSTES.escala`** e não é chute:
`altura = (113 * escala / 116 - 1) / (escala - 1)`. Mudou a escala, recalcule
a altura, senão a base da chama sai da dobra e volta o degrau no rodapé que os
dois valores existem para esconder. `tests/unit/costura.test.ts` cobre o que
dá para afirmar sem pintar: que a string não traz caractere cru que o parser
de CSS rejeite, que o SVG declara tamanho intrínseco, que o filete continua
dentro da silhueta e que a máscara usa `D_SILHUETA`, nunca a chama oficial.

### O fogo do foco vem da fonte, não de SVG por cima

O foco do título do herói ("ACENDE") está na **Combust**, e ela traz as
labaredas dentro do próprio glifo. É a única exceção à regra "todo display é
Owners", junto com a abertura e o fecho, que são Hanken.

A decisão é do cliente, de 2026-09-09, tomada comparando três caminhos lado a
lado no mesmo layout: a Owners com as chamas desenhadas em SVG, a Vaguard e a
Combust. O que foi medido e aceito na troca:

- a Combust é mais larga que a Owners XNarrow, então **na mesma largura de
  coluna a letra sai cerca de 18% mais baixa**;
- **a chama é igual em toda letra**, porque quem a desenha é a fonte, e a
  fonte não sabe onde a palavra está no layout. O skyline irregular da
  referência do Behance não sobreviveu à troca.

O que a troca eliminou: `lib/labaredas.ts`, `components/ui/Labaredas.tsx`, uma
tabela de sete topos de haste que precisava ser remedida a cada mudança de
tipografia, e o `mt` que o fogo cobrava do layout. `docs/labaredas-do-heroi.md`
descreve esse sistema e virou **documento histórico**: nada nele descreve o
código de hoje.

`scripts/gerar-combust.py` gera o WOFF2 servido, lendo o OTF de dentro de
`apresentação site/combust.zip`. Ele **subseta de propósito**: caixa alta
acentuada, dígitos e pontuação, o que derruba o arquivo de 84 kB para 28 kB.
Minúscula fica de fora porque o `h1` aplica `uppercase` e ela nunca chega a ser
desenhada. `tests/unit/combust.test.ts` lê a constante `GLIFOS` do script e
falha se o foco do `heroTitulo` do seed pedir um caractere que ficou de fora,
que é o mesmo perigo que `owners.test.ts` cobre para o resto do display.

Por isso `heroTitulo` **saiu** de `textosDoSeed()` em `owners.test.ts`: nenhuma
das três linhas do título é Owners hoje.

A Combust servida é a versão **FREE TRIAL**, igual à Owners. São duas
pendências de licença de webfont agora, não uma, ambas registradas no
`README.md`.

### A espiral do cardápio é hélice calculada, com pouso na identidade

`lib/espiral.ts` diz onde cada card do Cardápio está em cada instante da cena
presa, e `components/sections/FileiraEmEspiral.tsx` prende o palco e escreve a
`transform`. O gesto é portado da seção "Programação completa" da FITA
(`fita.art.br`), que o resolve em WebGL; aqui é CSS 3D, porque three.js sozinho
estoura o orçamento de primeira carga. Spec completo em
`docs/superpowers/specs/2026-09-09-espiral-do-cardapio-design.md`.

O que o porte ganha, e que explica o tamanho do módulo: **quem gira é o próprio
`<article>` do card**, e não um plano de WebGL separado. Por isso o alvo do
pouso é a **transformação identidade**, e não há destino para calcular nem para
medir. Card parado é card sem `transform`. A FITA precisa de um aparato inteiro
de entrega justamente porque os planos dela não são os cards.

**`CURSO_DA_HELICE` depende de `PASSO_ANGULAR` e de `PASSO_DO_POUSO`**, e a
razão é fixa: `curso = passo angular / passo do pouso`. Só nela todo card cruza
a altura de descolamento no seu próprio instante de pouso. Mexeu num, recalcule
o outro, senão o card descola na altura errada e nada lança. É a mesma
amarração que `AJUSTES.altura` tem com `AJUSTES.escala` em `lib/costura.ts`.

Outros números que erram calados. `PASSO_ANGULAR` divide pela hipotenusa de
`RAIO` e `SUBIDA * PROPORCAO`, e a proporção é conversão de unidade, não
enfeite: o raio está em larguras de card e a subida em alturas. E **toda
distância do módulo está em larguras do card DA BOBINA**, que é o card medido
no DOM ampliado por `ESCALA_NA_BOBINA`: o card é 1,4 vez maior enquanto voa do
que depois de pousado, que é o `GRID_SCALE` da FITA lido ao contrário. Usar a
medida crua encolhe a bobina em 28% e desgruda as bordas dos cards, porque o
vão continua valendo a largura ampliada.
`tests/unit/espiral.test.ts` cobre o que dá para afirmar sem pintar.

**A bobina passa POR TRÁS do texto, e isso são duas peças que só funcionam
juntas.** Na FITA sai de graça: a espiral é um canvas de WebGL numa camada
inteira debaixo da coluna de tipografia, e a reserva de papel do título come o
que passa. Aqui card e texto são irmãos no mesmo contexto 3D, e quem decide
quem cobre quem é a profundidade. Então: `RECUO_DO_PLANO`, em `lib/espiral.ts`,
empurra a hélice inteira para trás do plano de pouso, e o **papel** do
`CabecalhoDoCardapio`, hoje uma auréola branca colada em cada letra, engole o
que passaria por cima da tinta. Uma sem a outra não resolve. Sem o recuo a hélice tangencia o plano,
o card fica com metade à frente e metade atrás, o navegador o parte no
cruzamento e pinta a metade da frente por cima do título, que foi o defeito
relatado pelo cliente em 2026-09-09. Sem o papel não há o que cobrir. O valor
do recuo é `hypot(RAIO, 1/2) − RAIO`, a folga mínima: é o quanto a quina de um
card de perfil avança além do centro. E `transformacaoDoCard` corta o `z` em
zero, senão a ultrapassagem do pouso, que inverte o sinal do `restante`,
traria o card à frente do texto justo no estalo.

Repare no que a auréola muda no gesto: o card **continua aparecendo** entre as
palavras e nas entrelinhas, e some só na volta do glifo. O bloco que ela
substituiu apagava o card num retângulo inteiro.

**O papel do texto é colado em cada LETRA, e não é mais um bloco**, a pedido do
cliente em 2026-09-10. Ele foi um retângulo mascarado com a beirada direita em
silhueta de chama até essa data. A troca apagou o `div` da reserva, a variante
`reserva` de `mascaraChama` e todos os números dela: eram do desenho daquele
bloco. `Costura` voltou a ser só `borda` e `topo`.

A conta mora em `lib/papelDoTexto.ts`, com teste. São **dezesseis cópias
brancas do texto em círculo**, via `text-shadow`, todas à mesma distância da
tinta: 9px no título, 5px no parágrafo. Três coisas ali quebram calado. Passo a
mais entre duas cópias **abre dente na borda** da auréola, e dente branco sobre
card colorido só aparece no meio da cena presa, em movimento; o vão entre
vizinhas precisa ficar bem abaixo do raio, e em dezesseis passos ele é 0,39 do
raio. A cor sai do **token** `--color-branco`, não de um `#fff` cru, porque é a
mesma superfície que `contraste.test.ts` assume como fundo dos pares de texto
da seção. E a auréola **não usa `-webkit-text-stroke`**: o traço pinta metade
para dentro do glifo e depende de `paint-order: stroke fill` para a letra ser
redesenhada por cima, então onde `paint-order` não vale para texto de HTML o
branco cobre a letra e o título fica ilegível. Sombra não tem esse modo de
falhar, e foi por isso que se pagou a pintura mais cara.

Ela vale em **qualquer largura**, sem consulta de mídia: sobre o branco da
página a auréola é invisível, então não precisa ser desligada abaixo de 1024,
onde não há cena presa.

**`Pose.y` cresce para baixo, como no CSS.** A convenção já esteve trocada e
custou uma versão inteira: o módulo calculava para cima, o componente escrevia
direto num `translate3d`, e a bobina descia em vez de subir. Passou despercebido
porque espiral invertida continua parecendo espiral, e porque o teste que
deveria pegar afirmava `y < 0` para "abaixo da fileira", verdadeiro na
convenção errada.

**Os números são os da FITA convertidos, e não escolhidos no olho.** Cada
constante geométrica traz a conta da conversão no comentário, contra o
`lib/spiral-reel.ts` de lá: `RAIO` é 4,4/3,0, `SUBIDA` é 1,0/2,0, `VAO` é
0,2/3,0, `ALTURA_DE_POUSO` é 4,6/2,0. Uma passada anterior deste mesmo dia
tinha vão largo e subida alta, a pedido do cliente, e o cliente reverteu no
mesmo dia pedindo o gesto da referência. **O vão quase nulo é o que faz a fila
ler como corpo contínuo**, a cobra da referência; separar os cards desmancha o
gesto, e há teste que falha se ele voltar a crescer.

**O trilho é metade do gesto.** Dois filetes de SVG correm rente às bordas de
cima e de baixo dos cards, e saem da mesma equação da hélice, então não têm
como divergir dela. `projetarNoPalco` refaz em JavaScript exatamente a projeção
que o navegador aplica nos cards, e é por isso que a perspectiva é escrita pelo
componente, na medida, em vez de morar numa classe: o número em dois lugares
faria a linha escorregar dos cards no dia em que um dos dois mudasse.

**O card tem duas faces.** A hélice o gira quase volta e meia entre nascer e
pousar, e com `backface-visibility` no `<article>` inteiro ele sumiria em
metade do percurso, desmanchando a banda. Então o article é só a caixa 3D com
`preserve-3d`, e frente (creme, com o conteúdo) e verso (brasa chapada) são
filhas absolutas. O canto arredondado e o `overflow-hidden` moram nas faces:
`overflow` diferente de `visible` achata o conteúdo 3D e o `preserve-3d` se
perde.

A pose **congela no descolamento** e o voo interpola dela até a identidade,
como na FITA. Sem congelar, a hélice segue girando durante o voo e o card
ultrapassa o ponto de descolamento, invadindo o título.

**Quem cria as telas de rolagem é o espaçador do ScrollTrigger**, por causa do
`end: "+=240%"`, e não uma altura no CSS. Sem JavaScript, ou com menos
movimento pedido, o gatilho nunca é criado e não existe palco preso nem 240vh
de vazio. Uma altura declarada deixaria duas telas e meia em branco justamente
para quem pediu menos movimento. Pelo mesmo motivo os dois `path` do trilho
nascem com o `d` vazio.

O elemento preso é o invólucro largo, e não a coluna de conteúdo: o `pin`
substitui o elemento por um `div.pin-spacer` e assume o posicionamento dele, e
prender a coluna centrada entregaria a centralização ao espaçador. Vale saber
disso ao escrever teste: dentro de `#cardapio`, o `firstElementChild` passa a
ser o espaçador.

**O bento do Cardápio saiu em 2026-09-09, e não por gosto.** Prender o palco
exige que ele caiba numa janela, e a seção media 1137px de altura, o que não
cabia nem em 1920x1080; quem estourava era o tile grande, de 440px.

No lugar entrou, na mesma data, o arranjo da referência: de 1024px para cima a
seção é **uma grade só, de cinco colunas**, sendo a do meio um vão de 3rem que
separa as duas metades. O texto ocupa a metade esquerda da primeira linha,
quatro cards pousam na metade direita em 2x2, e **os dois últimos pousam
embaixo do texto**, dividindo a segunda linha com os de baixo do 2x2. Os cards
são paisagem 3:2, 216x144 em 1024 e 280x187 daí para cima.

Os dois últimos foram para debaixo do texto a pedido do cliente, e o motivo é
de composição: numa grade de duas colunas por três linhas eles sobravam numa
terceira fileira com meia tela vazia à esquerda, e liam como resto. De quebra a
seção encurtou 180px, o que dá folga para o palco preso caber em janela baixa.

**É uma grade só, e não duas colunas com uma grade em cada**, e a diferença não
é estilo: os seis cards precisam ser irmãos no mesmo contexto 3D para o
navegador ordená-los por profundidade. Em dois contêineres cada metade vira uma
camada chapada e a ordem de pintura passa a ser a do DOM, com o card do fundo
da bobina por cima do da frente durante metade da cena. Quem decide a célula de
cada card é `CELULAS`, em `Cardapio.tsx`, indexado pela posição dele no array:
o mesmo número decide onde ele pousa e quando. Os dois primeiros usam
`self-end` porque a primeira linha é tão alta quanto o texto, e sem isso
abriria um vão no meio do 2x2.

O `Reveal` saiu da grade junto, porque dois donos escrevendo `transform` no
mesmo elemento brigam.

A `ParedeDeTipos` do Cardápio saiu no mesmo dia, a pedido do cliente, e essa
não teve motivo técnico. **A da Delivery continua**, e as duas nunca foram a
mesma coisa: aqui era `opacity-10` sobre o branco, textura de fundo; lá ela é
elemento gráfico da faixa, e desde a fita contínua de anúncio entra com
`faixaBranca` e `corTexto="text-carvao"`. O componente e o teste dele seguem em
uso, e os literais `FIRE`, `N’BRASA` e `VAI N’BRASANDO` continuam em
`LITERAIS_DE_DISPLAY` por causa da Delivery.

`Categoria.destaque` **continua sem consumidor na interface, e já estava assim
antes disso**: o comentário do campo em `lib/conteudo.tipos.ts` afirma que ele
substitui a escolha por posição no array, mas quem escolhia o tile grande era a
posição no array. Quando o card ganhar foto pelo painel, ele é o candidato
natural a decidir qual card é o maior da fileira.

### O horário de funcionamento mora dentro do card, e o card é uma chama

Desde 2026-09-10 a seção `#programacao` não tem mais duas colunas. A lista de
horários saiu, e cada card de programação carrega o horário dos seus próprios
dias. A descrição do evento saiu da tela junto, a pedido do cliente: o campo
continua no banco e no painel, só não é renderizado.

**O card só sabe quais dias cobre por `ItemProgramacao.dias`**, um array no
padrão de `Date.getDay()`, e não pelo `diasLabel`. Os dois existem separados
porque o rótulo é copy: "Terça e quinta" são os dias 2 e 4, e não a faixa de 2
a 4, e assim que o painel deixar o dono escrever "Toda quarta" qualquer
interpretação do texto devolveria card sem horário, sem avisar ninguém.
`horarioDosDias`, em `lib/horarios.ts`, faz a tradução e mostra os dois
horários quando os dias de um card divergem, porque card que finge horário
único manda o cliente na hora errada.

**A segunda-feira vive no subtítulo**, que é a única parte da seção que fala
dela: ela é o único dia fechado e não tem card nenhum. `diasAbertos` monta a
frase ("Abrimos de terça a domingo") agrupando por adjacência e **ignorando o
horário**, ao contrário de `agruparHorarios`, que agrupa por horário igual e
partiria a faixa em três pedaços. A frase sai da tabela, e não da JSX, pelo
mesmo motivo que `horariosTitulo` não pode citar horário: escrita à mão ela
passa a mentir quando o dono mexe no painel.

`agruparHorarios` **ficou sem consumidor na interface** nessa troca, com os
dez testes de pé. Está exportado de propósito, porque é a forma de exibir a
semana inteira e o painel e o rodapé são os candidatos a pedi-la de volta.

A forma do card é `D_SILHUETA` contornada, sem preenchimento, alternando
brasa e carvão pela posição no array. É a mesma silhueta do recorte do herói
e da reserva do Cardápio, e **não** a marca: `D_CHAMA_OFICIAL` são três
pinceladas separadas, que contornadas viram fitas soltas e não têm barriga
onde caiba texto. Três números erram calados aqui. O viewBox leva 3 unidades
de folga de cada lado porque um traço centrado na borda derrama metade da
espessura para fora do path. A caixa de texto é um retângulo medido para
caber na elipse da barriga, de centro (50, 74) e semieixos 44 e 39: mexer na
silhueta obriga a remedir, e o texto não avisa quando encosta na curva. E o
`article` declara `container-type: inline-size` para que os `cqw` do texto
sejam porcentagem do card, não da janela; sem isso o card de 232px em 1024
sai com a letra do card de 300px.

**O título do evento vive dentro da barriga, e nenhum teste guarda o
comprimento dele.** Nome longo escrito no painel transborda a chama. É o
mesmo tipo de dívida do orçamento de 130 kB: medido uma vez, cobrado por
quem mexer.

> **Tudo o que vem abaixo sobre a QUEIMA é histórico, desde 2026-09-11.** A
> linha de fogo que subia por dentro de cada glifo foi aposentada por custo
> medido, e o que revela as duas seções hoje é a **brasa que vira letra**, em
> `lib/brasa.ts` e `components/motion/AcendeEmBrasa.tsx`. Ver a seção "A
> revelação é brasa que vira letra", logo adiante. `lib/queima.ts`,
> `components/motion/Queima.tsx` e o modo `queima` do `TextoQueAcende` seguem
> exportados e testados, sem consumidor na interface, como o `agruparHorarios`.
> Os parágrafos daqui em diante descrevem como aquele gesto funcionava, e não
> o código que roda hoje.

**Todo o texto da seção revela na entrada e esfumaça na saída**, desde
2026-09-10. O gesto veio de uma referência de alfabeto animado em fogo que o
cliente mandou; o que foi tomado emprestado é o movimento, e **não** a paleta,
porque lá o fundo é preto com laranja e aqui a página é clara. A cor de
repouso de cada letra é lida do DOM antes de qualquer animação: carvão no
título do evento, brasa-escura ou creme-texto nos rótulos. Na saída o texto
sobe, desfoca e some, porque subir mais desfocar é o que lê como fumaça;
descer leria como queda.

**Desde 2026-09-11 a entrada aqui é a mesma queima das avaliações**, a pedido
do cliente: a linha de fogo sobe por dentro do glifo, em vez de a letra subir
inteira e esfriar. Ver "As avaliações são reveladas por uma linha de fogo que
sobe", que descreve o mecanismo. **Quem queima letra a letra é só o display**,
por `components/motion/TextoQueAcende.tsx`: o resto usa o `Queima`, de bloco.
A divisão é a mesma das avaliações, e o parágrafo do custo, logo abaixo,
explica por que ela não é estilo.

Duas coisas ali quebram calado. A frase inteira vai num `sr-only` e a versão
quebrada leva `aria-hidden`, senão o leitor de tela **soletra** o título. E o
espaço entre palavras fica **fora** do `whitespace-nowrap` de cada palavra: as
letras são `inline-block` para poderem ser transformadas, e sem essa separação
ou a linha quebra no meio de uma palavra ou perde a única oportunidade de
quebra que tem.

Só o contorno da chama de cada card continua no `Reveal`, com `saida`, e o
`Reveal` embrulha **apenas o SVG**, não o card inteiro: embrulhando tudo, a
opacidade dele multiplicaria a das letras e o acender sairia lavado.
O `Reveal` sem `saida`, que revela uma vez e fica, **ficou sem consumidor na
interface** em 2026-09-10, quando as avaliações passaram a queimar: era
`Depoimentos` quem dependia dele. Segue exportado e testado, como o
`agruparHorarios`.

**A queima letra a letra ficou só no display, e a razão é custo medido.** Ela
vale no título da seção e nos quatro títulos de evento. O subtítulo, os
rótulos de dia e as horas usam o `Queima`, que mascara o bloco inteiro de uma
vez. São 71 letras animando, e não as 163 de antes.

A troca é de 2026-09-11, e o gatilho foi o cliente relatar a rolagem
engasgando. Com tudo letra a letra a seção custava assim, numa entrada
inteira em 1440x900, contra um trecho de controle de mesma distância dentro da
Delivery, que não tem queima nenhuma:

| Entrada da seção, 1440x900 | Controle, sem queima | 163 letras | 71 letras |
|---|---|---|---|
| Intervalo médio entre quadros | 16,7 ms | 45,0 ms | 27,3 ms |
| Quadros acima de 20 ms | 0% | 68,7% | 62,2% |
| Pior quadro | 17,1 ms | 117,9 ms | 70,4 ms |

Descontado o controle, o custo próprio da seção caiu de 28,3 ms por quadro
para 10,6 ms, uma queda de 63%. **Ela ainda não segura 60 quadros por segundo
nessa medição**, que foi feita num navegador sem tela, mais lento que o Chrome
onde os números antigos desta tabela nasceram: lá as mesmas 163 letras davam
24,4 ms de média e 26,3% de quadros lentos. Os três valores acima se comparam
entre si, e não com medição de outra máquina.

**Nem a pluma nem a máscara explicam o custo sozinhas**, e as duas foram
desligadas uma a uma com as 163 letras: sem a pluma dá 37,1 ms, sem a máscara
35,7 ms, contra 45,0 com tudo ligado. O que pesa é a **quantidade de alvos**:
o GSAP escreve uma propriedade em cada letra a cada quadro, e cada escrita
invalida o estilo das duas camadas filhas. Eram quase 500 elementos
recalculando, hoje são 151. Reduzir o custo é reduzir quantos elementos
animam, não o que cada um pinta.

O outro lado é de desenho, e andou junto: **em corpo pequeno a queima lê
pior**. A cópia borrada vira borrão sujo em vez de fumaça nos rótulos de 11px
e nas horas, e o gesto foi calibrado no display do título.

Há um caminho que preservaria a queima letra a letra em tudo, e ele foi
considerado e recusado em 2026-09-11: mover a linha de fogo para uma
propriedade única num ancestral e dar a cada letra o seu recuo em CSS. Isso
corta a escrita do GSAP de 163 para 14, mas a invalidação de estilo continua
descendo para os mesmos elementos, então o ganho é incerto e a mudança é bem
maior. **Nenhum teste mede nada disso**; a medição é manual, e o trecho de
controle na Delivery é como reproduzi-la.

**`toggleActions: "play reverse play reverse"` não funciona neste site**, e
essa é a armadilha que custa uma tarde. `SmoothScrollProvider` liga
`gsap.ticker.lagSmoothing(0)`, então um quadro demorado chega ao GSAP com o
delta inteiro e a reversão pula direto para o tempo zero; no tempo zero o
`immediateRender: false` da tween de entrada suprime a pintura. A tween marca
`reversed`, o gatilho marca `progress` 1, e o elemento fica visível para
sempre. Nada lança, e nada no console avisa. Por isso o caminho de `saida`
cria uma **tween nova a cada travessia** em vez de reverter, o que também dá
à saída uma duração e uma curva próprias. Só a primeira entrada usa `fromTo`:
nas voltas o conteúdo já está escondido, e refazer o estado inicial daria um
salto.

### A revelação é brasa que vira letra

Desde 2026-09-11 as duas seções com texto animado, horários e avaliações,
revelam pelo mesmo gesto: o texto nasce brasa fosca e desfocada, sem forma de
letra ainda, entra em chamas, e o fogo apaga deixando a letra assentada na cor
de repouso dela. São três fases numa linha do tempo só, em
`components/motion/AcendeEmBrasa.tsx`, com as contas em `lib/brasa.ts`. O
cliente escolheu o gesto **vendo**, num mockup com a fonte e a paleta reais, e
não no papel, que é como a pluma e o véu também foram calibrados.

**Ele é de BLOCO, e isso é a correção, não um detalhe.** Um elemento animado
por texto, nunca um por letra. O gesto que ele substituiu, a queima, era letra
a letra, e cada letra carregava duas camadas filhas, uma máscara repintada a
cada quadro e uma pluma de seis sombras. Medido no navegador a 1440x900,
rolando a 900 px/s, contra um trecho de controle de mesma distância dentro da
Delivery, que não anima texto nenhum:

| Trecho da seção de horários | Médio | Quadros > 20 ms | Pior |
|---|---|---|---|
| Delivery, controle sem gesto | 16,7 ms | 0% | 18,7 ms |
| Queima, 71 letras | 62,4 ms | 91% | 267 ms |
| Queima, só as 23 do título | 31,0 ms | 75% | 150 ms |
| Brasa em bloco, hoje | 16,9 ms | 4,7% | 34,3 ms |

A resposta é **linear no número de elementos animados**, e some quando ele
chega a zero. Não adianta baratear o que cada um pinta: desligar a pluma ou a
máscara, uma a uma, não resolvia. Quem for tentado a quebrar o gesto em letras
de novo lê esta tabela antes, e `AcendeEmBrasa.test.tsx` tem um teste que
falha se alguém voltar a gerar um `span` por letra.

**A divisão de papéis mudou de eixo: o que separa não é mais fogo ou nada, é
COM HALO ou SEM HALO.** Na seção de horários o fogo fica no display, título da
seção e títulos de evento, e rótulos de dia e horas seguem no `Reveal`, porque
em corpo de 11px o gesto lê como sujeira. Nas avaliações o corpo é bem maior, e
a pedido do cliente em 2026-09-11 **a seção inteira acende**: subtítulo e os
três cards vieram junto, mas com `halo={false}`.

**O halo é pago por GLIFO, e não por bloco animado**, e essa é a segunda
descoberta de custo do dia. Com halo no subtítulo e nos três cards, a seção das
avaliações saiu de 16,7 ms por quadro para 22,7 ms, com 43% dos quadros acima
de 20 ms: um card tem centenas de letrinhas e cada uma pinta duas cópias
borradas sobre a foto de fundo. Desligar o DESFOQUE no lugar dele não mudou
nada, 23,3 ms, o que descarta o filtro. Sem halo a seção volta aos 16,7 ms do
controle. Display tem poucas letras grandes e paga tranquilo. Ligar `halo` num
bloco de corpo devolve o engasgo, e nada lança.

Sem o halo o gesto continua sendo brasa que vira letra: quem faz o fogo é a
passagem pela COR, e a sombra só engrossa. Há teste que falha se a cor sair
junto, porque aí o bloco viraria um fade e o gesto sumiria do corpo da seção.

**A cor de repouso mora no elemento animado, e não no `h2`.** O gesto anima
`color`, e filho com classe de cor própria não herda: com `text-branco` no
`h2` das avaliações, o título assentaria na cor errada e nada lançaria. Por
isso a classe de cor está no `AcendeEmBrasa` e o heading só leva tipografia.

**O que erra calado aqui** são dois números e uma sobra. Sobra de `textShadow`
ou de `blur` na última fase não se desfaz sozinha: o título fica borrado e com
halo vermelho **parado** na tela, e ainda paga uma camada de composição para
sempre, e é por isso que a tween termina num `clearProps`. E a emenda entre a
segunda e a terceira fase precisa cair **antes** de a chama acabar, senão o
texto trava em vermelho cheio no meio do gesto. Os três têm teste.

O orçamento de tempo é 1,3 s, bem mais apertado que os 3,15 s que a queima
chegou a custar, e essa é a correção de fundo do defeito original: o elemento
fica cerca de 890 px dentro do gatilho, que a 1100 px/s dá 0,81 s, então
revelação que passa disso não termina antes de a seção sair pela tela. A conta
não depende do comprimento do texto, ao contrário da queima, onde a cascata era
passo vezes número de letras e quem escrevia a copy no painel decidia a duração
da cena.

**O halo é brasa nas duas seções**, escolha do cliente em 2026-09-11 ao ver o
mockup. Vale saber que ela reabre o que ele tinha decidido no mesmo dia para a
queima, quando mandou tirar todo vermelho das avaliações porque o halo brigava
com a foto atrás do véu. A diferença aceita é que agora o vermelho é um estalo
de meio segundo, e não um brilho que acompanha a revelação inteira. O
componente recebe `brilho`, então trocar por carvão ali é uma prop.

### As avaliações eram reveladas por uma linha de fogo que sobe (histórico)

> **Histórico desde 2026-09-11.** Descreve a queima, que saiu da interface.
> Ver a seção acima para o que roda hoje.

Desde 2026-09-10 a seção "Quem veio, volta" não usa mais o `Reveal`. O cliente
pediu que ela ficasse fiel à mesma referência de tipografia em fogo que deu
origem ao `TextoQueAcende`, e apontou as duas coisas que faltavam: a fumaça e
a revelação de baixo para cima. A conta mora em `lib/queima.ts`, com teste.

**O que sobe é uma máscara dentro do glifo, e não o glifo.** A letra fica
parada e um gradiente de máscara atravessa a caixa dela de baixo a cima:
abaixo da linha de fogo o glifo é tinta, acima dela ainda é fumaça. É a
diferença para o `TextoQueAcende`, onde a letra inteira sobe e esfria. A banda
de transição, `MACIEZ`, é o que faz a fronteira ler como chama; recorte de
borda dura no lugar dela leria como papel rasgado.

Três números erram calados. `LINHA_INICIAL` precisa estar uma `MACIEZ` inteira
**abaixo** de zero, senão a base da letra nasce já acesa, porque a transição
começa na linha e termina acima dela. `LINHA_FINAL` abaixo de 100 deixa o topo
do glifo sem tinta para sempre. E `calc` mal fechado não lança: o navegador
descarta a declaração inteira, a máscara some, e a letra aparece pronta, sem
queima nenhuma.

**A máscara é escrita por JavaScript, e nunca na marcação.** Ela é o que
esconde o texto, então só pode existir onde há quem a mova: escrita na JSX,
deixaria a seção invisível para sempre em quem carregasse a página sem o GSAP.
Pelo mesmo motivo ela é **retirada** quando o fogo acaba, e o texto parado
volta a ser texto puro, sem camada de composição.

**O estado inicial é aplicado na montagem, e não no instante do gatilho**, o
que é a diferença para todo o resto do site. `escondeNaMontagem` decide, e a
pergunta é sobre posição: o que ainda está abaixo da janela nasce escondido, o
que já está à vista não é tocado. Sem isso o texto sobe a tela em opacidade
cheia, é visto por volta de cem pixels de rolagem, e só então salta para
escondido, que era a piscada que a seção tinha com o `Reveal`. Esconder o que
já está à vista seria pior, porque apagaria na frente de quem está lendo.

**São dois componentes, e a divisão é de orçamento.** O título usa
`TextoQueAcende` com a prop `queima`: são 14 letras, cada uma com duas camadas
sobrepostas, e a de cima, borrada, é a fumaça. O subtítulo e os três cards
usam o `Queima`, irmão dele, que põe **uma máscara só** no bloco inteiro e
troca a cópia borrada por um desfoque que limpa junto com a subida. Letra a
letra nos cards seriam mais de trezentos elementos mascarados, contra as 163
letras que a seção de horários já custa, e duplicaria o texto do card no DOM.

**A cópia de fumaça do título não é branca, e também não é carvão.** Ela
herdava a cor da letra e ficava branca, o que lia como letra fora de foco. O
cliente pediu mais carvão em 2026-09-11, e carvão puro **some**: o véu da seção
também é carvão, e escuro sobre escuro não aparece. Medido no navegador, com
carvão o título desaparecia no começo da queima. Ela parou no `creme-texto`,
que é o mais escuro que ainda lê como fumaça sobre o véu. Quem carrega o carvão
de verdade é a pluma, que é sombra e por isso escurece o que está atrás dela.

**Os três cards precisam do `delay` escalonado.** Eles são irmãos da mesma
linha da grade e têm o mesmo topo, então os três gatilhos pegam no mesmo
instante: sem atraso a fileira inteira acende de uma vez, que é o que
acontecia antes. No telefone eles empilham e a própria rolagem já os separa.

**Nada de vermelho nesta seção, nem na tinta nem no brilho.** Na tinta ele
esbarra na mesma armadilha que trocou a cor das estrelas: sobre o véu de carvão
o `brasa` dá 1,1:1 e some. No brilho ele chegou a ficar, e saiu em 2026-09-11,
a pedido do cliente: esta é a única seção de fundo escuro que queima, e o halo
vermelho brigava com a foto atrás do véu. O brilho é **carvão** desde então, e
de quebra dá borda à letra branca quando ela atravessa a parte clara da foto,
que é o céu. A entrada de sempre, a da seção de horários, continua nascendo na
brasa, porque lá o fundo é a página clara. A tinta, nas duas, é a cor de
repouso lida do DOM.

**E o brilho não é um halo, é uma pluma**, também a pedido do cliente no mesmo
dia: halo simétrico não lê como fumaça. São seis cópias empilhadas para cima
pelo `text-shadow`, cada uma mais alta, mais borrada e mais fraca, e ela sobe e
se desfaz conforme o fogo atravessa a letra. Dois detalhes fazem ela parecer
fumaça: cada cópia escora para o lado, e o lado cresce mais que a altura, o
que abre a pluma em leque; e cada letra tem a **sua própria deriva**, por
`derivaDaLetra`, senão as catorze saem idênticas e a palavra lê como padrão.
Eram três até 2026-09-11, e o terceiro era o desfoque crescer mais depressa
que a altura; ele saiu com o pedido de ver a letra dentro da fumaça, logo
abaixo.

A deriva é conta, e não sorteio, porque a pluma é remontada a cada entrada na
seção: com `Math.random` ela pularia de lado na volta do visitante, sem motivo
visível. Medido no navegador, a pluma inteira cabe em 60 quadros por segundo,
com 1,9% dos quadros acima de 20 ms. Essa medição é das catorze letras do
título das avaliações e **é anterior à troca da pluma**, que baixou o desfoque
e portanto só pode ter ajudado.

Quem a move **não é uma tween**: ela lê a mesma `--linha-de-fogo` da máscara,
por duas propriedades derivadas que o navegador recalcula sozinho, então as
duas não têm como dessincronizar. Isso não é preferência de estilo. Animar a
sombra inteira pelo GSAP foi a primeira tentativa, e ele interpola bem o
desfoque e o alfa e **embaralha os deslocamentos**: medido no navegador, uma
cópia foi parar a 49px de altura, fora de qualquer estado válido, enquanto as
vizinhas ficavam curtas. Nada lança, e a pluma vira um borrão trêmulo.

**As cópias voltaram a ser letras legíveis em 2026-09-11**, a pedido do
cliente, que pediu para enxergar a letra dentro da fumaça. Até então o
desfoque crescia mais depressa que a altura justamente para dissolver o
glifo, e o comentário do código advertia que seis letras legíveis empilhadas
leem como carimbo. O risco segue de pé e foi aceito vendo, não no papel.

**O que separa as cópias é a altura da pluma, e não o desfoque.** Essa é a
medição que o pedido obrigou a fazer, porque ele chegou como "só baixar o
desfoque" e isso sozinho não funciona. O vão entre duas cópias vizinhas é
`SUBIDA_DA_PLUMA` dividida por `PASSOS_DA_PLUMA`, e uma cópia só lê como
letra enquanto esse vão for maior que o desfoque que ela carrega. Na pluma
antiga, de 0,08 a 0,34em, as seis cabiam dentro de um oitavo de em e o vão
dava um vigésimo do desfoque: zerar o espalhamento ainda deixava tudo fundido,
porque o `DESFOQUE_BASE` de 0,04em sozinho já valia três vezes o vão. A pluma
foi para 0,22 a 0,72em e a base para 0,01em. **O pior caso é o nascimento**,
quando ela está mais baixa e mais forte ao mesmo tempo, e ali o vão dá 1,44
vez o desfoque, contra 1,87 no meio da queima. Há teste que cobra o
nascimento; abaixo de 1 as cópias se fundem e nada lança.

**As máscaras da queima declaram `mask-repeat: no-repeat` desde essa mesma
troca.** O valor inicial da propriedade é repetir, e o gradiente é medido pela
caixa da letra, então acima dela o ladrilho recomeça. Com a pluma antiga, de
0,34em, isso passava despercebido; com 0,72em o topo dela atravessaria uma
cópia nova do gradiente e sairia recortado em faixa. As máscaras da costura do
herói já declaravam o mesmo, em `globals.css`, e foi de lá que veio a pista.

### Cache e revalidação

`TAGS` (em `lib/conteudo.ts`) é a lista fechada de tags válidas.
`POST /api/revalidar` aceita `{ tag }` só se estiver nesse conjunto,
autenticado por `Authorization: Bearer $REVALIDATE_SECRET`. As futuras Server
Actions do painel chamarão `revalidateTag` com as mesmas constantes.

### Dois clientes Supabase, propósitos incompatíveis

- `lib/supabase/servidor.ts`: chave anônima, usado pelos Server Components via
  a fachada. O que ele enxerga é decidido pelo RLS, não por confiança no código.
  Exporta `SUPABASE_URL`/`SUPABASE_ANON_KEY` já validados (`exigir` explica onde
  cadastrar a variável faltante, local **e** na Vercel).
- `lib/supabase/admin.ts`: service role, **ignora RLS**. Marcado com
  `import "server-only"` e restrito a scripts locais. Nunca importe de `app/` ou
  `components/`: há teste de integração que falha se acontecer.

### Banco

Cinco tabelas em `supabase/migrations/`: `0001_schema.sql` (categorias,
programacao, horarios, depoimentos, conteudo, esta última linha única,
`id = 1`), `0002_rls.sql` (revoga grants, liga RLS forçado, leitura pública só
de `ativo = true`, escrita só para admin autenticado), `0003_seed.sql` (conteúdo
real), mais duas de correção de copy, ambas numeradas `0004` de propósito por
serem independentes entre si: `0004_copy_owners.sql` (tira os acentos dos
campos que chegam a elementos de display, que a Owners trial não desenha) e
`0004_copy_sem_travessao.sql` (nova copy do herói e fim do travessão). A
quinta é `0005_titulo_horarios_programacao.sql`, de 2026-09-10: a seção de
horários abria com dois títulos lado a lado e passou a ter um só, o do banco.
Ela é a demonstração do fluxo de duas pontas descrito no parágrafo abaixo. A
sexta é `0006_dias_da_programacao.sql`, do mesmo dia, e é a única que mexe em
**schema**: acrescenta `programacao.dias`. Por ser schema, ela é o caso em que
o fluxo de duas pontas inclui o `0001`, e não só o `0003`.
Aplicadas manualmente no projeto Supabase: SQL editor ou
`npx supabase link --project-ref <ref> && npx supabase db push`. Migrations
devem ser reentrantes: a de RLS já quebrou por ter sido aplicada pela metade.

**`0003_seed.sql` é um `INSERT` puro, sem `on conflict`: reaplicá-lo num banco
já semeado quebra por chave duplicada.** Por isso toda mudança de conteúdo é
feita em dois lugares: o texto novo entra no `0003` (para uma instalação nova
já nascer certa e continuar batendo com `lib/conteudo.seed.ts`) e ganha uma
migration nova de `UPDATE`s por id, naturalmente reentrante, que leva a
mudança aos bancos que já rodaram o seed. As duas `0004` são exatamente isso.

`horarios.dia_semana` segue `Date.getDay()` (0 = domingo) e `ordem` exibe a
semana começando na segunda, domingo leva `ordem` 7. `lib/horarios.ts` agrupa
dias adjacentes com o mesmo horário ("Terça a quinta", "Sexta e sábado").

O seed inclui de propósito linhas **inativas** (categoria `chopp`, depoimento
`d4`): elas provam que o filtro de `ativo` funciona.

### Fronteira cliente/servidor

Onze arquivos carregam `"use client"`: `SmoothScrollProvider`, `MenuMobile`,
`Reveal`, `AcendeEmBrasa`, `TextoQueAcende`, `Queima`, `RotaMascote`,
`RolagemDoCabecalho`, `FileiraEmEspiral`, `VideoFachada` e `app/error.tsx`,
**mas só oito chegam à página**: `VideoFachada` está órfão, ver logo abaixo, e
`TextoQueAcende` e `Queima` ficaram órfãos em 2026-09-11, quando a queima saiu
da interface e a brasa entrou no lugar. Todo o resto é Server Component
`async` que aguarda a fachada. GSAP, ScrollTrigger e Lenis entram por
`await import()` dentro de `useEffect`, nunca no bundle inicial, e cada um
verifica `prefers-reduced-motion` antes de animar, e há testes unitários e e2e
que provam que nada de conteúdo depende de animação.

`FileiraEmEspiral` é o único que checa a preferência por `gsap.matchMedia` em
vez de uma leitura única na montagem, e a diferença é de propósito: os outros
não mudam de comportamento com o tamanho da janela, e ele muda. Quem começa
numa janela larga e reduz para menos de 1024 precisa perder a cena presa na
travessia, senão fica com 240vh de rolagem num layout de coluna única.

**`VideoFachada` não está montado em lugar nenhum.** O componente, os testes
unitários dele e `public/video-fachada.mp4` seguem no repositório, mas o
`Hero` deixou de renderizá-lo na reforma do título em três linhas, e o e2e
**cobra a ausência**: o teste "o herói usa a foto IMG_3643 sem montar vídeo"
afirma zero elementos `<video>` e zero requisições ao mp4. Remontar o vídeo
quebra a suíte de propósito, é decisão de desenho a retomar com o cliente, não
descuido a "consertar".

A lógica dele, se voltar: o `<video>` só entra no DOM quando
`prefers-reduced-motion` não está ativo **e** a primeira pintura já passou,
porque em CSS puro o arquivo baixaria sempre, inclusive para quem pediu menos
movimento, e o elemento candidato a LCP é a foto logo atrás dele.

### O header é fixo, e o recorte do herói corre atrás dele

No desktop (`min-width: 1024px`) o header deixa de ser faixa de ponta a ponta.
A regra `.cabecalho-hero`, em `app/globals.css`, o deixa transparente e pinta o
fundo em dois pseudoelementos: a metade esquerda é retangular, e a direita usa
a **mesma máscara da chama** com composição `exclude`, portanto só pinta onde
a foto não está. Mexer no recorte do herói (`AJUSTES`, em `lib/costura.ts`)
move os dois de uma vez, que é justamente a intenção. No mobile ele sempre foi
barra cheia e `sticky`, e continua sendo.

Ele é **fixo**, e já foi absoluto. Absoluto, header e foto desciam juntos e as
duas máscaras nunca se separavam, de graça; o preço da barra fixa é que ela
fica parada enquanto a foto sobe. Quem paga é `RolagemDoCabecalho`, que a cada
quadro de scroll escreve `--costura-rolagem` no header, e o CSS subtrai esse
valor da posição da máscara. As duas contas moram em `lib/cabecalho.ts`,
com teste, porque erram caladas. **A variável precisa de `0px` de reserva no
`calc`**: ausente na primeira pintura, ela invalida a declaração inteira e a
`mask-position` cai no canto, levando o recorte junto.

O recorte só vale enquanto existe foto atrás dele. Quando a base do herói
cruza a base do header, `data-fora-do-heroi` estende a metade esquerda até a
borda e apaga a mascarada: a barra abre da esquerda para a direita e engole o
recorte. A transição é presa a `data-pronto`, que o componente liga um quadro
depois da primeira pintura, senão quem recarrega a página no meio do site vê a
barra nascer recortada e se abrir sozinha.

**A largura de `.cabecalho-conteudo` é o pior caso, não o caso do topo**, e
esse é o detalhe que mais surpreende quem chega. Com a máscara deslizando, por
volta de meia tela de rolagem a barriga da chama cruza a faixa e empurra a
borda da parte clara bem para a esquerda: numa janela de 1440 ela sai de 1122
no topo para 774 no mínimo. Esse mínimo é `50vw + 6dvh`, porque o ponto mais
gordo da silhueta está a 6 unidades das 100 do viewBox e a chama tem quase
exatamente a altura do herói. O valor era `34dvh` e só servia ao header antigo.

Medido, o conteúdo precisa de 637px (logo 115, os quatro links 453, mais gaps
e recuos) e a área segura dá 558px em 1024x768, 624px em 1152x800 e 688px em
1280x800. Por isso **entre 1024px e 1279px a navegação de desktop dá lugar ao
hambúrguer**, numa regra própria em `globals.css`, inclusive com a barra já
estendida, onde caberia: aparecer e sumir conforme a rolagem seria pior que
ficar recolhida nessa faixa. O e2e "a navegação do header nunca cai em cima da
foto" mede isso no pior scroll e falha no dia em que a navegação crescer, por
exemplo com o botão de campanha ligado no banco, que sozinho come a folga de
51px que sobra em 1280.

### Tokens de marca

Declarados uma vez em `app/globals.css`, bloco `@theme` do Tailwind v4
(`--color-carvao`, `--color-brasa`, `--color-creme`, `--color-creme-texto`,
`--color-creme-borda`, `--color-branco`, `--color-brasa-escura`,
`--color-brasa-funda`), consumidos como classes (`bg-carvao`,
`text-creme-texto`). `tests/unit/tokens.test.ts` fixa os valores hex, **e
também afirma que `cinza`, `fumaca` e `brasa-texto` continuam ausentes**, e
`tests/unit/contraste.test.ts` calcula a razão WCAG de cada par texto/fundo.
**Todo par novo ganha uma linha lá**; um token de contraste já falhou quatro
vezes neste projeto por não ser medido contra a superfície real.

### Imagens

Os derivados web ficam versionados em `public/` (AVIF + WebP em 900 e 1600 px,
mais `fachada-nbrasa-1600.jpg` como último fallback) e
saem de `python scripts/gerar-fachada.py`, que lê o original de 33 MB em
`apresentação site/` (fora do repositório). Rode só quando a foto de origem
mudar. O `Hero` embute um borrão base64 de 16 px como placeholder.

As cinco fotos dos cards da rota do delivery seguem o mesmo molde:
`python scripts/gerar-paradas.py` lê `centro.png`, `praia do anil.png`,
`praia grande.png`, `pontal.png` e `verolme.png` da mesma pasta e grava
`public/parada-<id>-{320,640}.{avif,webp}` mais um `.jpg` de fallback em 640.
O `<id>` é o da constante `PARADAS`, em `Delivery.tsx`: **id novo ali obriga
a rodar o script**, senão o card fica com buraco. O script corta na proporção
do card (4/3.4), sempre tirando largura, e `FOCO_HORIZONTAL` por foto é o
botão desse corte. A do Centro é a única fora de 0,5: o letreiro
"EU ♥ ANGRA DOS REIS" é mais largo que a janela e 0,70 é o foco que deixa
uma frase inteira em pé. `tests/unit/RotaMascote.test.tsx` falha se o
`<picture>` citar arquivo que não existe em `public/`.

A foto do herói é um `<img>` com `<picture>`, **não `next/image`, e isso é
deliberado**: o componente do Next é de cliente e subiu a primeira carga de
122 kB para 127 kB contra um orçamento de 130 kB, e o otimizador da Vercel
acrescenta latência justamente no elemento candidato a LCP. Não "corrija" para
`next/image`.

**Esse orçamento de 130 kB não tem teste que o guarde.** Nenhuma suíte lê o
tamanho do bundle; o número sai da tabela de First Load JS que o `npm run
build` imprime, e conferir é trabalho de quem mexe em dependência de cliente.
É por isso que GSAP e Lenis entram por `await import()` e que a parede de tipos
é CSS puro: cada decisão dessas foi tomada contra um número que ninguém vai
cobrar automaticamente.

**O fundo da seção de avaliações é foto com véu, e o véu é conta, não gosto.**
`python scripts/gerar-quem-veio-volta.py` lê `quem veio volta.png` de
`fotos-site/` e grava AVIF e WebP em 640 e 1080, mais um JPEG de reserva. A
foto foi trocada pelo cliente em 2026-09-10, e a nova chegou com nome
diferente da primeira, que tinha um espaço antes do ponto. Ele é o único dos
scripts de imagem que **não corta**: a seção cobre a janela inteira, cuja
proporção muda com o visitante, então quem corta é o `object-cover`. E 1080 é
o teto: a origem tem 1122, e numa tela de 1440 o navegador já amplia 1,33 vez,
o que passa despercebido atrás do véu e não passaria numa foto nua.

O véu é `bg-carvao/78` e a opacidade governa a legibilidade de todo texto da
seção. Foto não tem cor única, então o que se mede é o pior caso: quanto mais
clara a foto, mais claro o composto, e o extremo é branco puro atrás. Carvão a
78% sobre branco fecha em `#545050`, que dá 8,0:1 com o branco e 6,5:1 com o
creme. Ele nasceu em 70% (`#666262`, 6,0:1 e 4,9:1) e o cliente pediu mais
escuro no mesmo dia, junto com a troca da foto. O piso é 62%: daí para baixo o
branco cai de 4,6:1 e reprova. **Baixar a opacidade não lança nada**, só deixa
o texto ilegível sobre a parte clara da foto, que é o céu no topo dela.

Foi essa troca que tirou o fundo e a borda dos cards de avaliação, a pedido do
cliente, e **as três cores do card mudaram junto, por obrigação**: as estrelas
eram `brasa`, que sobre o véu dá 1,1:1 e some. Sobre foto só valem branco e
creme, e há teste que registra o número para a conversa não recomeçar.

O favicon sai de `python scripts/gerar-favicon.py`, que lê a chama de
`lib/marca.ts` e grava três arquivos em `app/`, de onde o App Router os serve
sozinho: `icon.svg` (Chrome e Firefox), `favicon.ico` (Safari e o pedido cru a
`/favicon.ico`) e `apple-icon.png` (atalho do iOS). O tratamento é chama
**branca sobre azulejo brasa**, e não a chama vermelha solta: a 16px a chama
sozinha vira mancha, porque é bem mais alta que larga. O `.ico` precisa sair em
**RGBA**, o Turbopack recusa PNG interno em RGB durante o build.
`tests/unit/favicon.test.ts` falha se o SVG sair de sincronia com `marca.ts`.

`public/video-fachada.mp4` (1280×720, 4,4 s, 1,05 MB) continua versionado e é
o único ativo pesado do repositório, mas **hoje ninguém o baixa**: o herói não
monta mais o `VideoFachada` (ver "Fronteira cliente/servidor"). Se ele voltar,
usa o mesmo `AJUSTES.recorteDaFoto` da foto, para a troca não deslocar o
enquadramento, e a foto segue sendo o `poster` e o candidato a LCP.

### SEO

`lib/site.ts` centraliza `SITE_URL`, hoje um **placeholder** (`nbrasa.vercel.app`),
consumido por `metadataBase`, `robots.ts` e `sitemap.ts`. `DadosEstruturados`
emite JSON-LD `Restaurant` a partir de `lib/schemaRestaurant.ts`, alimentado
pela mesma fachada.

## Ambiente

O `origin` é `DigiThree-Products/nbrasa-institucional`, e a integração é por
pull request em `main`, uma branch por assunto (`espiral-no-cardapio`,
`labaredas-no-acende`, `copy-hero`). Nenhuma branch de trabalho foi apagada
depois do merge, então `git branch -r` lista bem mais coisa do que está viva.

`.env.example` → `.env.local` (nunca commitado; o `.gitignore` cobre padrões
amplos de propósito porque o Bloco de Notas do Windows acrescenta `.txt` sem
avisar, e o Next só lê `.env.local`). As mesmas variáveis precisam existir na
Vercel marcadas em Production/Preview/Development: sem elas o build falha ao
coletar as páginas, não em runtime.

**Screenshot de conferência tirado na raiz entra no commit por descuido.** O
`.gitignore` só cobre `nbrasa-*.png`, e três capturas de outra rodada já estão
versionadas (`layout-telas.png`, `preview-1440.png`, `preview-check.png`).
Grave a captura com o prefixo `nbrasa-`, ou fora do repositório, como manda a
regra dos intermediários de marca.

**Há um worktree parado dentro do repositório e ele engana busca por `grep -r`.**
`.claude/worktrees/espiral-cardapio` é um worktree travado na branch
`espiral-no-cardapio`, com cópia completa de `app/`, `components/`, `lib/` e
`tests/`, mais um `node_modules` próprio. O `.gitignore` o cobre, então as
ferramentas que respeitam ignore (Grep, Glob, ripgrep) não o enxergam, mas um
`grep -r` ou um `find` disparado da raiz devolve dois `Hero.tsx`, e o segundo é
código de outra branch. Ao buscar pelo shell, aponte para `app components lib
tests` em vez da raiz.

**Confira em qual dos dois você está antes da primeira edição.** Os dois têm
`CLAUDE.md`, `package.json` e suíte completa, e o da raiz nem sempre está em
`main`: em 2026-09-10 ele estava na branch `labaredas-no-acende`. `git worktree
list` diz de uma vez os dois caminhos e as duas branches. Editar o arquivo certo
na cópia errada é o modo de errar aqui, e nada lança quando acontece.

## Identidade visual e conteúdo

Paleta oficial (valores exatos, do moodboard):

| Cor | Hex |
|---|---|
| Carvão | `#241e1f` |
| Vermelho brasa (destaque) | `#cf2434` |
| Branco | `#ffffff` |

**A página é clara.** O fundo padrão do `body` é branco e o carvão virou a cor
do texto; `creme` é a superfície dos cards sobre esse branco. Duas seções
fogem disso, e só duas: a Delivery, que é a **única faixa de cor saturada**, e
as avaliações, que desde 2026-09-10 são foto com véu de carvão. Nas duas o
texto é claro, e nas duas o par de cores está medido em `contraste.test.ts`.
Desde 2026-09-04 a Delivery é `bg-brasa text-branco`,
não mais carvão, com uma `DivisoriaCurva` na entrada e outra na saída (a de
saída precisa de `corOrigem`, senão a metade de cima da curva vira branco).

Consequência prática, medida e testada: **sobre `#cf2434` só o branco passa AA
para texto normal** (5,31:1). Carvão fica em 3,09:1 e só vale para display
grande e grafismo, que é o que autoriza o `N’brasando`, a parede de tipos, o
traço da rota e o corpo do mascote. A hierarquia secundária da seção vem de
corpo, peso e tracking, não de cor, porque não existe cinza intermediário que
passe AA sobre esse vermelho. `brasa-funda` (`#8a1a24`) é a superfície dos
blocos dentro da faixa. Os tokens `cinza`, `fumaca` e `brasa-texto` foram
removidos: existiam só para a faixa escura e reprovavam sobre o vermelho. Todo
rótulo pequeno vermelho sobre superfície clara continua usando
`--color-brasa-escura` (`#b81f2c`), porque o `brasa` puro faz 4,30:1 sobre
creme e reprova AA.

Os demais tokens (`--color-brasa-escura`, `--color-creme`, …) são derivados
criados para atender contraste, não invente novos sem passar pelo teste.

Tipografia, **três** famílias carregadas e as três em uso, cada uma com um
papel fechado. Duas são locais, a Owners
(`app/fontes/owners-xnarrow-black.woff2`) e a Combust
(`app/fontes/combust.woff2`), ambas por `localFont`; só a Hanken vem do
Google. As três entram em `app/layout.tsx` e viram os tokens de `--font-*` do
`@theme`.

| Papel | Família | Token | Onde |
|---|---|---|---|
| Display | Owners XNarrow Black | `font-display` | todo título de seção, wordmark, marquee |
| Corpo | Hanken Grotesk (Google) | `font-corpo` | todo o resto, **e** a abertura e o fecho do título do herói |
| Foco | Combust | `font-foco` | uma palavra só: o foco do título do herói, que é onde estão as chamas |

**Não existe `font-display-leve`, nem Owners Light**: a trial servida tem uma
face só, a Black. É por isso que a abertura e o fecho do título do herói
("sua fome" e "aqui.") saem em `font-corpo`, e não em `font-display` como o
resto dos títulos de seção: pedido do cliente para essas duas linhas ficarem
com traço mais fino que o do foco, e sem um peso Light licenciado da Owners a
única forma de fazer isso de verdade é a Hanken, que é fonte variável. É a
única exceção à regra "todo título de display usa Owners", documentada em
`components/sections/Hero.tsx` junto de `APOIO`.

O peso dessas duas linhas é **400**, e já foi 300. O cliente pediu o traço um
pouco mais grosso em 2026-09-09, junto com um corpo cerca de 9% menor, depois
de ver o título com a Combust: o foco engordou de aparência ao trocar de
família e o apoio em `font-light` tinha ficado fino demais ao lado dele. Os
dois `clamp` de `--corpo-apoio` carregam essa redução. A Anton, que era
substituta provisória, saiu em 2026-09-04. Versões anteriores deste arquivo
nomeavam uma "Authentic Signature" no papel de desenhada: ela nunca chegou ao
código.

**A linhagem do foco**: Yellowtail até 2026-09-08, Kaushan Script no lugar
dela, Owners XNarrow Black na branch das labaredas, e **Combust desde
2026-09-09**. O papel "desenhada" e a Kaushan saíram do `layout.tsx` e do
`@theme` na mesma troca: estavam órfãos desde que o foco voltou para uma
letra reta, e eram webfont do Google baixada à toa.

O `DOMINANTE` voltou a ter **compensação ótica**, um `-ml` de 0,01 em. A
Combust é irregular e recua a tinta 0,0135 em da borda da caixa, contra
0,0142 em da Hanken, e como os dois corpos são muito diferentes o foco entra
cerca de 2px mais que a abertura. O valor exato varia de 0,0090 a 0,0102 em ao
longo dos `clamp`, então um número só erra menos de 0,1px em toda a faixa. É o
mesmo tipo de acerto que existia na fonte inclinada e que tinha saído quando o
foco virou Owners.

Trocar a família do foco segue exigindo remedir os **dois** `clamp` do
`DOMINANTE` em `Hero.tsx` (o base e o do `lg`, separados porque abaixo e acima
de 1024px o título vive em layouts diferentes) e conferir os dois de
`--corpo-apoio`. Medido nesta troca: "ACENDE" mede 2,325 em na Owners e
2,541 em na Combust, e os `clamp` foram multiplicados por 0,915, que é a razão
entre as duas, o que devolveu à palavra exatamente a largura que ela tinha na
coluna, 565px em 1440.

A Owners servida é a **versão TRIAL**, licenciada como "Personal Use Only": o
cliente decidiu publicar assim e a compra está registrada como pendência no
`README.md`. Ela tem **72 code points mapeados, sem nenhuma letra acentuada e
sem apóstrofo reto** (o número que `owners.test.ts` fixa; o OTF traz uma
subtabela Macintosh que mapeia tab e CR para o glifo de espaço, e ela não
conta, porque não é a que o navegador usa), e por isso a grafia da marca no
site usa a aspa curva (`n’Brasa`, `N’brasando`). `tests/unit/owners.test.ts` lê o `cmap` do OTF e falha se
qualquer string de display usar glifo ausente; todo título de display novo
escrito direto na JSX ganha uma linha em `LITERAIS_DE_DISPLAY` lá. É por causa
disso que os links do `MenuMobile` e as etiquetas de bairro da rota usam fonte
de corpo: "Cardápio", "Programação" e "Japuíba" não se reescrevem.

XNarrow é a largura escolhida por medição: a caixa alta da Owners é 0,700 em
contra 0,859 em da Anton, então **todo corpo de display carrega o fator
1,227**. Com ele, a XNarrow ocupa 103% da largura que a Anton ocupava e os
`clamp` do layout continuam valendo. O WOFF2 sai de
`python scripts/gerar-owners.py`. Não troque a família nem a largura sem avisar.

**Horários** (confirmados pelo cliente em 2026-09-02, valem sobre qualquer
outra fonte): terça a quinta e domingo 14h às 22h; sexta e sábado 16h às 03h; segunda
fechado. O folder impresso em `apresentação site/` traz horários diferentes e
está **desatualizado**, não "corrija" o site com base nele.

Assinatura: **"O sabor que encontra, o som."** Slogans aprovados e
reutilizáveis: `vamos N'brasar?` · `feel the fire` · `VAI N'BRASANDO` ·
`A fome acende aqui.` · `Vem sentir a vida acontecer de gole em gole.` O verbo
inventado "N'brasar" é central na marca, mantenha o apóstrofo e a grafia
exatos em qualquer texto novo.

Elementos gráficos: wordmark manuscrito `n’Brasa` em anel circular com chama
(o anel e o nome ainda são reproduzidos em fonte, falta o vetor do selo);
mascote chama antropomórfica de óculos escuros; grafismo de curvas de nível
concêntricas.

**Existem duas chamas em `lib/marca.ts`, de propósito.** `D_CHAMA_OFICIAL` vem
de `fotos-site/logo.svg` e são três pinceladas afiladas e separadas: é a marca
de verdade, usada como ícone no header e no rodapé e como marca d'água.
`D_SILHUETA` é uma gota sólida desenhada à mão, não é a logo: a máscara
do herói (`lib/costura.ts`) monta a borda da foto pela união dessa forma com um
retângulo, e uma forma aberta em três traços viraria fitas rasgadas ali; o
mascote também precisa do corpo sólido para apoiar óculos e boca. Não unifique
as duas, há teste em `tests/unit/costura.test.ts` que impede. A chama oficial é
468×684, bem mais alta que larga: quem dimensionar a `Chama` usa
`PROPORCAO_OFICIAL`, senão o SVG encolhe para caber e sobra vão.

## Ativos de marca (fora do controle de versão)

Tudo em `apresentação site/` (~85 MB, no `.gitignore`) e `fotos-site/` (~34 MB).
Nenhum é texto:

| Arquivo | Conteúdo |
|---|---|
| `moodboard-nbrasa-2025.pdf` | 6 pág., manual de marca: logo, paleta, tipografia, grafismos, mascote, navegação |
| `apresentação - folder - nbrasa.pdf` | 5 pág., folder impresso (horários desatualizados) |
| `N'brasa adesivos.pdf` | cartela de adesivos |
| `IMG_3643.png` | foto da fachada, 4892×7732 (32 MB) |
| `centro.png`, `praia do anil.png`, `praia grande.png`, `pontal.png`, `verolme.png` | as cinco paradas da rota, 14 MB no total, entrada de `scripts/gerar-paradas.py` |
| `mascote.cdr` | vetor editável do mascote |

`pdftoppm`/poppler não está instalado; o Python 3.13 local tem **PyMuPDF
(`fitz`)**, `pypdf`, `pdfminer` e **Pillow**, use `fitz` para extrair texto e
rasterizar páginas. Os cinco scripts de `scripts/` se dividem entre esses dois
mundos: os de imagem e favicon pedem só Pillow, e os de fonte
(`gerar-owners.py`, `gerar-combust.py`) pedem **fonttools e brotli**, sem os
quais não sai WOFF2. O `.cdr` é binário proprietário: nenhuma ferramenta local
abre, peça um export em SVG/PNG. Grave intermediários fora do repositório, não
ao lado dos ativos.

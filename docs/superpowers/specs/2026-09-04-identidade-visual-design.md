# Identidade visual do N'Brasa, aplicação dos ativos de marca

Data: 2026-09-04
Estado: aprovado, pronto para virar plano de implementação
Spec anterior: `2026-09-02-site-nbrasa-design.md`, que este documento estende

## 1. Contexto e objetivo

O site foi construído com ativos provisórios: a fonte de display é a Anton do
Google Fonts fazendo as vezes da Owners, a chama da marca é um path desenhado
à mão, o herói mostra uma foto estática e a faixa da Delivery é carvão liso.

O cliente entregou a pasta `fotos-site/` com os ativos reais. Este documento
define quais deles entram, como entram, e o que cada um quebra no caminho.

Objetivo: trocar os provisórios pelos ativos de marca sem perder o orçamento
de performance, sem reprovar em contraste e sem redesenhar layout já aprovado.

## 2. Inventário dos ativos

Tudo em `fotos-site/`, que está no `.gitignore`.

| Arquivo | Conteúdo | Destino |
|---|---|---|
| `logo.svg` | chama oficial em vetor, dois paths, viewBox 468,1×684,1, `#cf2434` | ícone da marca |
| `owners-font-family/` | 82 OTFs da Owners, versão TRIAL | fonte de display |
| `video-fachada.mp4` | 1280×720, 4,4 s, 1,05 MB, com faixa de áudio | herói |
| `apresentação - material delivery - nbrasa.pdf` | 85 MB, 1 página, sistema visual do delivery | Delivery e Cardápio |
| `DSC09057.jpg`, `DSC09774.jpg`, `DSC09797.jpg` | fotos da casa, alta resolução | fora do escopo |
| `bolinho_costela@4x.png`, `fking_cheddar@4x.png` | recortes de produto com transparência | fora do escopo |
| `vertical-shot-...utc.jpg` | gin tônica, banco de imagens | fora do escopo |

O PDF do delivery rende seis elementos reutilizáveis: papel kraft, chama
vermelha gigante subindo pela lateral, `feel the fire` empilhado em três
linhas e em caixa baixa, uma parede de tipos com `FIRE`, `N'BRASA` e
`VAI N'BRASANDO` repetidos e girados, o mascote chama de óculos escuros
comendo um burger, e o selo circular em padrão sobre papel branco.

## 3. Decisões tomadas com o cliente

1. A Owners TRIAL será usada apesar da licença `Personal Use Only`. A compra
   da licença de webfont fica registrada como pendência no `README.md`.
2. O vídeo da fachada substitui a foto do herói, dentro do recorte em chama.
3. As fotos de produto ficam fora desta leva.
4. Os cards do Cardápio recebem a textura gráfica do material de delivery.
5. A faixa da Delivery passa de carvão para vermelho `#cf2434` chapado.
6. A largura de display é a Owners XNarrow Black.

## 4. Tipografia

### 4.1 O charset da TRIAL tem 74 glifos

O `cmap` dos OTFs contém apenas:

```
espaço ! , . 0-9 ? @ A-Z a-z ‘ ’ “ ”
```

Não há **nenhuma letra acentuada**, nem `ç`, nem apóstrofo reto `'`, nem
hífen, nem dois pontos, nem barra, nem parênteses. Existe a aspa curva `’`
(U+2019), que é o que a marca usa em `n’Brasa`.

Os seis nomes de categoria ativos (`Burgers`, `Espetinhos`, `Carnes Nobres`,
`Petiscos`, `Drinks`, `Sobremesas`) passam limpos. Mas qualquer título de
display novo com acento renderiza metade em Owners e metade no fallback, no
meio da palavra, e ninguém percebe até estar em produção.

Mitigação, em duas camadas:

- `tests/unit/owners.test.ts` lê o `cmap` do OTF e falha se qualquer string
  que chega a um elemento de display (título do herói, títulos de seção,
  nomes de categoria, kickers, nomes de bairro da rota) usar um glifo ausente.
  O teste importa as strings de `lib/conteudo.seed.ts`, que já é a fixture
  dos unitários, então conteúdo novo cadastrado no seed é coberto de graça.
- Anton continua importada por `next/font/google` e declarada como fallback
  em `--font-display`, para que um glifo que escape apareça em outra fonte em
  vez de virar caixa vazia. Manter a importação é quase de graça: o
  `@font-face` gerado traz `unicode-range`, então o navegador só baixa o
  arquivo se algum caractere de fato cair nele, que é justamente o caso que
  se quer cobrir.

### 4.2 Escolha da largura

Medição feita com `fontTools`, comparando com o arquivo da Anton que o
`next/font` já serve em `.next/static/media/`, sobre a string `AFOMECNDQUI`,
no mesmo `font-size`:

| Face | Largura da linha | Caixa alta |
|---|---|---|
| Anton (atual) | 100% | 1760/2048 = 0,859 em |
| Owners XXNarrow Black | 61% | 700/1000 = 0,700 em |
| Owners XNarrow Black | 84% | 0,700 em |
| Owners Narrow Black | 116% | 0,700 em |
| Owners Black | 152% | 0,700 em |
| Owners XBlack | 163% | 0,700 em |

A caixa alta da Owners é 18,5% mais baixa que a da Anton no mesmo corpo. Para
que os títulos mantenham a altura óptica atual, o `font-size` de display
precisa de um fator de **1,227** (0,859 / 0,700). Aplicado o fator, a largura
efetiva de cada face vira: XXNarrow 75%, **XNarrow 103%**, Narrow 142%,
Regular 186%.

Só a XNarrow Black cai no lugar da Anton sem remexer layout. Ela é a face de
display. O fator de 1,227 entra nos três `clamp` existentes (herói, títulos de
seção, nomes de categoria) e em nenhum outro lugar.

### 4.3 Implementação

`next/font/local` apontando para um WOFF2 gerado a partir de
`OwnersTRIALXNarrow-Black`. Com 74 glifos o arquivo fica em torno de 6 kB.

A conversão vira `scripts/gerar-owners.py`, no mesmo espírito de
`scripts/gerar-fachada.py`: lê o OTF de `fotos-site/`, grava o WOFF2 em
`app/fontes/`, e é rodado só quando o arquivo de origem mudar. O destino é
`app/fontes/` e não `public/` porque `next/font/local` referencia o arquivo
por caminho de módulo e cuida do hash e do cache, enquanto um arquivo em
`public/` seria servido cru e sem essas garantias.
O script documenta no cabeçalho que a origem é a versão TRIAL e que trocar
pelos arquivos licenciados é só substituir o OTF de entrada.

`--font-display` em `app/globals.css` passa a
`var(--fonte-display), Anton, "Arial Narrow", Impact, sans-serif`.

### 4.4 Apóstrofos

`n&apos;Brasa` no `Header` e `N&apos;brasando` na `Delivery` usam apóstrofo
reto, que a Owners não tem. Passam a `n’Brasa` e `N’brasando`, com a aspa
curva. O mesmo vale para qualquer texto novo: a grafia da marca no site usa
`’`. Isso não conflita com o `CLAUDE.md`, que exige manter o apóstrofo e a
grafia, apenas fixa qual caractere é.

## 5. Marca

### 5.1 A chama oficial não substitui a silhueta

`logo.svg` é composto de três pinceladas afiladas e separadas, com vãos entre
elas. O path atual em `lib/marca.ts` é uma gota sólida. São formas diferentes,
e a diferença importa:

- `lib/costura.ts` monta a máscara do herói pela **união da silhueta sólida
  com um retângulo**. Com uma forma aberta em três traços, a união produziria
  fitas rasgadas em vez de uma borda contínua.
- `Mascote` em `components/ui/Chama.tsx` desenha óculos e boca sobre o corpo
  sólido da chama. A chama oficial não tem corpo onde apoiá-los.

Portanto:

| Constante | Origem | Consumidores |
|---|---|---|
| `D_CHAMA_OFICIAL` (novo, dois paths, viewBox 468,1×684,1) | `logo.svg` | `Chama` no Header, no Footer e nos Chips; marca d'água dos cards; marca d'água da Delivery |
| `D_SILHUETA` (renomeado de `D_CHAMA`) | desenhado à mão | `mascaraChama` em `lib/costura.ts`; `Mascote` |

`EIXO_CHAMA` continua valendo para `D_SILHUETA` e é renomeado para
`EIXO_SILHUETA`. O comentário de `lib/marca.ts` passa a explicar que existem
duas formas de propósito e por quê, para que ninguém tente unificá-las depois.

O componente `Chama` ganha o novo viewBox e renderiza os dois paths.

### 5.2 O que continua faltando

O selo circular com o wordmark manuscrito `n'Brasa` não existe em vetor. O
Header hoje o aproxima com um círculo de borda, o ícone da chama e o texto em
fonte. Isso continua. Fica registrado como pendência, junto do `.cdr` do
mascote, na seção de pendências do `README.md`.

## 6. Herói com vídeo

O `<video>` ocupa o mesmo slot que a foto ocupa hoje, dentro do
`div.costura-chama`, herdando o recorte em chama sem alteração em
`lib/costura.ts` nem no CSS da máscara.

A foto atual continua no repositório e vira o `poster`, cobrindo três casos:
a primeira pintura antes do vídeo carregar, `prefers-reduced-motion`, e
qualquer falha de decodificação.

O vídeo entra por um sexto componente de cliente, `VideoFachada`, que monta o
elemento `<video>` apenas quando as duas condições valem: `prefers-reduced-motion`
não está ativo, e a primeira pintura já aconteceu. A razão é orçamentária: o
arquivo tem 1 MB e, em CSS puro, baixaria sempre, disputando banda com o
elemento candidato a LCP e ignorando quem pediu menos movimento.

Atributos do elemento, uma vez montado: `muted`, `loop`, `playsInline` e
`autoPlay`. Não há `preload` a ajustar, porque antes das duas condições o
elemento simplesmente não existe no DOM e nada é requisitado. A faixa de áudio
do arquivo é ignorada, o vídeo é sempre mudo.

O `poster` usa o mesmo `object-position` de `AJUSTES.recorteDaFoto`, e o vídeo
também, para que a troca de um pelo outro não desloque o enquadramento.

Limitação conhecida e aceita: 720p em uma coluna de 60vw fica adequado, e o
loop de 4,4 s é perceptível. Se o cliente enviar um corte mais longo ou em
1080p, é substituir o arquivo.

## 7. Cardápio

Os cards trocam o creme chapado por duas camadas de textura vindas do PDF:

- a chama oficial como marca d'água, em `#c01f2e`, com razão de contraste
  deliberadamente baixa contra o creme, porque é textura e não texto;
- a parede de tipos (`FIRE`, `N’BRASA`, `VAI N’BRASANDO`) em marquee de CSS
  puro, sem JavaScript, com `animation-play-state: paused` sob
  `prefers-reduced-motion`.

O bento, os vãos de `VAOS` e a hierarquia de texto de cada card não mudam. Os
cards ficam preparados para receber foto sangrada quando as fotos entrarem,
sem redesenho: a foto entra como camada abaixo do texto e acima da textura.

## 8. Delivery em vermelho chapado

### 8.1 Contraste medido

Razões calculadas com a mesma fórmula de `tests/unit/contraste.test.ts`,
contra o fundo `#cf2434`:

| Cor | Razão | Veredito |
|---|---|---|
| branco `#ffffff` | 5,31:1 | passa AA para texto normal |
| creme `#f0e6dc` | 4,31:1 | só display grande |
| carvão `#241e1f` | 3,09:1 | só display grande e grafismo |
| fumaça `#2f2728` | 2,74:1 | reprova |
| cinza `#a39596` | 1,84:1 | reprova |
| brasa-texto `#ee6b76` | 1,77:1 | reprova |

**Regra que sai daí: texto corrido sobre a faixa vermelha é branco, e só
branco.** Não existe cinza intermediário que passe AA sobre esse vermelho sem
chegar tão perto do branco que deixa de ser um segundo nível. A hierarquia
secundária da seção passa a vir de corpo, peso e tracking, não de cor. Carvão
fica reservado a display grande e a grafismo.

### 8.2 Tokens

Sai `--color-cinza`, sai `--color-fumaca`, sai `--color-brasa-texto`. Os três
existiam apenas para a faixa escura, e com a faixa em vermelho ficam sem
nenhum consumidor. Nota: `--color-brasa-texto` já hoje não é usado por
componente nenhum, apenas declarado e testado.

Entra `--color-brasa-funda: #8a1a24`, superfície para os blocos dentro da
faixa. Contra o fundo brasa dá 1,75:1, o suficiente para ler como um plano
distinto sem competir; branco sobre ele dá 9,32:1.

### 8.3 Os sete pontos que quebram

| Elemento | Hoje | Passa a ser |
|---|---|---|
| kicker `Delivery` e parágrafo | `text-cinza`, 1,84:1 | `text-branco`, 5,31:1 |
| `N’brasando` no `h2` | `text-brasa`, invisível sobre si mesmo | `text-carvao`, 3,09:1, display grande |
| traço da rota em `RotaMascote` | `stroke="#cf2434"`, invisível | carvão |
| `Mascote` | `fill="#cf2434"`, some no fundo | `fill` carvão, contorno branco |
| etiqueta de bairro | `bg-brasa`, some no fundo | `bg-carvao`, borda branca mantida |
| card de parada | `bg-fumaca`, 2,74:1 | `bg-brasa-funda`, 9,32:1 para o branco |
| `Botao` dentro da seção | `bg-brasa`, some no fundo | variante nova: fundo branco, texto carvão, 16,4:1 |

A variante nova do `Botao` se chama `claro` e existe só para uso sobre
superfície de marca saturada.

### 8.4 Divisórias

As duas `DivisoriaCurva` em `app/page.tsx` trocam carvão por brasa: a de
entrada recebe `corDestino="var(--color-brasa)"`, a de saída recebe
`corOrigem="var(--color-brasa)"` e mantém `corDestino="var(--color-branco)"`.
O comentário no `page.tsx` que explica a mecânica é atualizado junto, porque
ele nomeia o carvão explicitamente.

### 8.5 Camada gráfica

Sobre o vermelho entram, do PDF: `feel the fire` empilhado em três linhas e em
caixa baixa, em carvão, no corpo de display; a chama oficial como marca d'água
em `#b81f2c`; e a parede de tipos em marquee, a mesma peça do Cardápio,
recolorida.

## 9. Testes

| Arquivo | Mudança |
|---|---|
| `tests/unit/owners.test.ts` | novo: cobertura de glifos das strings de display contra o `cmap` do OTF |
| `tests/unit/contraste.test.ts` | ganha as linhas da faixa vermelha; perde as de cinza, fumaça e brasa-texto sobre carvão |
| `tests/unit/tokens.test.ts` | ganha `--color-brasa-funda`; perde os três tokens removidos |
| e2e | herói exibe `poster` e não monta vídeo sob `prefers-reduced-motion`; marquee com `animation-play-state: paused` sob `prefers-reduced-motion`; texto da faixa vermelha presente e legível nos 5 viewports |

A regra do `CLAUDE.md` continua valendo: todo par novo de texto e fundo ganha
uma linha em `contraste.test.ts`.

## 10. Orçamento de performance

| Item | Custo | Observação |
|---|---|---|
| WOFF2 da Owners XNarrow Black | ~6 kB | 74 glifos, sem subsetting adicional necessário |
| chama oficial inline | ~1,5 kB comprimido | dois paths, substitui um path menor |
| marquee | 0 kB de JavaScript | CSS puro |
| `VideoFachada` | ~0,5 kB de JavaScript | sexto componente de cliente |
| `video-fachada.mp4` | 1,05 MB | fora do first load, montado após a primeira pintura |

O orçamento de 130 kB de first load se aplica ao JavaScript. A adição real é o
`VideoFachada`. A fonte e o vídeo são recursos separados; a fonte é pequena e
o vídeo é deliberadamente adiado.

## 11. Fora do escopo

- As cinco fotos de produto e a foto de banco de imagens. Decisão do cliente
  em 2026-09-04: as fotos ainda não sobem.
- A compra da licença de webfont da Owners.
- O selo circular e o mascote em vetor, que continuam sem arquivo de origem.
- Qualquer mudança no modelo de dados, na fachada de conteúdo ou no cache.

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Título de display novo com acento sai partido em duas fontes | `owners.test.ts` falha o build antes |
| Uso da TRIAL em produção viola a licença | pendência registrada no `README.md`; o script de conversão troca de origem em uma linha |
| Os OTFs da TRIAL ficam públicos em `/public` | é consequência aceita da decisão do cliente; o WOFF2 servido contém só os 74 glifos, não o arquivo original |
| Vermelho chapado cansa em seção longa (a Delivery tem 140dvh) | `brasa-funda` e carvão quebram o campo; validar nos 5 viewports do Playwright |
| 720p esticado ou loop curto demais no herói | poster cobre a falha; substituir o arquivo resolve sem mexer em código |

## 13. Sequenciamento sugerido

1. Tipografia: script de conversão, `next/font/local`, fator 1,227 nos clamp,
   teste de glifos, troca dos apóstrofos.
2. Marca: separar `D_CHAMA_OFICIAL` de `D_SILHUETA`, atualizar `Chama`.
3. Delivery: tokens, contraste, os sete pontos, divisórias, camada gráfica.
4. Cardápio: marca d'água e marquee, reaproveitando a camada gráfica do passo 3.
5. Herói: `VideoFachada` e poster.

A ordem coloca a mudança de maior risco de contraste antes da de menor risco,
e o vídeo por último porque é o único item independente de todos os outros.

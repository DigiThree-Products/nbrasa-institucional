# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

Site institucional do **N'Brasa** — bar, choperia e casa de carnes em Angra dos
Reis (RJ). Next.js 15 (App Router) + TypeScript + Tailwind v4, dados no
Supabase, deploy na Vercel. Uma única rota pública (`/`), toda ela Server
Components; o painel de admin (`/admin/*`) está previsto mas ainda não existe.

Documento de design completo (paleta, modelo de dados, orçamento de
performance, critérios de acessibilidade):
`docs/superpowers/specs/2026-09-02-site-nbrasa-design.md`. Pendências abertas
com o cliente: seção final do `README.md`.

**Idioma do código:** tudo em português — nomes de arquivo, funções, variáveis,
colunas do banco, comentários, mensagens de teste. Mantenha assim.

## Comandos

```bash
npm run dev                # dev server (turbopack) em localhost:3000
npm run build              # build de produção; falha se faltar variável de ambiente
npm run lint               # ESLint
npm test                   # Vitest — unitários (tests/unit), jsdom, offline
npm run test:watch
npm run e2e                # Playwright — 5 viewports, roda build+start antes
npm run test:integracao    # Vitest contra o Supabase REAL (carrega .env.local)
```

Um teste só:

```bash
npm test -- tests/unit/horarios.test.ts
npm test -- -t "agrupa"                        # por nome
npx playwright test --project=w320 -g "menu"   # e2e: um viewport, um teste
```

`npm run e2e` **sempre** roda `npm run build && npm start`
(`reuseExistingServer: false`) — não tente acelerar apontando para um dev
server já em pé; a suíte já validou build velha por causa disso.

`npm run test:integracao` exige `.env.local` preenchido e as migrations
aplicadas: ele lê o banco de verdade e afirma contagens do seed (6 categorias
ativas, 7 horários). `tests/integracao/segredos.test.ts` varre `.next/static`,
então rode um `npm run build` antes.

## Arquitetura

### A fachada de conteúdo é a única porta para o banco

`lib/conteudo.ts` exporta `getCategorias`, `getProgramacao`, `getHorarios`,
`getDepoimentos`, `getConteudo`. **Nenhuma seção fala com o Supabase
diretamente** — se precisar de um dado novo na página, o caminho é
acrescentar/estender uma função ali, não importar o cliente numa seção.

Cada função é um `unstable_cache` com uma tag de `TAGS`. Traduz snake_case do
banco para camelCase do TypeScript no `.map()` e **lança** em caso de erro
(`exigirSemErro`) em vez de devolver lista vazia: seção vazia em produção passa
despercebida, erro não.

Tipos em `lib/conteudo.tipos.ts`. `lib/conteudo.seed.ts` continua sendo a fonte
de verdade do conteúdo e a fixture dos testes unitários;
`supabase/migrations/0003_seed.sql` é a cópia dele no banco e os textos batem
caractere por caractere (inclusive o travessão em dash). Alterou um, altere o
outro.

### Cache e revalidação

`TAGS` (em `lib/conteudo.ts`) é a lista fechada de tags válidas.
`POST /api/revalidar` aceita `{ tag }` só se estiver nesse conjunto,
autenticado por `Authorization: Bearer $REVALIDATE_SECRET`. As futuras Server
Actions do painel chamarão `revalidateTag` com as mesmas constantes.

### Dois clientes Supabase, propósitos incompatíveis

- `lib/supabase/servidor.ts` — chave anônima, usado pelos Server Components via
  a fachada. O que ele enxerga é decidido pelo RLS, não por confiança no código.
  Exporta `SUPABASE_URL`/`SUPABASE_ANON_KEY` já validados (`exigir` explica onde
  cadastrar a variável faltante, local **e** na Vercel).
- `lib/supabase/admin.ts` — service role, **ignora RLS**. Marcado com
  `import "server-only"` e restrito a scripts locais. Nunca importe de `app/` ou
  `components/`: há teste de integração que falha se acontecer.

### Banco

Cinco tabelas em `supabase/migrations/`: `0001_schema.sql` (categorias,
programacao, horarios, depoimentos, conteudo — esta última linha única,
`id = 1`), `0002_rls.sql` (revoga grants, liga RLS forçado, leitura pública só
de `ativo = true`, escrita só para admin autenticado), `0003_seed.sql` (conteúdo
real). Aplicadas manualmente no projeto Supabase — SQL editor ou
`npx supabase link --project-ref <ref> && npx supabase db push`. Migrations
devem ser reentrantes: a de RLS já quebrou por ter sido aplicada pela metade.

`horarios.dia_semana` segue `Date.getDay()` (0 = domingo) e `ordem` exibe a
semana começando na segunda — domingo leva `ordem` 7. `lib/horarios.ts` agrupa
dias adjacentes com o mesmo horário ("Terça a quinta", "Sexta e sábado").

O seed inclui de propósito linhas **inativas** (categoria `chopp`, depoimento
`d4`): elas provam que o filtro de `ativo` funciona.

### Fronteira cliente/servidor

Só cinco componentes são `"use client"`: `SmoothScrollProvider`, `MenuMobile`,
`Reveal`, `RotaMascote` e `app/error.tsx`. Todo o resto é Server Component
`async` que aguarda a fachada. GSAP, ScrollTrigger e Lenis entram por
`await import()` dentro de `useEffect`, nunca no bundle inicial, e cada um
verifica `prefers-reduced-motion` antes de animar — há testes unitários e e2e
que provam que nada de conteúdo depende de animação.

### Tokens de marca

Declarados uma vez em `app/globals.css`, bloco `@theme` do Tailwind v4
(`--color-carvao`, `--color-brasa`, `--color-creme`, …), consumidos como classes
(`bg-carvao`, `text-cinza`). `tests/unit/tokens.test.ts` fixa os valores hex e
`tests/unit/contraste.test.ts` calcula a razão WCAG de cada par texto/fundo —
**todo par novo ganha uma linha lá**; um token de contraste já falhou quatro
vezes neste projeto por não ser medido contra a superfície real.

### Imagens

Os derivados web ficam versionados em `public/` (AVIF + WebP em 800 e 1400 px,
mais um JPG de 1400 como último fallback) e
saem de `python scripts/gerar-fachada.py`, que lê o original de 33 MB em
`apresentação site/` (fora do repositório). Rode só quando a foto de origem
mudar. O `Hero` embute um borrão base64 de 16 px como placeholder.

### SEO

`lib/site.ts` centraliza `SITE_URL` — **placeholder** (`nbrasa.vercel.app`),
consumido por `metadataBase`, `robots.ts` e `sitemap.ts`. `DadosEstruturados`
emite JSON-LD `Restaurant` a partir de `lib/schemaRestaurant.ts`, alimentado
pela mesma fachada.

## Ambiente

`.env.example` → `.env.local` (nunca commitado; o `.gitignore` cobre padrões
amplos de propósito porque o Bloco de Notas do Windows acrescenta `.txt` sem
avisar — e o Next só lê `.env.local`). As mesmas variáveis precisam existir na
Vercel marcadas em Production/Preview/Development: sem elas o build falha ao
coletar as páginas, não em runtime.

## Identidade visual e conteúdo

Paleta oficial (valores exatos, do moodboard):

| Cor | Hex |
|---|---|
| Carvão | `#241e1f` |
| Vermelho brasa (destaque) | `#cf2434` |
| Branco | `#ffffff` |

**A página é clara.** O fundo padrão do `body` é branco e o carvão virou a cor
do texto; `creme` é a superfície dos cards sobre esse branco. A **Delivery é a
única faixa de cor saturada**, e desde 2026-09-04 ela é `bg-brasa text-branco`,
não mais carvão, com uma `DivisoriaCurva` na entrada e outra na saída (a de
saída precisa de `corOrigem`, senão a metade de cima da curva vira branco).

Consequência prática, medida e testada: **sobre `#cf2434` só o branco passa AA
para texto normal** (5,31:1). Carvão fica em 3,09:1 e só vale para display
grande e grafismo, que é o que autoriza o `N’brasando`, o `feel the fire`, o
traço da rota e o corpo do mascote. A hierarquia secundária da seção vem de
corpo, peso e tracking, não de cor, porque não existe cinza intermediário que
passe AA sobre esse vermelho. `brasa-funda` (`#8a1a24`) é a superfície dos
blocos dentro da faixa. Os tokens `cinza`, `fumaca` e `brasa-texto` foram
removidos: existiam só para a faixa escura e reprovavam sobre o vermelho. Todo
rótulo pequeno vermelho sobre superfície clara continua usando
`--color-brasa-escura` (`#b81f2c`), porque o `brasa` puro faz 4,30:1 sobre
creme e reprova AA.

Os demais tokens (`--color-brasa-escura`, `--color-creme`, …) são derivados
criados para atender contraste — não invente novos sem passar pelo teste.

Tipografia: **Owners XNarrow Black** (display) e **Hanken Grotesk** (corpo). A
Anton, que era substituta provisória, saiu em 2026-09-04.

A Owners servida é a **versão TRIAL**, licenciada como "Personal Use Only": o
cliente decidiu publicar assim e a compra está registrada como pendência no
`README.md`. Ela tem **73 glifos, sem nenhuma letra acentuada e sem apóstrofo
reto**, e por isso a grafia da marca no site usa a aspa curva (`n’Brasa`,
`N’brasando`). `tests/unit/owners.test.ts` lê o `cmap` do OTF e falha se
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
outra fonte): terça a quinta e domingo 14h–22h; sexta e sábado 16h–03h; segunda
fechado. O folder impresso em `apresentação site/` traz horários diferentes e
está **desatualizado** — não "corrija" o site com base nele.

Assinatura: **"O sabor que encontra, o som."** Slogans aprovados e
reutilizáveis: `vamos N'brasar?` · `feel the fire` · `VAI N'BRASANDO` ·
`A fome acende aqui.` · `Vem sentir a vida acontecer de gole em gole.` O verbo
inventado "N'brasar" é central na marca — mantenha o apóstrofo e a grafia
exatos em qualquer texto novo.

Elementos gráficos: wordmark manuscrito `n’Brasa` em anel circular com chama
(o anel e o nome ainda são reproduzidos em fonte, falta o vetor do selo);
mascote chama antropomórfica de óculos escuros; grafismo de curvas de nível
concêntricas.

**Existem duas chamas em `lib/marca.ts`, de propósito.** `D_CHAMA_OFICIAL` vem
de `fotos-site/logo.svg` e são três pinceladas afiladas e separadas: é a marca
de verdade, usada como ícone no header, no rodapé, nos chips e como marca
d'água. `D_SILHUETA` é uma gota sólida desenhada à mão, não é a logo: a máscara
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
| `moodboard-nbrasa-2025.pdf` | 6 pág. — manual de marca: logo, paleta, tipografia, grafismos, mascote, navegação |
| `apresentação - folder - nbrasa.pdf` | 5 pág. — folder impresso (horários desatualizados) |
| `N'brasa adesivos.pdf` | cartela de adesivos |
| `IMG_3643.png` | foto da fachada, 4892×7732 (32 MB) |
| `mascote.cdr` | vetor editável do mascote |

`pdftoppm`/poppler não está instalado; o Python 3.13 local tem **PyMuPDF
(`fitz`)**, `pypdf`, `pdfminer` e **Pillow** — use `fitz` para extrair texto e
rasterizar páginas. O `.cdr` é binário proprietário: nenhuma ferramenta local
abre, peça um export em SVG/PNG. Grave intermediários fora do repositório, não
ao lado dos ativos.

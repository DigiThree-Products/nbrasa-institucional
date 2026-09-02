# Site público N'Brasa — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o site institucional público do N'Brasa Angra, completo e navegável, rodando contra dados semeados — pronto para a validação do cliente no preview local.

**Architecture:** Next.js 15 com App Router. Tudo é Server Component por padrão; apenas um punhado de componentes é cliente. Todo acesso a dados passa por uma fachada tipada única (`lib/conteudo.ts`) que hoje lê de um seed e depois passa a ler do Supabase sem que nenhuma seção da página mude.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Lenis, GSAP (ScrollTrigger + MotionPathPlugin), Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-02-site-nbrasa-design.md`

**Referência visual:** `docs/superpowers/specs/mockup-direcao-visual.html` — mockup aprovado pelo cliente. Abra no navegador ao implementar qualquer seção; é a fonte de verdade de espaçamento, escala tipográfica e composição.

## Escopo deste plano

Cobre os passos 1 a 3 do §11 do spec: scaffold, site público completo contra seed, e entrega para validação local.

**Não cobre** — vira um segundo plano, escrito depois da validação: migrations e RLS do Supabase, ligação do `lib/conteudo.ts` ao banco, painel de admin, e deploy na Vercel. O §11 do spec define a validação do cliente como portão, e o retorno dessa validação pode alterar o que vem depois.

## Global Constraints

Requisitos válidos para **todas** as tarefas. Valores copiados literalmente do spec.

- **Cores.** `--carvao: #241e1f` · `--brasa: #cf2434` · `--branco: #ffffff` · `--brasa-texto: #e8505f` · `--fumaca: #2f2728` · `--cinza: #a39596` · `--creme: #f0e6dc`
- **Regra de contraste, inegociável.** `#cf2434` só em preenchimento, botão, rota e display grande. **Texto pequeno vermelho sobre fundo escuro usa `#e8505f`.** O `#cf2434` sobre `#241e1f` dá 3,1:1 e reprova texto normal.
- **Tipografia.** Corpo e interface: **Hanken Grotesk**. Display: **Anton** (substituta provisória da Owners, que é comercial). Ambas via `next/font`.
- **Fronteira cliente.** Levam `"use client"` apenas: `SmoothScrollProvider`, `MenuMobile`, `Reveal`, `RotaMascote` e `Preloader`. Qualquer outro componente cliente é violação e deve ser rejeitado na revisão.
- **Orçamento.** JS de primeira carga na home ≤ **130 KB gzip**, com o GSAP fora desse total. LCP ≤ **2,0 s** em 4G simulado. CLS < **0,05**. Lighthouse mobile Performance ≥ **90**.
- **Movimento reduzido.** `prefers-reduced-motion: reduce` desliga scrub e reveals; nenhum conteúdo pode depender de animação para existir.
- **Copy.** O verbo "N'brasar" mantém apóstrofo e grafia exatos. Assinatura: "O sabor que encontra, o som."
- **Horários** (bio do Instagram, confirmados pelo cliente): segunda **fechado**; terça a quinta **14h–22h**; sexta e sábado **16h–03h**; domingo **14h–22h**.
- **Categorias** (as 6 do site atual): Burgers, Espetinhos, Carnes Nobres, Petiscos, Drinks, Sobremesas.
- **Contato:** Av. Júlio Maria, 235 — Centro, Angra dos Reis, RJ, 23900-504 · (24) 3364-5253 · @nbrasaangra
- **Git.** Commits locais a cada tarefa. **Nenhum `git push` até a validação do cliente** (§11 do spec).

---

## Estrutura de arquivos

```
app/
  layout.tsx              raiz: fontes, Preloader, SmoothScrollProvider, metadata
  page.tsx                home: compõe as seções, sem lógica
  globals.css             tokens Tailwind v4 (@theme), CSS do Lenis, base
  error.tsx               fallback de erro da rota
  not-found.tsx           404
components/
  layout/Header.tsx       server
  layout/MenuMobile.tsx   CLIENTE
  layout/Footer.tsx       server
  motion/SmoothScrollProvider.tsx  CLIENTE — Lenis
  motion/Reveal.tsx                CLIENTE — reveal de scroll
  motion/Preloader.tsx             CLIENTE — painel de abertura
  sections/Hero.tsx
  sections/ChipsCategorias.tsx
  sections/Cardapio.tsx
  sections/Delivery.tsx            server, envolve a rota
  sections/RotaMascote.tsx         CLIENTE — GSAP MotionPath
  sections/HorariosProgramacao.tsx
  sections/Depoimentos.tsx
  sections/OndeEstamos.tsx
  seo/DadosEstruturados.tsx
  ui/Botao.tsx            link ou botão, variantes solido/fantasma
  ui/Chama.tsx            SVG da chama e do mascote
  ui/DivisoriaCurva.tsx   divisória "jelly"
lib/
  conteudo.tipos.ts       tipos do domínio
  conteudo.seed.ts        dados semeados
  conteudo.ts             fachada: única porta de acesso a dados
  horarios.ts             agrupamento e formatação de horário
tests/
  unit/                   Vitest
  e2e/                    Playwright
```

---

### Task 1: Scaffold, tokens de marca e fontes

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `vitest.config.ts`, `tests/setup.ts`

**Interfaces:**
- Consumes: nada
- Produces: tokens Tailwind `bg-carvao`, `text-brasa`, `text-brasa-texto`, `bg-fumaca`, `text-cinza`, `bg-creme`; classes `font-display` e `font-corpo`; `npm test` e `npm run dev` funcionando.

- [ ] **Step 1: Gerar o projeto numa pasta temporária**

`create-next-app` aborta em diretório não-vazio, e esta pasta já tem `CLAUDE.md`, `docs/`, `.claude/` e os ativos de marca. Por isso: gerar fora e mover.

```bash
npx create-next-app@latest _scaffold --typescript --tailwind --app --no-src-dir --eslint --import-alias "@/*" --use-npm --yes
cp -r _scaffold/. .
rm -rf _scaffold
git checkout -- .gitignore   # preserva o .gitignore do repositório
```

- [ ] **Step 2: Instalar dependências**

```bash
npm i lenis gsap
npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Configurar o Vitest**

Criar `vitest.config.mts` (extensão `.mts` para declarar ESM explicitamente e evitar o aviso do Vitest 4 sobre `configLoader: 'native'`; usa `import.meta.dirname`, disponível a partir do Node 20.11/21.2):

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
  resolve: { alias: { "@": import.meta.dirname } },
});
```

Criar `tests/setup.ts`. O `afterEach(cleanup)` é obrigatório: o Testing Library só
registra a limpeza automática sozinho quando encontra um `afterEach` global, e esta
config não liga `test.globals`. Sem ele o DOM vaza entre testes do mesmo arquivo e
qualquer arquivo com mais de um `render()` falha com `getMultipleElementsFoundError`.

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

Adicionar em `package.json`, dentro de `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"e2e": "playwright test"
```

- [ ] **Step 4: Escrever o teste que falha — tokens de marca**

O teste lê o CSS e confirma que os sete tokens do spec estão declarados com os valores exatos, protegendo contra alguém "ajustar" a cor da marca sem passar pelo spec.

Criar `tests/unit/tokens.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");

describe("tokens de marca", () => {
  it.each([
    ["--color-carvao", "#241e1f"],
    ["--color-brasa", "#cf2434"],
    ["--color-brasa-texto", "#e8505f"],
    ["--color-fumaca", "#2f2728"],
    ["--color-cinza", "#a39596"],
    ["--color-creme", "#f0e6dc"],
    ["--color-branco", "#ffffff"],
  ])("declara %s como %s", (token, valor) => {
    expect(css).toMatch(new RegExp(`${token}\\s*:\\s*${valor}`));
  });
});
```

- [ ] **Step 5: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — os tokens ainda não existem em `app/globals.css`.

- [ ] **Step 6: Escrever o `globals.css`**

Substituir todo o conteúdo de `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-carvao: #241e1f;
  --color-brasa: #cf2434;
  --color-brasa-texto: #e8505f;
  --color-fumaca: #2f2728;
  --color-cinza: #a39596;
  --color-creme: #f0e6dc;
  --color-branco: #ffffff;

  --font-display: var(--fonte-display), "Arial Narrow", Impact, sans-serif;
  --font-corpo: var(--fonte-corpo), system-ui, -apple-system, sans-serif;
}

/* CSS oficial do Lenis — obrigatório para o scroll suave funcionar */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-smooth iframe { pointer-events: none; }

body {
  background: var(--color-carvao);
  color: var(--color-branco);
  font-family: var(--font-corpo);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

:focus-visible {
  outline: 3px solid var(--color-brasa);
  outline-offset: 3px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — 7 asserções verdes.

- [ ] **Step 8: Ligar as fontes no layout raiz**

Substituir `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Hanken_Grotesk, Anton } from "next/font/google";
import "./globals.css";

const corpo = Hanken_Grotesk({
  subsets: ["latin"], display: "swap", variable: "--fonte-corpo",
});
// Anton é substituta provisória da Owners (comercial). Ver §10 do spec.
const display = Anton({
  subsets: ["latin"], weight: "400", display: "swap", variable: "--fonte-display",
});

export const metadata: Metadata = {
  title: "N'Brasa Angra | Chopperia e Carnes na Av. Júlio Maria",
  description:
    "Bar com atrações musicais, chopp gelado, burguers, espetos e petiscos no Centro de Angra dos Reis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Página provisória para conferir a base**

Substituir `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-[1280px] px-6 py-24">
      <h1 className="font-display text-6xl uppercase leading-none">
        A fome acende <span className="text-brasa">aqui.</span>
      </h1>
      <p className="mt-6 text-cinza">Base do projeto no ar.</p>
    </main>
  );
}
```

- [ ] **Step 10: Conferir visualmente**

Run: `npm run dev`, abrir `http://localhost:3000`
Expected: fundo quase preto, título em Anton com "aqui." em vermelho, apoio em cinza quente.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js com tokens de marca e fontes"
```

---

### Task 2: Camada de dados — tipos, seed e fachada

**Files:**
- Create: `lib/conteudo.tipos.ts`, `lib/conteudo.seed.ts`, `lib/conteudo.ts`
- Test: `tests/unit/conteudo.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - Tipos `Categoria`, `ItemProgramacao`, `Horario`, `Depoimento`, `Conteudo`
  - `getCategorias(): Promise<Categoria[]>` — só `ativo`, ordenado por `ordem`
  - `getProgramacao(): Promise<ItemProgramacao[]>` — idem
  - `getHorarios(): Promise<Horario[]>` — 7 itens, ordenado por `ordem`
  - `getDepoimentos(): Promise<Depoimento[]>` — idem
  - `getConteudo(): Promise<Conteudo>`

- [ ] **Step 1: Escrever os tipos**

Criar `lib/conteudo.tipos.ts`:

```ts
export type Categoria = {
  slug: string;
  nome: string;
  kicker: string;
  descricao: string;
  fotoPath: string | null;
  ordem: number;
  ativo: boolean;
};

export type ItemProgramacao = {
  id: string;
  diasLabel: string;
  titulo: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
};

/** diaSemana segue Date.getDay(): 0 = domingo … 6 = sábado.
 *  ordem controla a exibição, com a semana começando na segunda. */
export type Horario = {
  diaSemana: number;
  abre: string | null;
  fecha: string | null;
  fechado: boolean;
  ordem: number;
};

export type Depoimento = {
  id: string;
  texto: string;
  autor: string;
  nota: number;
  ordem: number;
  ativo: boolean;
};

export type Conteudo = {
  heroTitulo: string;
  heroSubtitulo: string;
  telefone: string;
  endereco: string;
  cidadeUf: string;
  cep: string;
  whatsappUrl: string;
  ifoodUrl: string;
  instagram: string;
  campanhaAtiva: boolean;
  campanhaTitulo: string;
};
```

- [ ] **Step 2: Escrever o teste que falha**

Criar `tests/unit/conteudo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  getCategorias, getProgramacao, getHorarios, getDepoimentos, getConteudo,
} from "@/lib/conteudo";

describe("getCategorias", () => {
  it("devolve as 6 categorias do spec, na ordem", async () => {
    const cats = await getCategorias();
    expect(cats.map((c) => c.nome)).toEqual([
      "Burgers", "Espetinhos", "Carnes Nobres", "Petiscos", "Drinks", "Sobremesas",
    ]);
  });

  it("omite categorias inativas", async () => {
    expect((await getCategorias()).every((c) => c.ativo)).toBe(true);
  });
});

describe("getHorarios", () => {
  it("devolve os 7 dias da semana", async () => {
    expect(await getHorarios()).toHaveLength(7);
  });

  it("marca segunda como fechado", async () => {
    const seg = (await getHorarios()).find((h) => h.diaSemana === 1)!;
    expect(seg.fechado).toBe(true);
  });

  it("abre terça às 14h e fecha às 22h", async () => {
    const ter = (await getHorarios()).find((h) => h.diaSemana === 2)!;
    expect(ter).toMatchObject({ abre: "14:00", fecha: "22:00", fechado: false });
  });

  it("fecha sábado às 03h da manhã seguinte", async () => {
    const sab = (await getHorarios()).find((h) => h.diaSemana === 6)!;
    expect(sab).toMatchObject({ abre: "16:00", fecha: "03:00" });
  });

  it("ordena com a semana começando na segunda", async () => {
    const dias = (await getHorarios())
      .sort((a, b) => a.ordem - b.ordem).map((h) => h.diaSemana);
    expect(dias).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe("getConteudo", () => {
  it("traz o contato real do estabelecimento", async () => {
    const c = await getConteudo();
    expect(c.telefone).toBe("(24) 3364-5253");
    expect(c.endereco).toBe("Av. Júlio Maria, 235 — Centro");
    expect(c.cep).toBe("23900-504");
    expect(c.instagram).toBe("@nbrasaangra");
  });

  it("nasce com a campanha desligada", async () => {
    expect((await getConteudo()).campanhaAtiva).toBe(false);
  });
});

describe("getProgramacao e getDepoimentos", () => {
  it("trazem os quatro dias temáticos, ordenados", async () => {
    expect((await getProgramacao()).map((i) => i.titulo)).toEqual([
      "Noite do Espetinho", "Burger Preço Único", "DJ na Casa", "Tarde na Orla",
    ]);
  });

  it("trazem depoimentos ativos com nota entre 1 e 5", async () => {
    const d = await getDepoimentos();
    expect(d.length).toBeGreaterThan(0);
    expect(d.every((x) => x.nota >= 1 && x.nota <= 5 && x.ativo)).toBe(true);
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test -- conteudo`
Expected: FAIL — `lib/conteudo` não existe.

- [ ] **Step 4: Escrever o seed**

Dados reais levantados do material do cliente; estas mesmas linhas irão para as migrations no plano seguinte. Criar `lib/conteudo.seed.ts`:

```ts
import type {
  Categoria, ItemProgramacao, Horario, Depoimento, Conteudo,
} from "./conteudo.tipos";

export const categoriasSeed: Categoria[] = [
  { slug: "burgers", nome: "Burgers", kicker: "O mais pedido da casa",
    descricao: "Blend suculento selado na chapa, pão com a marca da casa e a nossa geleia de pimenta que vira assunto na mesa.",
    fotoPath: null, ordem: 1, ativo: true },
  { slug: "espetinhos", nome: "Espetinhos", kicker: "Combina com chopp gelado",
    descricao: "Cortes selecionados e grelhados, farofa artesanal e vinagrete fresquinho. Simples, generoso e perfeito com chopp.",
    fotoPath: null, ordem: 2, ativo: true },
  { slug: "carnes-nobres", nome: "Carnes Nobres", kicker: "Nossa porção premium",
    descricao: "Iscas de carne nobre na chapa, fritas douradas e molho de blue cheese cremoso. Porção farta servida na tábua.",
    fotoPath: null, ordem: 3, ativo: true },
  { slug: "petiscos", nome: "Petiscos", kicker: "Feito para compartilhar",
    descricao: "Porções fartas para dividir (ou não): carne na chapa, fritas douradas e acompanhamentos que ninguém deixa sobrar.",
    fotoPath: null, ordem: 4, ativo: true },
  { slug: "drinks", nome: "Drinks", kicker: "Autorais da casa",
    descricao: "Coquetelaria autoral com gin, frutas frescas e especiarias. Bonito de ver, difícil de tomar só um.",
    fotoPath: null, ordem: 5, ativo: true },
  { slug: "sobremesas", nome: "Sobremesas", kicker: "O final perfeito",
    descricao: "Petit gâteau com recheio quente escorrendo e sorvete cremoso. O final feliz que a sua noite merece.",
    fotoPath: null, ordem: 6, ativo: true },
];

export const programacaoSeed: ItemProgramacao[] = [
  { id: "espetinho", diasLabel: "Terça e quinta", titulo: "Noite do Espetinho",
    descricao: "Espetinhos saindo sem parar e chopp gelado para acompanhar até o fim da noite.",
    ordem: 1, ativo: true },
  { id: "burger", diasLabel: "Quarta", titulo: "Burger Preço Único",
    descricao: "Todos os burgers da casa por um preço único. Traga a turma e escolha o seu sem pensar duas vezes.",
    ordem: 2, ativo: true },
  { id: "dj", diasLabel: "Sexta e sábado", titulo: "DJ na Casa",
    descricao: "DJ comandando a pista, drinks autorais e cozinha aberta até tarde.",
    ordem: 3, ativo: true },
  { id: "orla", diasLabel: "Domingo", titulo: "Tarde na Orla",
    descricao: "Porções para dividir em família, pôr do sol na Av. Júlio Maria e chopp sempre gelado.",
    ordem: 4, ativo: true },
];

// diaSemana: 0=domingo … 6=sábado. ordem: semana começa na segunda.
export const horariosSeed: Horario[] = [
  { diaSemana: 1, abre: null,    fecha: null,    fechado: true,  ordem: 1 },
  { diaSemana: 2, abre: "14:00", fecha: "22:00", fechado: false, ordem: 2 },
  { diaSemana: 3, abre: "14:00", fecha: "22:00", fechado: false, ordem: 3 },
  { diaSemana: 4, abre: "14:00", fecha: "22:00", fechado: false, ordem: 4 },
  { diaSemana: 5, abre: "16:00", fecha: "03:00", fechado: false, ordem: 5 },
  { diaSemana: 6, abre: "16:00", fecha: "03:00", fechado: false, ordem: 6 },
  { diaSemana: 0, abre: "14:00", fecha: "22:00", fechado: false, ordem: 7 },
];

export const depoimentosSeed: Depoimento[] = [
  { id: "d1", nota: 5, autor: "Phellipe K.", ordem: 1, ativo: true,
    texto: "Lugar perfeito para fazer um lanche de qualidade! Experimentei o hambúrguer com geleia de pimenta — simplesmente maravilhoso." },
  { id: "d2", nota: 5, autor: "Roni L.", ordem: 2, ativo: true,
    texto: "Pratos excelentes, chopp gelado e ótimo atendimento. Voltarei com certeza." },
  { id: "d3", nota: 5, autor: "Cliente Google", ordem: 3, ativo: true,
    texto: "Ambiente acolhedor e música ao vivo. Viramos clientes da casa." },
];

export const conteudoSeed: Conteudo = {
  heroTitulo: "A fome acende aqui.",
  heroSubtitulo:
    "Bar com atrações musicais, chopp gelado, burguers, espetos e petiscos. Na Av. Júlio Maria, no Centro — onde a noite de Angra começa.",
  telefone: "(24) 3364-5253",
  endereco: "Av. Júlio Maria, 235 — Centro",
  cidadeUf: "Angra dos Reis, RJ",
  cep: "23900-504",
  whatsappUrl: "https://wa.me/552433645253",
  ifoodUrl: "https://www.ifood.com.br/",
  instagram: "@nbrasaangra",
  campanhaAtiva: false,
  campanhaTitulo: "",
};
```

- [ ] **Step 5: Escrever a fachada**

**Este é o único arquivo do projeto que sabe de onde vêm os dados.** No plano seguinte, o corpo destas funções passa a consultar o Supabase; nenhuma seção da página muda.

Criar `lib/conteudo.ts`:

```ts
import type {
  Categoria, ItemProgramacao, Horario, Depoimento, Conteudo,
} from "./conteudo.tipos";
import {
  categoriasSeed, programacaoSeed, horariosSeed, depoimentosSeed, conteudoSeed,
} from "./conteudo.seed";

const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem;
const ativos = <T extends { ativo: boolean }>(x: T) => x.ativo;

export async function getCategorias(): Promise<Categoria[]> {
  return categoriasSeed.filter(ativos).sort(porOrdem);
}

export async function getProgramacao(): Promise<ItemProgramacao[]> {
  return programacaoSeed.filter(ativos).sort(porOrdem);
}

export async function getHorarios(): Promise<Horario[]> {
  return [...horariosSeed].sort(porOrdem);
}

export async function getDepoimentos(): Promise<Depoimento[]> {
  return depoimentosSeed.filter(ativos).sort(porOrdem);
}

export async function getConteudo(): Promise<Conteudo> {
  return conteudoSeed;
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npm test -- conteudo`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib tests/unit/conteudo.test.ts
git commit -m "feat: camada de dados com tipos, seed e fachada tipada"
```

---

### Task 3: Agrupamento e formatação de horários

Única lógica de verdade do site público, e onde erro silencioso mais dói: horário errado faz cliente ir ao bar fechado.

**Files:**
- Create: `lib/horarios.ts`
- Test: `tests/unit/horarios.test.ts`

**Interfaces:**
- Consumes: `Horario` de `lib/conteudo.tipos`
- Produces: `type FaixaHorario = { label: string; texto: string }`; `agruparHorarios(horarios: Horario[]): FaixaHorario[]`; `FECHADO` (constante com o texto usado para dia fechado — consumida fora deste módulo, ex.: Task 7)

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/horarios.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { horariosSeed } from "@/lib/conteudo.seed";
import type { Horario } from "@/lib/conteudo.tipos";

const h = (
  diaSemana: number, ordem: number,
  abre: string | null, fecha: string | null, fechado = false,
): Horario => ({ diaSemana, ordem, abre, fecha, fechado });

describe("agruparHorarios", () => {
  it("junta três dias consecutivos iguais numa faixa com 'a'", () => {
    expect(agruparHorarios([
      h(2, 1, "14:00", "22:00"), h(3, 2, "14:00", "22:00"), h(4, 3, "14:00", "22:00"),
    ])).toEqual([{ label: "Terça a quinta", texto: "14h — 22h" }]);
  });

  it("junta dois dias consecutivos iguais com 'e'", () => {
    expect(agruparHorarios([
      h(5, 1, "16:00", "03:00"), h(6, 2, "16:00", "03:00"),
    ])).toEqual([{ label: "Sexta e sábado", texto: "16h — 03h" }]);
  });

  it("mantém um dia isolado com o próprio nome", () => {
    expect(agruparHorarios([h(0, 1, "14:00", "22:00")]))
      .toEqual([{ label: "Domingo", texto: "14h — 22h" }]);
  });

  it("escreve 'Fechado' para dia fechado", () => {
    expect(agruparHorarios([h(1, 1, null, null, true)]))
      .toEqual([{ label: "Segunda-feira", texto: "Fechado" }]);
  });

  it("usa exatamente a constante FECHADO para dia fechado", () => {
    const [faixa] = agruparHorarios([h(1, 1, null, null, true)]);
    expect(faixa.texto).toBe(FECHADO);
  });

  it("NÃO junta dias de mesmo horário que não são consecutivos", () => {
    // segunda fechada separa domingo de terça, mesmo com horário igual
    expect(agruparHorarios(horariosSeed)).toEqual([
      { label: "Segunda-feira",   texto: "Fechado"   },
      { label: "Terça a quinta",  texto: "14h — 22h" },
      { label: "Sexta e sábado",  texto: "16h — 03h" },
      { label: "Domingo",         texto: "14h — 22h" },
    ]);
  });

  it("não junta horários iguais quando há um buraco na ordem (não adjacentes)", () => {
    // ordem 2 e 5, mesmo horário, mas sem nada preenchendo 3-4: não deve virar uma faixa
    expect(agruparHorarios([
      h(2, 2, "14:00", "22:00"), h(5, 5, "14:00", "22:00"),
    ])).toEqual([
      { label: "Terça-feira", texto: "14h — 22h" },
      { label: "Sexta-feira", texto: "14h — 22h" },
    ]);
  });

  it("devolve lista vazia para entrada vazia", () => {
    expect(agruparHorarios([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- horarios`
Expected: FAIL — `lib/horarios` não existe.

- [ ] **Step 3: Implementar**

Criar `lib/horarios.ts`:

```ts
import type { Horario } from "./conteudo.tipos";

export type FaixaHorario = { label: string; texto: string };

/** Texto usado quando o dia está fechado. Consumido também fora deste módulo (ex.: Hero). */
export const FECHADO = "Fechado";

const NOMES = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

/** Forma curta usada dentro de faixas: "Terça a quinta", não "Terça-feira a quinta-feira". */
const CURTOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const hhmm = (v: string) => `${v.slice(0, 2)}h`;

function texto(h: Horario): string {
  if (h.fechado || !h.abre || !h.fecha) return FECHADO;
  return `${hhmm(h.abre)} — ${hhmm(h.fecha)}`;
}

const mesmoHorario = (a: Horario, b: Horario) => texto(a) === texto(b);

function rotulo(grupo: Horario[]): string {
  if (grupo.length === 1) return NOMES[grupo[0].diaSemana];
  const primeiro = CURTOS[grupo[0].diaSemana];
  const ultimo = CURTOS[grupo[grupo.length - 1].diaSemana].toLowerCase();
  return grupo.length === 2 ? `${primeiro} e ${ultimo}` : `${primeiro} a ${ultimo}`;
}

export function agruparHorarios(horarios: Horario[]): FaixaHorario[] {
  if (horarios.length === 0) return [];

  const ordenados = [...horarios].sort((a, b) => a.ordem - b.ordem);
  const grupos: Horario[][] = [[ordenados[0]]];

  for (const atual of ordenados.slice(1)) {
    const grupo = grupos[grupos.length - 1];
    const anterior = grupo[grupo.length - 1];
    // só agrupa se for adjacente na ordem de exibição E tiver o mesmo horário
    if (atual.ordem === anterior.ordem + 1 && mesmoHorario(atual, anterior)) {
      grupo.push(atual);
    } else {
      grupos.push([atual]);
    }
  }

  return grupos.map((g) => ({ label: rotulo(g), texto: texto(g[0]) }));
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- horarios`
Expected: PASS — 7 testes verdes, inclusive o de dias não-consecutivos e o que fixa `FECHADO`.

- [ ] **Step 5: Commit**

```bash
git add lib/horarios.ts tests/unit/horarios.test.ts
git commit -m "feat: agrupamento e formatacao de horarios de funcionamento"
```

---

### Task 4: Primitivos de UI

**Files:**
- Create: `components/ui/Botao.tsx`, `components/ui/Chama.tsx`, `components/ui/DivisoriaCurva.tsx`
- Test: `tests/unit/Botao.test.tsx`

**Interfaces:**
- Consumes: nada
- Produces: `<Botao href? variante="solido"|"fantasma">`; `<Chama className?>`; `<Mascote className?>` (com `forwardRef` para `SVGSVGElement`); `<DivisoriaCurva corDestino>`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/Botao.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Botao } from "@/components/ui/Botao";

describe("Botao", () => {
  it("renderiza um link quando recebe href", () => {
    render(<Botao href="https://wa.me/123">Pedir no WhatsApp</Botao>);
    expect(screen.getByRole("link", { name: "Pedir no WhatsApp" }))
      .toHaveAttribute("href", "https://wa.me/123");
  });

  it("renderiza um botão quando não recebe href", () => {
    render(<Botao>Abrir menu</Botao>);
    expect(screen.getByRole("button", { name: "Abrir menu" })).toBeInTheDocument();
  });

  it("usa fundo brasa na variante sólida", () => {
    render(<Botao href="#">Pedir</Botao>);
    expect(screen.getByRole("link")).toHaveClass("bg-brasa");
  });

  it("não usa fundo brasa na variante fantasma", () => {
    render(<Botao href="#" variante="fantasma">Pedir</Botao>);
    expect(screen.getByRole("link")).not.toHaveClass("bg-brasa");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Botao`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar o Botao**

Criar `components/ui/Botao.tsx`:

```tsx
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  variante?: "solido" | "fantasma";
  className?: string;
};

const base =
  "inline-flex items-center gap-2 rounded-full px-5 py-3 text-[.79rem] font-extrabold " +
  "uppercase tracking-[.13em] transition-transform hover:-translate-y-0.5";

const variantes = {
  solido: "bg-brasa text-branco hover:brightness-110",
  fantasma: "border-2 border-fumaca text-branco hover:border-branco",
} as const;

export function Botao({ children, href, variante = "solido", className = "" }: Props) {
  const classe = `${base} ${variantes[variante]} ${className}`;
  return href
    ? <a href={href} className={classe}>{children}</a>
    : <button type="button" className={classe}>{children}</button>;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Botao`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Implementar Chama e Mascote**

O `Mascote` já nasce com `forwardRef` porque a Task 9 precisa da ref para o MotionPath. Criar `components/ui/Chama.tsx`:

```tsx
import { forwardRef } from "react";

const D_CHAMA =
  "M50 3C43 20 34 25 32 39c-1 8 2 12 2 18-12-6-16-17-16-17C9 52 6 63 6 74c0 22 20 39 44 39s44-17 44-39c0-19-11-33-19-43C68 22 58 14 50 3Z";

export function Chama({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 116" className={className} aria-hidden="true">
      <path d={D_CHAMA} fill="currentColor" />
    </svg>
  );
}

/** Mascote da marca: chama com óculos escuros. Ver moodboard, página 5. */
export const Mascote = forwardRef<SVGSVGElement, { className?: string }>(
  function Mascote({ className = "" }, ref) {
    return (
      <svg ref={ref} viewBox="0 0 100 116" className={className} aria-hidden="true">
        <path d={D_CHAMA} fill="#cf2434" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" />
        <path d="M22 66h56" stroke="#241e1f" strokeWidth="5" strokeLinecap="round" />
        <rect x="21" y="59" width="24" height="17" rx="7" fill="#241e1f" />
        <rect x="55" y="59" width="24" height="17" rx="7" fill="#241e1f" />
        <path d="M40 90c4 5 16 5 20 0" stroke="#241e1f" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    );
  },
);
```

- [ ] **Step 6: Implementar a DivisoriaCurva**

Criar `components/ui/DivisoriaCurva.tsx`:

```tsx
/** Divisória orgânica entre blocos de cor. corDestino é a cor da seção de baixo. */
export function DivisoriaCurva({ corDestino }: { corDestino: string }) {
  return (
    <svg
      viewBox="0 0 1536 300" preserveAspectRatio="none" aria-hidden="true"
      className="-mb-px block h-[clamp(60px,8vw,140px)] w-full"
    >
      <path
        fill={corDestino}
        d="M1536,300 H0 V135 S184,65 461,155 S860,105 1121,137 S1413,105 1536,105 V300"
      />
    </svg>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/ui tests/unit/Botao.test.tsx
git commit -m "feat: primitivos de UI (Botao, Chama, Mascote, DivisoriaCurva)"
```

---

### Task 5: Header e menu mobile

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/MenuMobile.tsx`
- Test: `tests/unit/MenuMobile.test.tsx`

**Interfaces:**
- Consumes: `getConteudo()` (Task 2); `Chama`, `Botao` (Task 4)
- Produces: `<Header />` (server, async); `<MenuMobile links={LinkNav[]} />` (CLIENTE); `type LinkNav = { href: string; rotulo: string }`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/MenuMobile.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuMobile } from "@/components/layout/MenuMobile";

const links = [
  { href: "#cardapio", rotulo: "Cardápio" },
  { href: "#delivery", rotulo: "Delivery" },
];

describe("MenuMobile", () => {
  it("começa fechado", () => {
    render(<MenuMobile links={links} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre ao clicar no botão", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cardápio" })).toBeVisible();
  });

  it("fecha ao pressionar Esc", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha ao clicar num link", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    await userEvent.click(screen.getByRole("link", { name: "Delivery" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("prende o foco: Tab a partir do último elemento volta ao primeiro", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    const fechar = screen.getByRole("button", { name: /fechar menu/i });
    const delivery = screen.getByRole("link", { name: "Delivery" });

    delivery.focus();
    expect(document.activeElement).toBe(delivery);

    await userEvent.tab();
    expect(document.activeElement).toBe(fechar);
  });

  it("devolve o foco ao botão de alternância ao fechar com Esc", async () => {
    render(<MenuMobile links={links} />);
    const alternar = screen.getByRole("button", { name: /abrir menu/i });
    await userEvent.click(alternar);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(alternar);
  });

  it("só há um botão acessível 'Fechar menu' enquanto o painel está aberto", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getAllByRole("button", { name: /fechar menu/i })).toHaveLength(1);
  });

  it("trava o scroll do body enquanto aberto e libera ao fechar", async () => {
    render(<MenuMobile links={links} />);
    await userEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- MenuMobile`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar o MenuMobile**

Criar `components/layout/MenuMobile.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export type LinkNav = { href: string; rotulo: string };

const FOCAVEIS = "a[href], button:not([disabled])";

export function MenuMobile({ links }: { links: LinkNav[] }) {
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const alternar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        return;
      }
      if (e.key === "Tab") {
        const focaveis = painel.current?.querySelectorAll<HTMLElement>(FOCAVEIS);
        if (!focaveis || focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    painel.current?.querySelector<HTMLElement>("a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      alternar.current?.focus();
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={alternar}
        type="button"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        aria-hidden={aberto || undefined}
        tabIndex={aberto ? -1 : undefined}
        onClick={() => setAberto((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-fumaca md:hidden"
      >
        <span className="flex flex-col items-center gap-[6px]">
          <span className="block h-0.5 w-[18px] bg-branco" />
          <span className="block h-0.5 w-[18px] bg-branco" />
          <span className="block h-0.5 w-[18px] bg-branco" />
        </span>
      </button>

      {aberto && (
        <div
          ref={painel} role="dialog" aria-modal="true" aria-label="Menu de navegação"
          className="fixed inset-0 z-[80] flex flex-col gap-6 bg-carvao p-8 pt-24"
        >
          <button
            type="button" aria-label="Fechar menu" onClick={() => setAberto(false)}
            className="absolute right-6 top-6 h-11 w-11 rounded-xl border-2 border-fumaca text-2xl leading-none"
          >×</button>
          {links.map((l) => (
            <a
              key={l.href} href={l.href} onClick={() => setAberto(false)}
              className="font-display text-4xl uppercase leading-none"
            >{l.rotulo}</a>
          ))}
        </div>
      )}
    </>
  );
}
```

O painel `role="dialog"` prende o foco de fato: `Tab`/`Shift+Tab` giram entre o primeiro e o último elemento focável dentro do painel (fecho, depois os links); o botão de alternância fica fora da árvore de acessibilidade e da ordem de tabulação enquanto o painel está aberto (`aria-hidden` + `tabIndex={-1}`), o que também resolve o nome acessível duplicado "Fechar menu"; o foco retorna ao botão de alternância ao fechar por qualquer via (Esc, botão de fechar, clique num link), via cleanup do efeito; e o scroll do `body` é travado enquanto o painel está aberto e liberado ao fechar.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- MenuMobile`
Expected: PASS — 8 testes verdes.

- [ ] **Step 5: Implementar o Header**

O botão CAMPANHA é condicional a `campanhaAtiva`, conforme §7.1 do spec. Criar `components/layout/Header.tsx`:

```tsx
import { getConteudo } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";
import { Botao } from "@/components/ui/Botao";
import { MenuMobile, type LinkNav } from "./MenuMobile";

const LINKS: LinkNav[] = [
  { href: "#cardapio", rotulo: "Cardápio" },
  { href: "#delivery", rotulo: "Delivery" },
  { href: "#programacao", rotulo: "Programação" },
  { href: "#onde", rotulo: "Onde estamos" },
];

export async function Header() {
  const c = await getConteudo();
  return (
    <header className="sticky top-0 z-[60] border-b border-fumaca bg-carvao/85 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1280px] items-center gap-5 px-6">
        <a href="#" className="flex flex-none items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-branco">
            <Chama className="h-[19px] w-[19px] text-brasa" />
          </span>
          <span className="text-[1.42rem] leading-none">n&apos;Brasa</span>
        </a>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
               className="text-[.79rem] font-semibold uppercase tracking-[.13em] text-cinza transition-colors hover:text-branco">
              {l.rotulo}
            </a>
          ))}
          {c.campanhaAtiva && <Botao href="/campanha">{c.campanhaTitulo}</Botao>}
        </nav>

        <div className="ml-auto md:ml-0">
          <MenuMobile links={LINKS} />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/layout tests/unit/MenuMobile.test.tsx package.json package-lock.json
git commit -m "feat: header com navegacao e menu mobile acessivel"
```

---

### Task 6: Movimento base — Lenis e Reveal

**Files:**
- Create: `components/motion/SmoothScrollProvider.tsx`, `components/motion/Reveal.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/unit/Reveal.test.tsx`

**Interfaces:**
- Consumes: nada
- Produces: `<SmoothScrollProvider>{children}</SmoothScrollProvider>` (CLIENTE); `<Reveal delay? className?>{children}</Reveal>` (CLIENTE)

- [ ] **Step 1: Escrever o teste que falha**

O primeiro teste é o que importa: sem `immediateRender: false`, o ScrollTrigger estaciona o elemento em `opacity: 0` no carregamento e o conteúdo some do primeiro quadro.

Criar `tests/unit/Reveal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Reveal } from "@/components/motion/Reveal";

const { fromToMock, registerPluginMock } = vi.hoisted(() => ({
  fromToMock: vi.fn((..._args: unknown[]) => ({ scrollTrigger: { kill: vi.fn() }, kill: vi.fn() })),
  registerPluginMock: vi.fn(),
}));

vi.mock("gsap", () => ({
  gsap: { fromTo: fromToMock, registerPlugin: registerPluginMock },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

describe("Reveal", () => {
  beforeEach(() => {
    fromToMock.mockClear();
    registerPluginMock.mockClear();
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  });

  it("renderiza o conteúdo visível, sem depender de animação", () => {
    render(<Reveal><p>Cardápio da casa</p></Reveal>);
    expect(screen.getByText("Cardápio da casa")).toBeVisible();
  });

  it("não zera a opacidade do wrapper no estado inicial", () => {
    const { container } = render(<Reveal><p>Visível</p></Reveal>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).not.toBe("0");
  });

  it("anima com immediateRender: false, para não esconder o conteúdo até o scroll chegar", async () => {
    render(<Reveal><p>Cardápio</p></Reveal>);

    await waitFor(() => expect(fromToMock).toHaveBeenCalled());

    const vars = fromToMock.mock.calls[0][2] as Record<string, unknown>;
    expect(vars.immediateRender).toBe(false);
  });

  it("não monta a animação quando o usuário prefere movimento reduzido", async () => {
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    render(<Reveal><p>Cardápio</p></Reveal>);

    // dá tempo suficiente para os imports dinâmicos (mockados) resolverem,
    // caso o early-return de reduced-motion não esteja funcionando
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(fromToMock).not.toHaveBeenCalled();
    expect(registerPluginMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Reveal`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar o Reveal**

Criar `components/motion/Reveal.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = { children: ReactNode; delay?: number; className?: string };

export function Reveal({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let vivo = true;
    let matar: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      const tween = gsap.fromTo(
        el,
        { y: 38, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.75, ease: "power2.out", delay,
          // sem isto o elemento fica parado em opacity:0 ate o scroll chegar
          immediateRender: false,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
      matar = () => { tween.scrollTrigger?.kill(); tween.kill(); };
    })();

    return () => { vivo = false; matar?.(); };
  }, [delay]);

  return <div ref={ref} className={className}>{children}</div>;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Reveal`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Implementar o SmoothScrollProvider**

O Lenis já respeita `prefers-reduced-motion` internamente (força `lerp: 1`), então não é preciso desligá-lo manualmente. Criar `components/motion/SmoothScrollProvider.tsx`:

```tsx
"use client";

import { useEffect, type ReactNode } from "react";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let vivo = true;
    let limpar: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"), import("gsap"), import("gsap/ScrollTrigger"),
      ]);
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: true });
      const onScroll = () => ScrollTrigger.update();
      const tick = (t: number) => lenis.raf(t * 1000);

      lenis.on("scroll", onScroll);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      limpar = () => {
        gsap.ticker.remove(tick);
        lenis.off("scroll", onScroll);
        lenis.destroy();
      };
    })();

    return () => { vivo = false; limpar?.(); };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 6: Ligar no layout raiz**

Em `app/layout.tsx`, substituir o conteúdo do `<body>`:

```tsx
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

// … dentro do return:
<body>
  <a href="#conteudo"
     className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-brasa focus:px-4 focus:py-2">
    Pular para o conteúdo
  </a>
  <SmoothScrollProvider>{children}</SmoothScrollProvider>
</body>
```

- [ ] **Step 7: Verificar o scroll suave no navegador**

Run: `npm run dev`, adicionar temporariamente `<div className="h-[300vh]" />` em `app/page.tsx` e rolar.
Expected: rolagem com inércia; `<html>` recebe a classe `lenis`. Remover a div depois.

- [ ] **Step 8: Commit**

```bash
git add components/motion app/layout.tsx tests/unit/Reveal.test.tsx
git commit -m "feat: scroll suave com Lenis e componente Reveal"
```

---

### Task 7: Herói

**Files:**
- Create: `components/sections/Hero.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getConteudo()`, `getHorarios()`, `agruparHorarios()`, `FECHADO`, `Botao`
- Produces: `<Hero />` (server, async)

- [ ] **Step 1: Implementar o Hero**

Abrir `docs/superpowers/specs/mockup-direcao-visual.html` como referência de proporção. Criar `components/sections/Hero.tsx`:

```tsx
import { getConteudo, getHorarios } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { Botao } from "@/components/ui/Botao";

export async function Hero() {
  const [c, horarios] = await Promise.all([getConteudo(), getHorarios()]);
  const resumo = agruparHorarios(horarios).filter((f) => f.texto !== FECHADO);

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-10 pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">
            Angra dos Reis · Chopperia | Carnes
          </p>
          <h1 className="mt-4 text-balance font-display text-[clamp(3.2rem,9.2vw,7.6rem)] uppercase leading-[.86]">
            A fome<br />acende <span className="text-brasa">aqui.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-cinza">{c.heroSubtitulo}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Botao href={c.whatsappUrl}>Pedir no WhatsApp</Botao>
            <Botao href={c.ifoodUrl} variante="fantasma">Delivery iFood</Botao>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 border-t border-fumaca pt-6 text-[.78rem] uppercase tracking-[.11em] text-cinza">
            {resumo.map((f) => <span key={f.label}>{f.label} · {f.texto}</span>)}
            <span>{c.instagram}</span>
          </div>
        </div>

        {/* A foto da fachada entra quando o cliente enviar o arquivo limpo (§10.2 do spec). */}
        <div className="aspect-[4/3.2] rotate-2 rounded-[26px] border-[3px] border-fumaca bg-fumaca shadow-[0_30px_70px_rgba(0,0,0,.55)]" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Compor na home**

Substituir `app/page.tsx`:

```tsx
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo"><Hero /></main>
    </>
  );
}
```

- [ ] **Step 3: Conferir no navegador**

Run: `npm run dev`
Expected: herói com display gigante, "aqui." em vermelho, dois CTAs, e a faixa de horário mostrando "Terça a quinta · 14h — 22h", "Sexta e sábado · 16h — 03h", "Domingo · 14h — 22h". Segunda não aparece, por ser fechado.

- [ ] **Step 4: Commit**

```bash
git add components/sections/Hero.tsx app/page.tsx
git commit -m "feat: secao heroi com horario resumido"
```

---

### Task 8: Chips de categorias e cardápio em bento

**Files:**
- Create: `components/sections/ChipsCategorias.tsx`, `components/sections/Cardapio.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getCategorias()`, `Chama`, `Reveal`
- Produces: `<ChipsCategorias />`, `<Cardapio />` (server, async)

- [ ] **Step 1: Implementar os chips**

Usam **selos de chama, não fotos** — decisão de §10.2 do spec, por não haver fotografia limpa e por ser mais fiel à cartela de adesivos do manual. Criar `components/sections/ChipsCategorias.tsx`:

```tsx
import { getCategorias } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";

export async function ChipsCategorias() {
  const cats = await getCategorias();
  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-3 pt-12">
      <ul className="flex list-none gap-4 overflow-x-auto p-1 pb-5">
        {cats.map((c) => (
          <li key={c.slug} className="flex-none">
            <a href="#cardapio" className="group block w-[118px] text-center">
              <span className="grid h-[118px] w-[118px] place-items-center rounded-full border-[3px] border-fumaca bg-fumaca transition-all group-hover:-translate-y-1 group-hover:border-brasa group-hover:bg-brasa">
                <Chama className="h-[46px] w-[46px] text-brasa transition-colors group-hover:text-branco" />
              </span>
              <b className="mt-3 block text-[.79rem] font-bold uppercase tracking-[.1em]">
                {c.nome}
              </b>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Implementar o cardápio em bento**

Criar `components/sections/Cardapio.tsx`:

```tsx
import { getCategorias } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";

/** Vãos do grid por posição, reproduzindo o bento do mockup. */
const VAOS = [
  "sm:col-span-2 sm:row-span-2 sm:min-h-[440px]",
  "sm:col-span-2", "sm:col-span-2",
  "sm:col-span-1", "sm:col-span-1", "sm:col-span-2",
];

export async function Cardapio() {
  const cats = await getCategorias();
  return (
    <section id="cardapio" className="mx-auto max-w-[1280px] px-6 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h2 className="text-balance font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
          Feito na hora,<br />servido no capricho
        </h2>
        <p className="max-w-[44ch] text-cinza">
          Ingredientes frescos, ponto certo e porções generosas. Cada item nasceu para ser repetido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-4">
        {cats.map((c, i) => (
          <Reveal key={c.slug} className={VAOS[i] ?? ""}>
            <article
              className="flex h-full min-h-[210px] flex-col justify-end rounded-[22px] border border-fumaca bg-fumaca p-6 transition-all hover:-translate-y-1.5 hover:border-brasa"
            >
              {/* brasa-texto, nao brasa: rotulo pequeno sobre fundo escuro (§9 do spec) */}
              <span className="text-[.68rem] font-extrabold uppercase tracking-[.16em] text-brasa-texto">
                {c.kicker}
              </span>
              <h3 className="mb-2 mt-2 font-display text-2xl uppercase leading-none">{c.nome}</h3>
              <p className="text-sm leading-relaxed text-cinza">{c.descricao}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

> **Atenção do revisor:** o `text-brasa-texto` no kicker não é detalhe de estilo — é a correção de contraste de §9 do spec. Trocar por `text-brasa` reintroduz uma falha de 3,1:1.

- [ ] **Step 3: Compor na home**

Em `app/page.tsx`, adicionar dentro do `<main>`, depois de `<Hero />`: `<ChipsCategorias />` e `<Cardapio />`, com os imports correspondentes.

- [ ] **Step 4: Conferir no navegador**

Run: `npm run dev`
Expected: seis selos circulares de chama que ficam vermelhos ao passar o mouse; grid bento com Burgers ocupando o dobro; kickers em vermelho claro legível.

- [ ] **Step 5: Commit**

```bash
git add components/sections app/page.tsx
git commit -m "feat: chips de categoria e cardapio em grid bento"
```

---

### Task 9: Rota do mascote — componente de assinatura

Peça central do site (§7.3 do spec). O mascote percorre uma rota pontilhada por bairros de Angra, inclinando-se nas curvas.

**Files:**
- Create: `components/sections/RotaMascote.tsx`, `components/sections/Delivery.tsx`
- Modify: `app/page.tsx`
- Test: `tests/unit/RotaMascote.test.tsx`

**Interfaces:**
- Consumes: `Mascote` (Task 4), `getConteudo()`, `Botao`
- Produces: `type Parada = { id: string; bairro: string }`; `<RotaMascote paradas={Parada[]} />` (CLIENTE); `<Delivery />` (server, async)

- [ ] **Step 1: Escrever o teste que falha**

Garante que **todas as paradas existem no DOM independentemente de animação** — quem tem movimento reduzido não pode perder conteúdo.

Criar `tests/unit/RotaMascote.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RotaMascote } from "@/components/sections/RotaMascote";

const paradas = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "japuiba", bairro: "Japuíba" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "mambucaba", bairro: "Mambucaba" },
];

describe("RotaMascote", () => {
  it("renderiza todas as paradas, sem depender de animação", () => {
    render(<RotaMascote paradas={paradas} />);
    for (const p of paradas) {
      expect(screen.getByText(p.bairro)).toBeInTheDocument();
    }
  });

  it("expõe o path da rota para o MotionPath", () => {
    const { container } = render(<RotaMascote paradas={paradas} />);
    expect(container.querySelector("#rota-entrega")).toBeInTheDocument();
  });

  it("marca a arte da rota como decorativa", () => {
    const { container } = render(<RotaMascote paradas={paradas} />);
    expect(container.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- RotaMascote`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar a RotaMascote**

Criar `components/sections/RotaMascote.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Mascote } from "@/components/ui/Chama";

export type Parada = { id: string; bairro: string };

/** Posição de cada parada ao longo da seção. */
const POSICOES = [
  "top-[3%] left-[2%]", "top-[23%] right-[3%]", "top-[43%] left-[6%]",
  "top-[63%] right-[5%]", "top-[81%] left-[3%]",
];

export function RotaMascote({ paradas }: { paradas: Parada[] }) {
  const secao = useRef<HTMLDivElement>(null);
  const mascote = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const alvo = mascote.current;
    const wrap = secao.current;
    if (!alvo || !wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let vivo = true;
    let limpar: (() => void) | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { MotionPathPlugin } = await import("gsap/MotionPathPlugin");
      if (!vivo) return;
      gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

      const trilho = { trigger: wrap, start: "top 72%", end: "bottom bottom", scrub: 1 } as const;

      // autoRotate faz o mascote inclinar acompanhando a tangente da curva
      const voo = gsap.to(alvo, {
        motionPath: {
          path: "#rota-entrega", align: "#rota-entrega",
          alignOrigin: [0.5, 0.5], autoRotate: 90,
        },
        ease: "none", scrollTrigger: trilho,
      });

      const linha = wrap.querySelector<SVGPathElement>("#rota-entrega");
      const desenho = linha
        ? gsap.fromTo(linha,
            { strokeDashoffset: linha.getTotalLength() },
            { strokeDashoffset: 0, ease: "none", scrollTrigger: trilho })
        : null;

      limpar = () => {
        voo.scrollTrigger?.kill(); voo.kill();
        desenho?.scrollTrigger?.kill(); desenho?.kill();
      };
    })();

    return () => { vivo = false; limpar?.(); };
  }, []);

  return (
    <div ref={secao} className="relative mt-5 h-[1250px] md:h-[1500px] lg:h-[1900px]">
      <svg
        viewBox="0 0 1200 1900" preserveAspectRatio="none" aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <path
          id="rota-entrega" fill="none" stroke="#cf2434" strokeWidth="5"
          strokeDasharray="26 26" strokeLinecap="round"
          d="M120 40 C 620 140, 1080 220, 1040 460 C 1000 700, 260 620, 220 860 C 180 1100, 1020 1000, 1000 1250 C 980 1500, 260 1380, 200 1620 C 170 1740, 400 1830, 660 1860"
        />
      </svg>

      <Mascote
        ref={mascote}
        className="absolute left-[8%] top-[2%] z-[4] h-16 w-16 md:h-[72px] md:w-[72px] lg:h-24 lg:w-24"
      />

      {paradas.map((p, i) => (
        <div key={p.id}
             className={`absolute z-[3] w-[158px] md:w-[190px] lg:w-[250px] ${POSICOES[i] ?? ""}`}>
          <span className="relative z-[2] -mb-3 inline-block -rotate-3 rounded-lg border-[3px] border-branco bg-brasa px-4 py-1.5 font-display text-base uppercase tracking-wide">
            {p.bairro}
          </span>
          <span className="block overflow-hidden rounded-[20px] border-[3px] border-branco bg-fumaca shadow-[0_22px_50px_rgba(0,0,0,.6)]">
            {/* foto da parada entra quando o cliente enviar (§10.2 do spec) */}
            <span className="block aspect-[4/3.4]" />
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- RotaMascote`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Envolver numa seção de servidor**

O GSAP entra por `next/dynamic` com `ssr: false`, para não pesar no primeiro paint. Criar `components/sections/Delivery.tsx`:

```tsx
import dynamic from "next/dynamic";
import { getConteudo } from "@/lib/conteudo";
import { Botao } from "@/components/ui/Botao";

const RotaMascote = dynamic(
  () => import("./RotaMascote").then((m) => m.RotaMascote),
  { ssr: false },
);

const PARADAS = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "japuiba", bairro: "Japuíba" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "mambucaba", bairro: "Mambucaba" },
];

export async function Delivery() {
  const c = await getConteudo();
  return (
    <section id="delivery" className="relative overflow-hidden pt-16">
      <div className="mx-auto max-w-[760px] px-6 text-center">
        <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Delivery</p>
        <h2 className="mt-3 font-display text-[clamp(2.6rem,8.4vw,6.4rem)] uppercase leading-[.86]">
          Vai <span className="text-brasa">N&apos;brasando</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-cinza">
          O sabor sai da brasa e vai até você. Role a página e siga a rota — de Angra ao seu sofá, sem perder a temperatura.
        </p>
      </div>

      <RotaMascote paradas={PARADAS} />

      <div className="flex flex-wrap justify-center gap-3 px-6 pb-20">
        <Botao href={c.whatsappUrl}>Pedir no WhatsApp</Botao>
        <Botao href={c.ifoodUrl} variante="fantasma">Pedir no iFood</Botao>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Compor na home e conferir**

Adicionar `<Delivery />` em `app/page.tsx` depois de `<Cardapio />`.

Run: `npm run dev` e rolar até a seção.
Expected: o mascote percorre a rota pontilhada e **gira acompanhando a curva**; os pontos do tracejado marcham ao longo da rota conforme a rolagem; os cinco bairros aparecem.

- [ ] **Step 7: Conferir com movimento reduzido**

No DevTools: Rendering → Emulate CSS `prefers-reduced-motion: reduce`, recarregar.
Expected: mascote parado, rota inteira desenhada, cinco bairros visíveis, nenhum conteúdo perdido.

- [ ] **Step 8: Commit**

```bash
git add components/sections app/page.tsx tests/unit/RotaMascote.test.tsx
git commit -m "feat: rota do mascote com GSAP MotionPath e scrub de scroll"
```

---

### Task 10: Horários, programação e divisória curva

**Files:**
- Create: `components/sections/HorariosProgramacao.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getHorarios()`, `getProgramacao()`, `agruparHorarios()`, `DivisoriaCurva`, `Reveal`
- Produces: `<HorariosProgramacao />` (server, async)

- [ ] **Step 1: Implementar a seção**

Faixa clara do site. Sobre creme o `#cf2434` passa em contraste — aqui `text-brasa` é correto. Criar `components/sections/HorariosProgramacao.tsx`:

```tsx
import { getHorarios, getProgramacao } from "@/lib/conteudo";
import { agruparHorarios } from "@/lib/horarios";
import { Reveal } from "@/components/motion/Reveal";

export async function HorariosProgramacao() {
  const [horarios, prog] = await Promise.all([getHorarios(), getProgramacao()]);
  const faixas = agruparHorarios(horarios);

  return (
    <section id="programacao" className="bg-creme text-carvao">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid gap-14 md:grid-cols-2">
          <div>
            <p className="text-[.72rem] uppercase tracking-[.2em] text-[#7a6a63]">
              Horário de funcionamento
            </p>
            <h2 className="mb-7 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
              A casa abre às 14h
            </h2>
            <ul className="list-none p-0">
              {faixas.map((f) => (
                <li key={f.label}
                    className="flex justify-between gap-5 border-b border-[#e3d5c8] py-4">
                  <span className={f.texto === "Fechado" ? "text-[#8b7c75]" : ""}>{f.label}</span>
                  <b className="font-extrabold tabular-nums">{f.texto}</b>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[.72rem] uppercase tracking-[.2em] text-[#7a6a63]">
              Programação da semana
            </p>
            <h2 className="mb-7 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
              Tem motivo<br />pra vir todo dia
            </h2>
            <div className="grid gap-3">
              {prog.map((p) => (
                <Reveal key={p.id}>
                  <article className="flex items-baseline gap-4 rounded-2xl border-l-[5px] border-brasa bg-branco px-5 py-4">
                    <span className="flex-none basis-[108px] text-[.68rem] font-extrabold uppercase tracking-[.14em] text-brasa">
                      {p.diasLabel}
                    </span>
                    <span className="font-display text-lg uppercase leading-tight">{p.titulo}</span>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Compor com a divisória**

Em `app/page.tsx`, depois de `<Delivery />`:

```tsx
<DivisoriaCurva corDestino="#f0e6dc" />
<HorariosProgramacao />
```

- [ ] **Step 3: Conferir no navegador**

Run: `npm run dev`
Expected: a divisória ondulada emenda o bloco escuro na faixa creme sem fresta; a lista mostra as quatro faixas agrupadas, com "Segunda-feira / Fechado" em cinza.

- [ ] **Step 4: Commit**

```bash
git add components/sections/HorariosProgramacao.tsx app/page.tsx
git commit -m "feat: horarios agrupados e programacao da semana"
```

---

### Task 11: Depoimentos, onde estamos e rodapé

**Files:**
- Create: `components/sections/Depoimentos.tsx`, `components/sections/OndeEstamos.tsx`, `components/layout/Footer.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getDepoimentos()`, `getConteudo()`, `Reveal`, `Chama`, `Botao`
- Produces: `<Depoimentos />`, `<OndeEstamos />`, `<Footer />` (server, async)

- [ ] **Step 1: Implementar os depoimentos**

Criar `components/sections/Depoimentos.tsx`:

```tsx
import { getDepoimentos } from "@/lib/conteudo";
import { Reveal } from "@/components/motion/Reveal";

export async function Depoimentos() {
  const itens = await getDepoimentos();
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20">
      <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Quem veio, volta</p>
      <h2 className="mb-10 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
        4,2 estrelas e quase<br />300 avaliações
      </h2>
      <div className="grid gap-[18px] md:grid-cols-3">
        {itens.map((d) => (
          <Reveal key={d.id}>
            <figure className="h-full rounded-[22px] border border-fumaca bg-fumaca p-6">
              <div aria-label={`${d.nota} de 5 estrelas`} className="text-brasa-texto">
                {"★".repeat(d.nota)}
              </div>
              <blockquote className="mt-3 text-cinza">“{d.texto}”</blockquote>
              <figcaption className="mt-4 text-[.78rem] uppercase tracking-[.11em]">
                {d.autor}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implementar onde estamos**

O mapa é link para o Google Maps, **não iframe embutido** — iframe de mapa custa centenas de KB e cookies de terceiros, o que quebraria o orçamento de §8. Criar `components/sections/OndeEstamos.tsx`:

```tsx
import { getConteudo } from "@/lib/conteudo";
import { Botao } from "@/components/ui/Botao";

export async function OndeEstamos() {
  const c = await getConteudo();
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${c.endereco}, ${c.cidadeUf}`,
  )}`;
  return (
    <section id="onde" className="mx-auto max-w-[1280px] px-6 py-20">
      <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">Venha nos visitar</p>
      <h2 className="mb-10 mt-3 font-display text-[clamp(2.3rem,5.6vw,4.4rem)] uppercase leading-[.86]">
        Estamos a um passo<br />da vista mar
      </h2>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Endereço</h3>
          <address className="mt-3 not-italic">
            <p>{c.endereco}</p>
            <p>{c.cidadeUf} · {c.cep}</p>
          </address>
          <div className="mt-6"><Botao href={maps} variante="fantasma">Como chegar</Botao></div>
        </div>
        <div>
          <h3 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Contato</h3>
          <p className="mt-3">
            <a href={`tel:+55${c.telefone.replace(/\D/g, "")}`}>{c.telefone}</a>
          </p>
          <p>
            <a href={`https://instagram.com/${c.instagram.replace("@", "")}`}>{c.instagram}</a>
          </p>
          <div className="mt-6"><Botao href={c.whatsappUrl}>Chamar no WhatsApp</Botao></div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Implementar o rodapé**

Criar `components/layout/Footer.tsx`:

```tsx
import { getConteudo } from "@/lib/conteudo";
import { Chama } from "@/components/ui/Chama";

export async function Footer() {
  const c = await getConteudo();
  return (
    <footer className="border-t border-fumaca py-14">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <span className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border-[2.5px] border-branco">
                <Chama className="h-[19px] w-[19px] text-brasa" />
              </span>
              <span className="text-[1.42rem] leading-none">n&apos;Brasa</span>
            </span>
            <p className="mt-4 text-lg">O sabor que encontra, o som.</p>
          </div>
          <div>
            <h4 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Endereço</h4>
            <p className="mt-3">{c.endereco}</p>
            <p>{c.cidadeUf} · {c.cep}</p>
          </div>
          <div>
            <h4 className="text-[.7rem] font-bold uppercase tracking-[.18em] text-cinza">Contato</h4>
            <p className="mt-3">{c.telefone}</p>
            <p>{c.instagram}</p>
          </div>
        </div>
        <p className="mt-12 border-t border-fumaca pt-6 text-[.75rem] uppercase tracking-[.09em] text-[#7d6f70]">
          © 2026 N&apos;Brasa Angra · Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Compor a home completa**

`app/page.tsx` final:

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ChipsCategorias } from "@/components/sections/ChipsCategorias";
import { Cardapio } from "@/components/sections/Cardapio";
import { Delivery } from "@/components/sections/Delivery";
import { HorariosProgramacao } from "@/components/sections/HorariosProgramacao";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { OndeEstamos } from "@/components/sections/OndeEstamos";
import { DivisoriaCurva } from "@/components/ui/DivisoriaCurva";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <ChipsCategorias />
        <Cardapio />
        <Delivery />
        <DivisoriaCurva corDestino="#f0e6dc" />
        <HorariosProgramacao />
        <Depoimentos />
        <OndeEstamos />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Rodar a suíte e o build**

Run: `npm test && npm run build`
Expected: testes verdes e build sem erro.

- [ ] **Step 6: Commit**

```bash
git add components app/page.tsx
git commit -m "feat: depoimentos, onde estamos e rodape"
```

---

### Task 12: Preloader

Aplica o conceito do Crav com os limites de §8. A referência leva ~45 s; o nosso tem teto de 1,2 s, é pulável e só aparece na primeira visita da sessão.

**Files:**
- Create: `components/motion/Preloader.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/unit/Preloader.test.tsx`

**Interfaces:**
- Consumes: `Chama` (Task 4)
- Produces: `<Preloader />` (CLIENTE)

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/Preloader.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preloader } from "@/components/motion/Preloader";

beforeEach(() => sessionStorage.clear());

describe("Preloader", () => {
  it("aparece na primeira visita da sessão", () => {
    render(<Preloader />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("não aparece se já foi exibido nesta sessão", () => {
    sessionStorage.setItem("nbrasa:preloader", "1");
    render(<Preloader />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("some ao pressionar uma tecla", async () => {
    render(<Preloader />);
    await userEvent.keyboard(" ");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("some sozinho dentro do teto de 1,2 s", async () => {
    render(<Preloader />);
    await waitFor(
      () => expect(screen.queryByRole("status")).not.toBeInTheDocument(),
      { timeout: 2000 },
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- Preloader`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar**

Criar `components/motion/Preloader.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Chama } from "@/components/ui/Chama";

const CHAVE = "nbrasa:preloader";
const TETO_MS = 1200;

export function Preloader() {
  const [visivel, setVisivel] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(CHAVE) === null; } catch { return false; }
  });

  useEffect(() => {
    if (!visivel) return;

    const fechar = () => {
      try { sessionStorage.setItem(CHAVE, "1"); } catch { /* modo privado */ }
      setVisivel(false);
    };

    const t = setTimeout(fechar, TETO_MS);
    window.addEventListener("keydown", fechar, { once: true });
    window.addEventListener("pointerdown", fechar, { once: true });
    window.addEventListener("wheel", fechar, { once: true, passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", fechar);
      window.removeEventListener("pointerdown", fechar);
      window.removeEventListener("wheel", fechar);
    };
  }, [visivel]);

  if (!visivel) return null;

  return (
    <div
      role="status" aria-label="Carregando"
      className="fixed inset-0 z-[100] grid place-items-center bg-brasa motion-safe:animate-pulse"
    >
      <Chama className="h-24 w-24 text-branco" />
      <span className="sr-only">Acendendo a brasa…</span>
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- Preloader`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Ligar no layout**

Em `app/layout.tsx`, adicionar `<Preloader />` como primeiro filho do `<body>`.

- [ ] **Step 6: Commit**

```bash
git add components/motion/Preloader.tsx app/layout.tsx tests/unit/Preloader.test.tsx
git commit -m "feat: preloader com teto de 1,2s, pulavel e por sessao"
```

---

### Task 13: SEO e dados estruturados

O maior canal do bar é busca local. Sem `Restaurant` no schema.org, o Google não mostra o cartão com horário e "aberto agora".

**Files:**
- Create: `components/seo/DadosEstruturados.tsx`, `app/error.tsx`, `app/not-found.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/unit/dadosEstruturados.test.ts`

**Interfaces:**
- Consumes: `getConteudo()`, `getHorarios()`, tipos `Conteudo` e `Horario`
- Produces: `montarSchemaRestaurant(c: Conteudo, horarios: Horario[]): object`; `<DadosEstruturados />` (server, async)

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/dadosEstruturados.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { montarSchemaRestaurant } from "@/components/seo/DadosEstruturados";
import { conteudoSeed, horariosSeed } from "@/lib/conteudo.seed";

const schema = montarSchemaRestaurant(conteudoSeed, horariosSeed) as any;

describe("montarSchemaRestaurant", () => {
  it("declara o tipo Restaurant", () => {
    expect(schema["@type"]).toBe("Restaurant");
  });

  it("inclui o endereço completo", () => {
    expect(schema.address).toMatchObject({
      streetAddress: "Av. Júlio Maria, 235 — Centro",
      postalCode: "23900-504",
      addressCountry: "BR",
    });
  });

  it("omite os dias fechados do horário", () => {
    const dias = schema.openingHoursSpecification.flatMap((s: any) => s.dayOfWeek);
    expect(dias).not.toContain("Monday");
  });

  it("declara sábado abrindo 16:00 e fechando 03:00", () => {
    const sab = schema.openingHoursSpecification
      .find((s: any) => s.dayOfWeek.includes("Saturday"));
    expect(sab).toMatchObject({ opens: "16:00", closes: "03:00" });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test -- dadosEstruturados`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

Criar `components/seo/DadosEstruturados.tsx`:

```tsx
import { getConteudo, getHorarios } from "@/lib/conteudo";
import type { Conteudo, Horario } from "@/lib/conteudo.tipos";

const DIAS_SCHEMA = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export function montarSchemaRestaurant(c: Conteudo, horarios: Horario[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "N'Brasa Angra",
    servesCuisine: ["Hambúrguer", "Churrasco", "Petiscos"],
    priceRange: "$$",
    telephone: `+55${c.telefone.replace(/\D/g, "")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.endereco,
      addressLocality: "Angra dos Reis",
      addressRegion: "RJ",
      postalCode: c.cep,
      addressCountry: "BR",
    },
    openingHoursSpecification: horarios
      .filter((h) => !h.fechado && h.abre && h.fecha)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [DIAS_SCHEMA[h.diaSemana]],
        opens: h.abre,
        closes: h.fecha,
      })),
  };
}

export async function DadosEstruturados() {
  const [c, horarios] = await Promise.all([getConteudo(), getHorarios()]);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(montarSchemaRestaurant(c, horarios)),
      }}
    />
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test -- dadosEstruturados`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Ligar e criar as telas de erro**

Adicionar `<DadosEstruturados />` dentro do `<body>` em `app/layout.tsx`.

Criar `app/error.tsx`:

```tsx
"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
      <h1 className="font-display text-5xl uppercase">Algo saiu do ponto</h1>
      <p className="mt-4 text-cinza">
        Não conseguimos carregar esta parte da página. Tente de novo.
      </p>
      <button onClick={reset}
              className="mt-8 rounded-full bg-brasa px-6 py-3 font-bold uppercase tracking-widest">
        Tentar de novo
      </button>
    </main>
  );
}
```

Criar `app/not-found.tsx`:

```tsx
export default function NaoEncontrado() {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
      <h1 className="font-display text-5xl uppercase">Página não encontrada</h1>
      <p className="mt-4 text-cinza">O link que você abriu não existe por aqui.</p>
      <a href="/"
         className="mt-8 inline-block rounded-full bg-brasa px-6 py-3 font-bold uppercase tracking-widest">
        Voltar para a home
      </a>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add components/seo app/error.tsx app/not-found.tsx app/layout.tsx tests/unit/dadosEstruturados.test.ts
git commit -m "feat: dados estruturados Restaurant e telas de erro"
```

---

### Task 14: Verificação — viewports, movimento reduzido e orçamento

Fecha o plano medindo o que §8 e §9 exigem. Nada aqui é opcional: são os números prometidos ao cliente.

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/home.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: o site completo das tarefas anteriores
- Produces: suíte Playwright em 5 viewports; relatório Lighthouse

- [ ] **Step 1: Configurar o Playwright**

Criar `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

const larguras = [320, 768, 1024, 1440, 1920];

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: "http://localhost:3000" },
  projects: larguras.map((w) => ({
    name: `w${w}`,
    use: { ...devices["Desktop Chrome"], viewport: { width: w, height: 900 } },
  })),
});
```

- [ ] **Step 2: Escrever os testes de ponta a ponta**

Criar `tests/e2e/home.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nbrasa:preloader", "1"));
  await page.goto("/");
});

test("mostra o título do herói", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("acende");
});

test("tem exatamente um h1", async ({ page }) => {
  await expect(page.locator("h1")).toHaveCount(1);
});

test("a página não rola na horizontal", async ({ page }) => {
  const estoura = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(estoura).toBe(false);
});

test("lista as seis categorias", async ({ page }) => {
  for (const nome of ["Burgers", "Espetinhos", "Carnes Nobres", "Petiscos", "Drinks", "Sobremesas"]) {
    await expect(page.getByText(nome, { exact: true }).first()).toBeVisible();
  }
});

test("mostra os horários agrupados corretamente", async ({ page }) => {
  await expect(page.getByText("Terça a quinta")).toBeVisible();
  await expect(page.getByText("16h — 03h").first()).toBeVisible();
});

test("expõe os cinco bairros da rota de entrega", async ({ page }) => {
  for (const b of ["Centro", "Praia do Anil", "Japuíba", "Praia Grande", "Mambucaba"]) {
    await expect(page.getByText(b, { exact: true })).toBeAttached();
  }
});

test("publica dados estruturados de Restaurant", async ({ page }) => {
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(json!)["@type"]).toBe("Restaurant");
});

test.describe("com movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("nenhum conteúdo depende de animação", async ({ page }) => {
    await expect(page.getByText("Mambucaba")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test("o menu mobile abre e fecha", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 768, "só faz sentido no mobile");
  await page.getByRole("button", { name: /abrir menu/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
```

- [ ] **Step 3: Rodar a suíte**

Run: `npm run e2e`
Expected: todos verdes nos 5 viewports. **Se o teste de rolagem horizontal falhar em 320 px, é bug real** — corrigir o overflow, não afrouxar o teste.

- [ ] **Step 4: Medir o orçamento de peso**

Run: `npm run build`
Expected: na tabela de rotas, o **First Load JS** da rota `/` ≤ 130 KB. O GSAP não deve aparecer nesse número — é carregado dinamicamente. Se estourar, investigar qual componente virou cliente sem necessidade.

- [ ] **Step 5: Rodar o Lighthouse**

```bash
npm start
npx lighthouse http://localhost:3000 --preset=desktop --view
npx lighthouse http://localhost:3000 --form-factor=mobile --throttling.cpuSlowdownMultiplier=4 --view
```

Expected: Performance ≥ 90 no mobile, LCP ≤ 2,0 s, CLS < 0,05.

**Registrar os números reais alcançados.** Se algum ficar abaixo da meta, reportar o valor medido em vez de afirmar que "ficou rápido" — o spec promete números, não impressões.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "test: suite Playwright em 5 viewports e verificacao de orcamento"
```

- [ ] **Step 7: Entregar para validação do cliente**

Run: `npm run build && npm start`

Avisar o cliente que o preview local está em `http://localhost:3000`.

**Não executar `git push`.** O §11 do spec define a validação do cliente como portão; o push acontece depois dela, já no segundo plano.

---

## Self-review

**Cobertura do spec.** §1–2 escopo → estrutura do plano. §3 stack → Task 1. §4 direção visual → Tasks 1, 4, 7, 8. §5 arquitetura → Task 2 (fachada) e a regra de componente cliente nas Global Constraints. §6 modelo de dados → Task 2 (tipos e seed espelham as colunas; migrations ficam no plano 2). §7.1 rotas → Tasks 5, 13. §7.2 inventário → Tasks 7–11. §7.3 rota do mascote → Task 9. §7.4 fronteira cliente → Global Constraints, verificada na Task 14. §8 movimento e orçamento → Tasks 6, 12, 14. §9 erro → Task 13; acessibilidade → Tasks 5, 6, 8, 14; testes → Tasks 2, 3, 14. §10 pendências → comentários nos pontos afetados (foto no Hero e na RotaMascote, fonte na Task 1). §11 sequenciamento → ordem das tarefas e Step 7 da Task 14.

**Divergência encontrada e resolvida:** o spec fixa quatro componentes cliente (§7.4), mas o preloader de §8 é necessariamente o quinto. As Global Constraints deste plano já listam os cinco, para o revisor não tratar o `Preloader` como violação.

**Consistência de tipos.** `Categoria`, `ItemProgramacao`, `Horario`, `Depoimento` e `Conteudo` são definidos na Task 2 e usados com os mesmos nomes de campo nas Tasks 5, 7, 8, 9, 10, 11 e 13. `agruparHorarios` devolve `FaixaHorario { label, texto }` na Task 3 e é consumido com esses nomes nas Tasks 7 e 10. `Parada { id, bairro }` é definido e consumido na Task 9. O `Mascote` já nasce com `forwardRef` na Task 4, porque a Task 9 precisa da ref — evitando alterar na Task 9 o que a Task 4 criou.

**Placeholders:** nenhum. Todo passo de código traz o código real. Os dois pontos onde falta material do cliente (fotografia) são espaços reservados **no layout**, com comentário apontando §10.2 do spec — não são instruções vagas ao implementador.

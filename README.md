# N'Brasa Angra — site institucional

Site público do N'Brasa, bar/choperia e casa de carnes na Av. Júlio Maria,
Centro, Angra dos Reis (RJ). Next.js 15 (App Router) rodando hoje contra dados
semeados em `lib/conteudo.seed.ts`, atrás de uma única fachada tipada
(`lib/conteudo.ts`) — a ligação com Supabase e o painel de admin vêm num
plano seguinte, sem que nenhuma seção da página precise mudar.

Ver `docs/superpowers/specs/2026-09-02-site-nbrasa-design.md` para o
documento de design completo: paleta, tipografia, modelo de dados, orçamento
de performance e critérios de acessibilidade.

## Rodando localmente

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os valores do painel do
Supabase (Project Settings > API). O arquivo `.env.local` não é versionado.

```bash
npm install
npm run dev
```

Abre em `http://localhost:3000`.

## Testes

```bash
npm test        # Vitest — unitários (lib/ e componentes)
npm run e2e      # Playwright — end-to-end contra o build local
npm run lint      # ESLint
npm run build    # build de produção (confere o orçamento de JS de primeira carga)
```

## Stack

Next.js 15 · TypeScript · Tailwind CSS v4 · Lenis (scroll suave) · GSAP +
ScrollTrigger + MotionPathPlugin · Vitest + Testing Library · Playwright.

Tudo é Server Component por padrão. Só cinco componentes são cliente:
`SmoothScrollProvider`, `MenuMobile`, `Reveal`, `RotaMascote` e `Preloader`
(mais `app/error.tsx`, que o Next exige).

## Pendências do cliente

Levantadas no spec (§10) e ainda abertas:

1. **Licença da fonte Owners** (display, comercial da Latinotype). Enquanto
   não decidida, o display usa **Anton** como substituta.
2. **Fotografia limpa.** O material atual tem copy sobreposta; os chips de
   categoria e as paradas da rota de entrega ficam sem foto até o cliente
   enviar os arquivos originais ou um ensaio novo.
3. **Logo vetorial oficial**, para substituir a reprodução em fonte no
   wordmark `n'Brasa`.
4. **Categorias do cardápio:** confirmar se as 6 do site atual (Burgers,
   Espetinhos, Carnes Nobres, Petiscos, Drinks, Sobremesas) prevalecem sobre
   o conjunto ligeiramente diferente que o mockup inicial mostrou.
5. **URL do iFood.** `Conteudo.ifoodUrl` aponta hoje para a home nacional do
   iFood (`ifood.com.br`), não para a página da loja — aguardando confirmação
   do cliente antes de trocar.
6. **Domínio de produção.** `metadataBase`, `robots.ts` e `sitemap.ts` usam
   `https://nbrasa.vercel.app` como placeholder — trocar pelo domínio
   real antes do deploy.

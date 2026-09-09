# Handoff: espiral do Cardápio

Branch `espiral-no-cardapio`, publicado em
`DigiThree-Products/nbrasa-institucional`. Escrito em 2026-09-09 para retomar o
trabalho em outra máquina. Pode ser apagado quando o branch entrar em `main`.

Spec de desenho: `docs/superpowers/specs/2026-09-09-espiral-do-cardapio-design.md`.
Plano: `docs/superpowers/plans/2026-09-09-espiral-do-cardapio.md`.
As regras que valem para mexer no código estão no `CLAUDE.md`, seção
"A espiral do cardápio é hélice calculada".

## Onde parou

O branch está inteiro e verde. Doze commits à frente de `main`, o último é
`83a49d0`.

A cena presa do Cardápio funciona: a bobina sobe, os seis cards pousam na grade
de cinco colunas, e o trilho de dois filetes acompanha a hélice. As duas últimas
entregas foram estas.

**A bobina passa por trás do texto** (`6207964`). Antes ela passava por cima do
título e o deixava ilegível no meio da rolagem. São duas peças que só funcionam
juntas: `RECUO_DO_PLANO`, em `lib/espiral.ts`, empurra a hélice inteira para
trás do plano de pouso, e a reserva, em `components/sections/Cardapio.tsx`, é o
papel opaco que engole o que passa por baixo. Sem o recuo o navegador parte o
card no cruzamento e pinta a metade da frente por cima do papel.

**A beirada da reserva é a silhueta da chama** (`83a49d0`), a pedido do cliente.
Sai de `mascaraChama("reserva")`, em `lib/costura.ts`, a mesma função que faz a
costura do herói.

## Para continuar em outra máquina

```bash
git clone https://github.com/DigiThree-Products/nbrasa-institucional.git
cd nbrasa-institucional
git checkout espiral-no-cardapio
npm install
```

**Três coisas não vêm no git e você precisa levar por fora.** O `.gitignore`
cobre todas de propósito.

| O que | Onde vive | Sem isso |
|---|---|---|
| `.env.local` | raiz | `npm run build` falha ao coletar as páginas |
| `fotos-site/` | raiz, ~34 MB | `npm test` **lança**, ver abaixo |
| `apresentação site/` | raiz, ~85 MB | só os scripts de geração de imagem param |

`npm test` não passa em clone limpo, e isso é intencional:
`tests/unit/owners.test.ts` lê o OTF de origem em
`fotos-site/owners-font-family/` e lança em vez de pular, porque medir a fonte
errada é exatamente o erro que ele existe para impedir. Leve a pasta antes de
rodar a suíte pela primeira vez.

## Comandos que valem aqui

```bash
npm run dev            # preview, hot reload resolve tudo
npm test               # 175 testes, 18 arquivos, ~10s
npm run lint
npx tsc --noEmit
```

O e2e (`npm run e2e`) **não foi rodado neste branch**. Ele sobe o próprio
`npm run build && npm start` na porta 3000 com `reuseExistingServer: false`,
então precisa da porta livre. Rode quando puder derrubar o preview.

## Armadilhas de ambiente, aprendidas do jeito difícil

**Um servidor por diretório.** Dev server e build compartilham o mesmo `.next`.
Rodar `next build` enquanto um `npm run dev` está de pé no mesmo diretório troca
o diretório por baixo do processo: o dev passa a devolver 500 em tudo e um
`next start` serve HTML sem CSS nem JS. Aconteceu nesta sessão. Se acontecer, o
conserto é parar todos os processos daquele diretório, apagar `.next` e subir um
só.

**Isso vale em dobro com worktree.** O worktree tem `.next` próprio, e é fácil
esquecer que o dev server dele não é o da porta 3000 do checkout principal.

## O que continua aberto

Três achados de uma revisão visual, nenhum atacado ainda. Nenhum deles é coberto
por teste.

1. **Os cards já aparecem pousados no instante zero da cena.** Ao chegar na
   seção pela primeira vez os seis estão na grade, sem `transform`, e o trilho
   não existe. Basta rolar um fio e eles saltam para o fundo da hélice e refazem
   o voo. A mesma posição de scroll rende dois estados diferentes conforme você
   já tenha entrado na cena ou não. A causa está em
   `components/sections/FileiraEmEspiral.tsx`: o `onRefresh` chama `medir`, que
   limpa o `transform` de todos os cards, e como o progresso continua zero
   nenhum `onUpdate` repinta. Falta um `pinta` depois de medir. É o conserto
   mais barato dos três.
2. **A cena ocupa sempre metade da tela.** No começo vive no canto inferior
   esquerdo, no fim na metade de cima. Sobra de 40% a 50% de branco em todos os
   quadros. O eixo da bobina é o centro do palco, escolha deliberada registrada
   no `CLAUDE.md`, e é ela que está em questão.
3. **O trilho não some no fim.** Em progresso 1 os dois `path` continuam
   desenhados e sobra um arco vermelho solto na borda de cima, longe de qualquer
   card.

## Números que erram calado

Todos documentados no ponto de uso, e vale ler o comentário antes de mexer.
Nenhum deles quebra nada quando errado, só desenha diferente.

- `CURSO_DA_HELICE` depende de `PASSO_ANGULAR` e de `PASSO_DO_POUSO`.
- `RECUO_DO_PLANO` é a folga mínima que tira a bobina da frente do texto.
- `AJUSTES_DA_RESERVA.meiaLargura` casa as duas camadas de máscara da reserva.
- `AJUSTES.altura` depende de `AJUSTES.escala`, no herói.

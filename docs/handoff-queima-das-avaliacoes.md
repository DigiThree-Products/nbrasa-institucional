# Handoff: a queima das avaliações

Branch `fundo-quem-veio-volta`, publicado em
`DigiThree-Products/nbrasa-institucional`. Escrito em 2026-09-10 para retomar o
trabalho em outra máquina. Pode ser apagado quando o branch entrar em `main`.

As regras que valem para mexer no código estão no `CLAUDE.md`, seção
"As avaliações são reveladas por uma linha de fogo que sobe". Este documento é
transitório e cita commits e contagens que envelhecem sozinhos: não tire fato
daqui sem conferir no código.

## Onde parou

O branch está inteiro e verde, três commits à frente de `main`. Os dois
primeiros são a foto de fundo com véu na seção de avaliações, já aprovados pelo
cliente. O terceiro, `d72a518`, é a queima, e é o assunto deste documento.

O pedido do cliente foi deixar a revelação da seção "Quem veio, volta" fiel à
referência de tipografia em fogo do Dribbble (`Cartoon Fire Typeface 7`),
incluindo a fumaça e a revelação de baixo para cima. Ele escolheu, entre quatro
opções, que "de baixo para cima" significa a máscara subindo por dentro do
glifo, e não a letra se deslocando; e que a fumaça aparece nas duas pontas, na
linha de fogo e na saída da tela.

**Como o gesto ficou.** A letra fica parada e um gradiente de máscara atravessa
a caixa dela de baixo a cima. Abaixo da linha de fogo o glifo é tinta, acima
dela é uma cópia borrada da mesma letra, que é a fumaça. Ao deixar a tela o
texto sobe, desfoca e evapora, e queima de novo na volta.

**São dois consumidores, e a divisão é de orçamento.** O título usa
`TextoQueAcende` com a prop nova `queima`, letra a letra. O subtítulo e os três
cards usam o `Queima`, irmão dele, que põe uma máscara só no bloco e troca a
cópia borrada por um desfoque que limpa junto. Letra a letra nos cards seriam
mais de trezentos elementos mascarados.

**Três correções vieram junto**, todas de defeitos medidos antes de mexer:

1. O estado inicial passou a ser aplicado na montagem, e não no instante do
   gatilho. Antes o texto subia a tela em opacidade cheia, aparecia por volta
   de cem pixels de rolagem, e só então saltava para escondido.
2. Os três cards ganharam atraso escalonado. Eles são irmãos da mesma linha da
   grade e têm o mesmo topo, então os três gatilhos pegavam no mesmo instante.
3. O `Reveal` saiu da seção. O caminho dele sem `saida` ficou sem consumidor na
   interface, com os testes de pé, como o `agruparHorarios`.

## Para continuar em outra máquina

```bash
git clone https://github.com/DigiThree-Products/nbrasa-institucional.git
cd nbrasa-institucional
git checkout fundo-quem-veio-volta
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
npm test               # 256 testes, 25 arquivos, ~12s
npm run lint
npx tsc --noEmit
```

## Como olhar o gesto

Ele dura pouco mais de um segundo e acontece enquanto a seção chega, então
parar a rolagem no lugar errado não mostra nada. O caminho é rolar até o fim da
página em velocidade normal; a seção fecha o site, logo acima do rodapé. Para
rever, suba umas duas telas e desça de novo, porque a queima refaz a cada
travessia.

Para inspecionar quadro a quadro, a linha de fogo é uma propriedade de CSS
legível no console: `--linha-de-fogo` em qualquer `[data-letra]` da seção, que
vai de -26 a 100. Fora da queima ela não existe e não há máscara nenhuma no
elemento, que é o repouso correto.

Em `prefers-reduced-motion: reduce` não há máscara, não há animação, e o texto
fica parado e visível. É o mesmo contrato do resto do site.

## Números que erram calado

Todos documentados no ponto de uso, e vale ler o comentário antes de mexer.
Nenhum deles lança quando errado, só desenha diferente.

- `LINHA_INICIAL` precisa estar uma `MACIEZ` inteira abaixo de zero, senão a
  base da letra nasce já acesa. `LINHA_FINAL` abaixo de 100 deixa o topo do
  glifo sem tinta para sempre. Os dois em `lib/queima.ts`.
- `calc` mal fechado descarta a declaração inteira: a máscara some e a letra
  aparece pronta, sem queima nenhuma. Há teste que conta os parênteses.
- `MACIEZ` é a largura da banda de fogo. Estreita demais devolve a borda dura
  que a máscara existe para evitar; larga demais e a letra fica meio acesa o
  tempo todo, sem fronteira que se leia como chama.
- `PASSO_ENTRE_CARDS`, em `Depoimentos.tsx`, é o que impede a fileira de
  acender de uma vez.
- A cor do fogo não pode ir para a tinta: `brasa` sobre o véu de carvão dá
  1,1:1 e some, a mesma armadilha que trocou a cor das estrelas.

Se o ritmo ficar errado ao olho do cliente, os botões são `DURACAO_DA_QUEIMA` e
`PASSO_DA_QUEIMA` no `TextoQueAcende`, e `DURACAO_DA_QUEIMA` e
`DESFOQUE_INICIAL` no `Queima`.

## O que continua aberto

1. **O e2e não foi rodado neste branch.** Ele sobe o próprio
   `npm run build && npm start` com `reuseExistingServer: false`, e rodar isso
   derruba o preview que estava de pé. A seção de avaliações, aliás, **nunca
   teve teste de e2e nenhum**, antes ou depois desta mudança. O teste que faria
   falta é o de sempre: que o texto da seção está legível com movimento
   reduzido.
2. **Só foi conferido em Chromium.** A máscara é escrita nas duas grafias,
   `mask-image` e `-webkit-mask-image`, mas ninguém abriu isto num Safari de
   verdade. É o navegador onde vale olhar antes de publicar.
3. **Ninguém mede o custo.** São 28 elementos mascarados no título mais quatro
   blocos, e nenhum teste cobra isso, mesma dívida das 163 letras da seção de
   horários. Se engasgar em máquina fraca, o caminho é baixar a queima do
   título de letra para palavra.
4. **Não há pull request aberto.** O branch está publicado e pronto para virar
   um, e leva junto as duas mudanças da foto de fundo.

# Labaredas no foco do herói

Estado em 2026-09-08: **no ar e funcionando**, faltando testes e documentação.
Referência do cliente: "Flame Typography Design, Fiery Text Effect", de Faiaj
Akhter Chowdhury, no Behance (`behance.net/gallery/220023041`).

## O que existe

- `lib/labaredas.ts`: a tabela de topos de haste medidos, a geometria da língua
  e o conjunto posicionado. Função pura, sem dependência de React.
- `components/ui/Labaredas.tsx`: Server Component, SVG embutido, `aria-hidden`,
  faixa absoluta de altura zero que não custa layout.
- `components/sections/Hero.tsx`: o foco mudou de família e de escala, ganhou
  `relative` e `mt`, e renderiza `<Labaredas />` como primeiro filho do span.

## A decisão que destrava tudo

A referência funde letra e fogo num contorno só. Isso **exige haste larga e de
topo chato**: a língua nasce com a espessura da haste e a emenda some.

Enquanto o foco esteve numa manuscrita (Yellowtail, depois Kaushan Script) a
fusão era impossível, porque língua saindo de traço fino e inclinado lê como
cabelo. O máximo que se conseguia era chama flutuando ao lado da palavra, que
não é o efeito pedido. O foco foi para a **Owners XNarrow Black**, a display da
própria marca, e a fusão passou a acontecer sozinha.

Consequências no `Hero.tsx`, todas deliberadas:

- a escala subiu 1,5, porque a XNarrow é 1,62 vez mais estreita que a Kaushan e
  a palavra tinha encolhido na coluna;
- o `ml`/`pr` de compensação ótica saiu, porque existia para letra inclinada;
- o foco ganhou `mt-[.26em]`, que é o único custo de layout do fogo.

## O que não se copia da referência

- **O degradê** de carmim para ouro: a paleta é fechada em carvão, brasa e
  branco, e nenhum tom intermediário passou por medição de contraste.
- **O filete creme grosso**: lá ele separa a chama do fundo vinho. Aqui a
  página é branca e ele sumiria.

Fica brasa chapado, sem contorno e sem degradê.

## Como os números foram medidos

A tabela `PLATOS` não é estimativa. O método:

1. Renderizar o foco sozinho, escondendo as outras duas linhas do `h1` e os
   irmãos, para nenhuma outra tinta entrar no recorte.
2. Para cada coluna de pixel, achar o topo da tinta. Isso dá o perfil superior
   da palavra.
3. Agrupar os trechos em que esse topo varia menos de 4px. Numa fonte de topo
   chato, cada grupo é um **topo de haste**, e dele saem o centro e a largura.

Saíram sete topos, um por letra. As duas grandezas são propriedades da fonte e
da palavra, não do viewport: a posição em `%` não muda com a largura da tela e a
largura em `em` acompanha o corpo sozinha. Por isso um conjunto só serve em
todos os breakpoints.

Medido duas vezes, em corpos diferentes. A primeira leitura tinha um desvio que
crescia para a direita, até 0,7 ponto percentual no "E" final, que é acúmulo de
`tracking` ao longo da palavra. A tabela é a conciliação das duas, e fecha
contra o render com erro máximo de 3px numa palavra de 425px.

### Para remedir

Cole no console, com as labaredas escondidas
(`document.querySelector('h1 span[aria-hidden]').style.visibility = 'hidden'`):

```js
const foco = [...document.querySelector("h1").children][1];
const caixa = foco.getBoundingClientRect();
const corpo = parseFloat(getComputedStyle(foco).fontSize);
({
  corpo,
  caixa: { x: caixa.x, y: caixa.y, w: caixa.width },
  linhaDoTopo: caixa.y + 0.065 * corpo,
});
```

Depois é capturar a tela e rodar a extração de perfil descrita acima. Atenção a
uma armadilha que custou duas rodadas: se a janela estiver com
`devicePixelRatio` diferente de 1, a captura sai em outra escala e as
coordenadas do DOM não batem com os pixels da imagem. Confira
`window.devicePixelRatio` e aplique o fator antes de comparar.

## As três decisões de desenho da língua

Cada uma custou uma tentativa antes de acertar, e estão comentadas em
`linguaDeFogo`:

1. **Base reta, com tangente vertical.** Os dois primeiros pontos de controle
   ficam exatamente sobre as bordas da haste. Empurrá-los para fora alarga a
   língua justamente no encontro e cria um ombro: a chama vira adesivo colado
   em cima da letra. Pelo mesmo motivo não existe multiplicador de largura na
   base, e a ausência é o ponto.
2. **Barriga e inclinação vivem acima da base.** Corpo vertical com gancho só
   no alto lê como chifre, mas o gesto não pode mexer em onde ela encosta.
3. **Os dois pontos de controle vizinhos do bico ficam do mesmo lado dele.** É
   o que dobra a ponta em chicote; em lados opostos a ponta sai reta e o
   conjunto vira coroa.

Haste larga solta **duas** línguas, uma alta e uma baixa, como na referência.
Uma só, com a largura de um topo gordo, fica mais larga que alta e vira
cogumelo. As duas ladrilham o topo com 2% de sobreposição no meio, porque
encostadas sem sobrar o antisserrilhado deixa um fio branco entre elas.

## Restrições de layout que o conjunto respeita

- `FIM_DO_APOIO = 36`: "Sua fome" ocupa os primeiros 36% da largura da palavra.
  À esquerda disso a língua cabe em no máximo `TETO_SOB_APOIO` (0,44 em); à
  direita o espaço é livre. É daqui que sai o skyline irregular, que na
  referência é o efeito inteiro: ele não é gosto, é o que o layout permite.
- **A dominante inclina para a direita.** Inclinada para a esquerda, o bico dela
  voltava para cima de "Sua fome" mesmo com a base fora do vão: o que colide é
  a ponta, não o pé.
- A linha de olho ("Angra dos Reis · Chopperia | Carnes") foi removida do herói
  durante este trabalho, o que liberou a altura de que o fogo precisava.

## Conferido

- 1440x900, 1366x641, 1024x768 e 375x812.
- No 1366x641, que é o caso apertado, o CTA termina em 413px e continua acima da
  dobra; o fogo não entra no cabeçalho.
- Suíte unitária passando (127 testes), lint e typecheck limpos.

## Pendências

1. **Testes de `lib/labaredas.ts`.** Ficaram para depois da validação do
   desenho, para não fixar números que ainda podiam mudar. O que vale cobrir:
   nenhuma labareda à esquerda de `FIM_DO_APOIO` passa de `TETO_SOB_APOIO`; há
   uma dominante só; o conjunto não sobe em rampa; o par ladrilha o platô sem
   abrir vão; `baseNoViewBox` não tem fator de correção.
2. **Teste do componente**, no molde de `tests/unit/Botao.test.tsx`: não
   acrescenta texto ao `h1`, é `aria-hidden`, não ocupa altura.
3. **`CLAUDE.md`**, seção de identidade visual: registrar que o foco do herói
   está na Owners e por quê, e que a tabela de platôs caduca se a família, o
   `tracking` ou o `heroTitulo` mudarem.
4. **E2E**: um caso afirmando que o `h1` continua com a frase inteira e que as
   labaredas não são focáveis. Lembrar que `npm run e2e` sobe na porta 3000.
5. **Painel de admin**: `LABAREDAS` é calibrado para a palavra "acende". Trocar
   `heroTitulo` desalinha o conjunto. Não bloqueia hoje, mas é dívida.

## Para continuar em outra máquina

```bash
git fetch origin
git checkout labaredas-no-acende
npm install
npm run dev -- -p 3001     # a 3000 costuma estar ocupada pela preview
```

`.env.local` não é versionado: copie de `.env.example` e preencha com os valores
do painel do Supabase. Sem ele o `npm run build` falha ao coletar as páginas.

`npm test` também precisa de `fotos-site/`, que está no `.gitignore`, porque
`tests/unit/owners.test.ts` lê o OTF de origem. Sem a pasta ele lança em vez de
pular, de propósito.

# Handoff: borda da foto do herói

Branch `fotos-nos-cards-do-cardapio`, publicado em
`DigiThree-Products/nbrasa-institucional`. Escrito em 2026-09-10 e atualizado
em 2026-09-11, para retomar o trabalho em outra máquina. Pode ser apagado
quando o branch entrar em `main`.

As regras que valem para mexer no código estão no `CLAUDE.md`, seção
"O header é fixo, e o recorte do herói corre atrás dele", atualizada junto com
este trabalho.

## Onde parou

O branch está verde. A última passada está no commit mais recente da branch,
e o push já foi feito.

O pedido do cliente foi puxar a borda da foto do herói para a esquerda, para
aparecer mais foto. `AJUSTES.inicioDaFoto`, em `lib/costura.ts`, foi de `50%`
para `49%` e depois para `48%`, em duas passadas. Em 1920 a borda andou 37px
para a esquerda no total.

**Os 48% são o teto de hoje, e a segunda passada só existiu porque apareceram
20px que ninguém estava usando.** A área clara do header vai do início da
coluna da foto até a barriga da chama, e dela ainda sai o recuo esquerdo que a
logo divide com o herói. O conteúdo do header precisava de 657px, mas 20 deles
eram o `gap-5` cobrado pelo invólucro do hambúrguer, que no desktop tem largura
zero e botão escondido, e mesmo assim seguia sendo item do flex. Com o
invólucro fora, a conta caiu para 637px contra os 646px que a barra oferece em
1920x900.

Duas coisas foram junto, e as duas são de estrutura, não de gosto.

**O número agora mora num lugar só.** Três regras do header repetiam `50%`
escrito à mão: a largura de `.cabecalho-conteudo`, a largura do retângulo
branco (`::before`) e a divisa onde começa a metade mascarada (`::after`). Essa
última é obrigatória: a metade mascarada alinha a chama pela própria borda
esquerda, então a borda tem que cair exatamente onde a foto começa. As quatro
leem `--costura-inicio`, que o `Header` entrega a partir de `AJUSTES`. O e2e
também passou a ler a mesma propriedade, em vez do `0.5` que tinha escrito, e a
medir contra `clientWidth`, que é a largura contra a qual a porcentagem
resolve.

**A navegação ganhou trava contra encolher.** Tentando `48%` apareceu o modo de
falha que ninguém pega olhando borda: o `<nav>` é flex e ENCOLHE quando a área
clara aperta, então "Onde estamos" quebrou em duas linhas dentro de uma barra
de 74px. Nada vazou, nada lançou, nenhuma medida de borda acusou. Com
`shrink-0` e `whitespace-nowrap` faltar espaço vira invasão da foto, que é
exatamente o que o e2e "a navegação do header nunca cai em cima da foto" mede.

**O invólucro do hambúrguer cobrava 20px sem aparecer.** Na segunda passada,
já procurando de onde tirar espaço, apareceu que a `div.cabecalho-menu` fica no
desktop com largura zero e botão `display: none`, mas continua sendo item do
flex, e item de largura zero ainda cobra o `gap-5` que o separa da navegação.
Agora ela leva `md:hidden` e a faixa de 1024 a 1279, onde o hambúrguer volta,
devolve o `display` em `globals.css`. Nada mudou de aparência, e foram esses
20px que pagaram a ida de `49%` para `48%`.

## O que está verificado, e o que não está

Verificado, medindo no navegador contra a build de dev da raiz:

| Janela | Navegação | Folga na barra | Folga até a foto |
|---|---|---|---|
| 375 | hambúrguer | sobra | não se aplica |
| 780 | quatro links, uma linha | sobra | não se aplica |
| 1024x900 | hambúrguer | sobra | 13px |
| 1280x900 | quatro links, uma linha | 22px | 13px |
| 1440x900 | quatro links, uma linha | 19px | 13px |
| 1920x900 | quatro links, uma linha | 9px | 14px, medido em pixel |
| 1920x700 | quatro links, uma linha | menos 3px | 11px, medido em pixel |

A linha de 1920x700 é a única com a barra apertada, e o sinal negativo não é
defeito: a navegação passa a comer o próprio recuo de 24px e continua sem tocar
a foto. Quem garante que ela não encolhe em vez de avançar é o `shrink-0`.

As folgas até a foto de 1920 saem de leitura de pixel na captura, não da
fórmula: **a fórmula é 11px otimista**, porque `6dvh` supõe a barriga a 6 das
116 unidades do desenho e na prática ela cai perto de 4,8%. Quem for apertar
mais esse número precisa medir em pixel, não confiar no `6dvh`.

Também medido no pior scroll, 55% da altura do herói, que é onde a barriga da
chama cruza a faixa do header.

`npm test` passou inteiro, 25 arquivos e 256 testes. `npm run lint` limpo.

**O e2e NÃO foi rodado.** Ele exige a porta 3000 livre e ela estava ocupada por
um dev server em pé. Rodar é o primeiro passo na outra máquina:

```bash
npx playwright test -g "a navegação do header nunca cai em cima da foto"
```

Esse é o teste que este trabalho mais mexeu. A suíte inteira é `npm run e2e`, e
ela sempre roda `npm run build && npm start` antes, então derrube qualquer
preview em pé.

## A decisão que ficou aberta

O cliente pediu mais foto à vista mais de uma vez, e 37px em 1920 pode não
bastar. Daqui não sai mais sem decidir o header, e os dois caminhos que rendem
são visíveis para o visitante:

1. **Soltar o recuo esquerdo da logo no estado do herói.** É o que mais espaço
   libera: em 1920 são 320px parados dentro da área clara. O preço é que a logo
   deixa de alinhar com a primeira linha do título e passa a pular para a
   direita quando a barra se estende, que é o pulo que esse recuo existe para
   evitar. Cuidado com a conta: em 1280 esse recuo já é zero, então este
   caminho não ajuda lá, e o piso passaria a ser ditado por 1280.
2. **Encurtar a navegação.** O candidato é "Onde estamos", 141px com o vão, o
   único dos quatro que não leva a uma seção própria: desde 2026-09-10 ele
   aponta para o rodapé, que é onde o endereço já vive. Sozinho ele renderia
   mais que os dois primeiros pontos percentuais juntos.

**Dois caminhos que parecem bons e não são**, os dois já medidos para não serem
tentados de novo:

- **Alargar a chama não traz a borda para a esquerda**, empurra para a direita.
  A borda visível é a barriga da chama, e ampliar o desenho afasta a barriga da
  coluna. Medido em 1920 com a coluna parada: escala 1,02 põe a borda em 968,
  1,15 em 974 e 1,45 em 987. Encolher renderia 6px, em território que o degrau
  do rodapé proíbe.
- **Subir a faixa do hambúrguer não libera espaço**, porque o piso é ditado por
  1920, que é justamente onde o recuo de `(100vw - 1280px) / 2` é maior. Esta
  versão do handoff listava isso como caminho viável, e estava errada.

## Para continuar em outra máquina

```bash
git clone https://github.com/DigiThree-Products/nbrasa-institucional.git
cd nbrasa-institucional
git checkout fotos-nos-cards-do-cardapio
npm install
```

Peça os arquivos de marca antes de rodar a suíte pela primeira vez:
`npm test` **lança** sem `fotos-site/owners-font-family/`, de propósito. E
`.env.local` precisa das variáveis do `.env.example`, senão o build falha ao
coletar as páginas.

## Uma armadilha que custou tempo nesta sessão

Há um worktree parado em `.claude/worktrees/espiral-cardapio`, na branch
`fundo-quem-veio-volta`, com suíte e `node_modules` próprios. Nesta máquina
**ele estava servindo na porta 3001 enquanto a raiz servia na 3000**, e a
primeira leitura do herói saiu da branch errada sem nada avisar. Antes de olhar
um preview, confirme de onde ele vem:

```bash
git worktree list
```

E, no Windows, de qual pasta cada servidor roda:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object ProcessId,CommandLine
```

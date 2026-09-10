# Handoff: borda da foto do herói

Branch `fotos-nos-cards-do-cardapio`, publicado em
`DigiThree-Products/nbrasa-institucional`. Escrito em 2026-09-10 para retomar o
trabalho em outra máquina. Pode ser apagado quando o branch entrar em `main`.

As regras que valem para mexer no código estão no `CLAUDE.md`, seção
"O header é fixo, e o recorte do herói corre atrás dele", atualizada junto com
este trabalho.

## Onde parou

O branch está verde e o último commit é `39afdd6`, já com push feito.

O pedido do cliente foi puxar a borda da foto do herói para a esquerda, para
aparecer mais foto. `AJUSTES.inicioDaFoto`, em `lib/costura.ts`, foi de `50%`
para `49%`. Em 1920 isso traz a borda 19px para a esquerda.

**Esse 1% é o teto, não uma escolha tímida.** A conta está no comentário do
próprio campo e repetida no `CLAUDE.md`. Resumindo: a área clara do header vai
do início da coluna da foto até a barriga da chama, e dela ainda sai o recuo
esquerdo que a logo divide com o herói. O conteúdo do header precisa de 657px,
e em 1920x900 sobram 665px com `49%`. Já nascia a 27px do limite com `50%`.

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

## O que está verificado, e o que não está

Verificado, medindo no navegador contra a build de dev da raiz:

| Janela | Navegação | Transbordo | Folga até a foto |
|---|---|---|---|
| 1024x900 | hambúrguer | 0 | 24px |
| 1280x900 | quatro links, uma linha | nenhum | 44px |
| 1920x900 | quatro links, uma linha | nenhum | 44px |
| 1920x800 | quatro links, uma linha | nenhum | 44px |
| 1920x700 | quatro links, uma linha | nenhum | positiva |

Também medido no pior scroll, 55% da altura do herói, que é onde a barriga da
chama cruza a faixa: a navegação termina em 922 e a borda da foto começa em
966.

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

O cliente pediu mais foto à vista, e 19px em 1920 é pouco. Andar de verdade
para a esquerda exige decidir o header antes, e os dois caminhos são visíveis
para o visitante:

1. **Soltar o recuo esquerdo da logo no estado do herói.** É o que mais espaço
   libera: em 1920 são 320px parados dentro da área clara. O preço é que a logo
   deixa de alinhar com a primeira linha do título e passa a pular para a
   direita quando a barra se estende, que é o pulo que esse recuo existe para
   evitar.
2. **Subir de 1280px a faixa em que a navegação vira hambúrguer.** Mais simples
   e mais barato de fazer, e tira os quatro links de telas onde eles cabem
   hoje.

Uma terceira, menor: apertar a própria navegação, com vão ou corpo menores. Sai
uns 24px e mexe no desenho do header.

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

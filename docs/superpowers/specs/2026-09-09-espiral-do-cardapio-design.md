# Espiral do Cardápio, revelação em bobina com pouso em fileira

Data: 2026-09-09
Estado: aprovado, pronto para virar plano de implementação
Spec anterior: `2026-09-04-identidade-visual-design.md`, cuja seção 7 desenhou
o bento que este documento remove
Referência externa: `fita.art.br`, seção "Programação completa", código em
`github.com/DigiThree-Products/fita`

## 1. Contexto e objetivo

O cliente pediu, para a seção "Feito na hora, servido no capricho", o mesmo
tratamento que a FITA usa na programação: os cards sobem numa bobina em
espiral e vão parando na posição, um a um.

Objetivo: portar o gesto, não o código. A FITA resolve isso em WebGL, e este
site tem um orçamento de 130 kB de primeira carga que não comporta three.js.
O porte é para CSS 3D dirigido por ScrollTrigger, que já está no projeto.

Este documento também registra a remoção do bento do Cardápio, que é
consequência direta da cena presa e não uma mudança de gosto.

## 2. A referência, e o que dela é portável

### 2.1 O que a FITA faz

Três arquivos, cerca de duas mil linhas: `lib/spiral-reel.ts` (matemática
pura), `components/spiral/spiral-reel-gl.tsx` (render em three.js) e
`components/spiral/spiral-section.tsx` (a cena, o scroll e a entrega).

O mecanismo, em uma frase: os cards ocupam ângulos consecutivos de uma hélice
fixa, a cabeça da fila sobe conforme o progresso da rolagem, e quando um card
alcança certa altura a pose dele congela e ele voa para o slot final ao longo
de um trecho fixo de progresso.

A FITA leva seis cards na bobina, pousa quatro num grid dois por dois e deixa
dois saírem por cima do quadro. A cena consome 300vh de rolagem.

### 2.2 O que não vem junto

| Item | Por quê |
|---|---|
| three.js | Sozinho pesa mais que o orçamento inteiro de primeira carga |
| Dobra do card na bobina | Só existe com malha; CSS 3D entrega plano rígido |
| Esmaecimento por profundidade | Substituído por esmaecimento por altura, que CSS faz |
| Aparato de entrega plano para DOM | Desnecessário aqui, ver 2.3 |
| Dois cards que somem | Aqui os seis são conteúdo, e nenhum pode se apagar |

### 2.3 A simplificação que o porte ganha

Na FITA os planos de WebGL não são os cards do documento, então existe um
aparato inteiro para casar plano com DOM no fim da animação. Aqui quem gira é
o próprio `<article>` do card.

Isso faz o alvo do pouso ser a **transformação identidade**. Não há posição de
destino para calcular nem para medir: o fim da animação é o card sem
transformação nenhuma, no lugar onde o layout já o coloca. É a razão pela qual
`lib/espiral.ts` não mede o DOM em momento algum.

## 3. Decisões tomadas com o cliente

Tomadas em 2026-09-09, nesta ordem:

1. **Cena presa de 300vh**, fiel à referência, e não uma versão curta.
2. **Sem fotos agora.** Os cards sobem como estão hoje. As fotos entrarão
   depois, pelo painel de admin, como fundo do card. O card já nasce preparado
   para receber `fotoPath` sem que a espiral precise ser tocada.
3. **Título preso no alto do palco**, com os cards ocupando a largura inteira.
   Descartado o desenho da FITA, que põe o título numa coluna à esquerda.
4. **A espiral só existe de 1024px para cima.** Abaixo disso os cards entram
   com o `Reveal` de hoje, sem cena presa.
5. **O bento sai.** Os seis cards passam a ser uma fileira única embaixo do
   título. Ver a seção 4, que é o que motivou a decisão.
6. **ScrollTrigger**, e não um laço de quadro próprio. Foi oferecida a
   alternativa sem GSAP, no padrão de `RolagemDoCabecalho`, e o cliente
   preferiu a peça que o site já usa.

## 4. A medição que derrubou o bento

Prender um palco significa deixá-lo parado enquanto a rolagem corre. O que não
couber na tela não é visto durante a cena inteira, então o palco precisa caber
numa janela.

Altura natural da seção, medida no dev server, do topo do título ao pé do
bento:

| Janela | Seção | Visível | Falta |
|---|---|---|---|
| 1024x768 | 1132 px | 768 px | 364 px |
| 1280x800 | 1137 px | 800 px | 337 px |
| 1440x900 | 1137 px | 900 px | 237 px |
| 1920x1080 | 1137 px | 1080 px | 57 px |

Não cabe em nenhum tamanho testado, nem no 1920. A composição dos 1137 px:
título e parágrafo 149, marquee 80, bento 668, respiro vertical 160, mais dois
vãos de 40. Quem estoura é o bento, e dentro dele o tile grande, que pede 440
px de altura sozinho.

Os cinco viewports do Playwright rodam com 900 px de altura, então a suíte
veria o mesmo problema.

Quatro saídas foram postas ao cliente: enxugar o bento, encolher o palco por
escala, prender só o bento, ou prender só em janela alta. Ele escolheu uma
quinta, mais limpa que as quatro: **remover o bento**.

## 5. A seção nova

### 5.1 O que sai

De `components/sections/Cardapio.tsx` saem o grid de quatro colunas, a
constante `VAOS` com os vãos por posição, e o `min-h-[440px]` do tile grande.

O campo `destaque` da tabela `categorias` **já não tinha consumidor na
interface antes desta mudança**, e é preciso registrar isso porque o código diz
o contrário. O comentário dele em `lib/conteudo.tipos.ts` afirma que ele
"substitui a escolha por posição no array", e o `CLAUDE.md` repete a mesma
ideia, mas o `Cardapio` nunca o leu: quem decide o tile grande é `VAOS[i]`, ou
seja, a posição no array, exatamente o que o campo existia para eliminar.
Reordenar categorias no banco move o destaque até hoje.

A remoção do bento não cria esse buraco, ela só o torna definitivo, porque
`VAOS` some junto. O campo continua no banco, no tipo e na fachada, e
`tests/integracao/conteudo.test.ts` continua afirmando que exatamente uma
categoria o tem. Quando o card ganhar foto pelo painel, ele é o candidato
natural a decidir qual card é o maior da fileira. Ver a seção 11.

### 5.2 O que entra

Uma fileira única de seis cards em retrato, embaixo do título.

| Janela | Largura do card | Altura do card | Palco ocupado |
|---|---|---|---|
| 1024x768 | 147 px | 206 px | 607 de 768 |
| 1440x900 | 190 px | 266 px | 703 de 900 |

A largura sai da conta de sempre: a coluna de conteúdo tem no máximo 1280 px
com 24 px de recuo de cada lado, e seis cards com cinco vãos de 18 px dividem
o que sobra. A altura é a largura vezes 1,4, proporção de retrato escolhida
para o card ler como peça de bobina e não como botão.

Sobra altura de palco nas duas janelas, então dá para engordar o card depois
sem refazer conta nenhuma.

### 5.3 O conteúdo do card

Não muda: kicker, nome e descrição sobre creme, com a chama de marca d'água.

A 147 px de largura a descrição fica apertada, então ela só aparece de 1280 px
para cima. Kicker e nome aparecem sempre. O nome mais difícil é
"Carnes Nobres", que é o caso a conferir no navegador.

### 5.4 Abaixo de 1024px

Nada disso vale. A fileira volta a ser a coluna única de hoje, um card embaixo
do outro, cada um com o `Reveal` que já existe. Não há palco, não há cena
presa e não há transformação nenhuma escrita.

## 6. A matemática, em `lib/espiral.ts`

Módulo puro, sem React e sem DOM, pelo mesmo motivo de `lib/tituloHero.ts`,
`lib/horarios.ts` e `lib/cabecalho.ts`: é lógica que erra calada.

### 6.1 Unidades

Tudo em múltiplos da largura e da altura do card, nunca em pixels, pelo mesmo
motivo que a tabela das labaredas vivia em `em`: um conjunto de números serve
os três breakpoints de desktop. O componente multiplica pelas medidas reais na
hora de escrever a transformação.

### 6.2 Constantes da hélice

Convertidas da FITA para proporção. Os três primeiros são os valores dela
divididos pelo tamanho do card dela:

| Nome | Valor | Significado |
|---|---|---|
| `RAIO` | 1,47 largura de card | quanto a bobina se espalha na horizontal |
| `SUBIDA` | 0,5 altura de card por radiano | quanto a hélice sobe |
| `VAO` | 0,067 largura de card | folga entre cards vizinhos na bobina |

O passo angular entre vizinhos é derivado, não escolhido:

```
PASSO_ANGULAR = (1 + VAO) / hypot(RAIO, SUBIDA · proporção)
```

**A `proporção` não é enfeite, é uma conversão de unidade, e esquecê-la é o
erro silencioso mais fácil deste módulo.** `RAIO` está em larguras de card e
`SUBIDA` está em alturas de card, e as duas entram na mesma hipotenusa. Antes
de somar é preciso levar a subida para largura, multiplicando pela proporção
altura sobre largura, que aqui vale 1,4. Sem isso a conta roda, devolve número
plausível e espalha os cards com vão errado ao longo do arco, que é
exatamente o tipo de defeito que não lança.

Com o card em retrato 1:1,4 isso dá 0,655 rad, ou 37,5 graus. É a conta que
mantém as bordas dos cards encostadas ao longo do arco, que é o que faz a fila
ler como corpo contínuo em vez de peças soltas.

### 6.3 Posição na hélice

Para o card de índice `i` num progresso `p`:

```
θ_cabeça(p) = θ_inicial + p · (θ_final - θ_inicial)
θ_i         = θ_cabeça(p) - i · PASSO_ANGULAR

x = RAIO · sen(θ_i)
y = SUBIDA · θ_i
z = RAIO · cos(θ_i) - RAIO
giro = θ_i
```

O `- RAIO` no `z` põe a origem no plano da fileira: em θ igual a zero o card
está em x zero, y zero, z zero e sem giro, ou seja, exatamente no plano onde
ele vai pousar.

### 6.4 O calendário de pouso, e a única conta que amarra tudo

Três constantes de tempo:

| Nome | Valor | Significado |
|---|---|---|
| `POUSO_DO_PRIMEIRO` | 0,42 | progresso em que o card 0 começa a pousar |
| `PASSO_DO_POUSO` | 0,055 | intervalo entre um pouso e o seguinte |
| `DURACAO_DO_VOO` | 0,15 | quanto dura o voo de um card até a identidade |

O último card começa a pousar em 0,695 e termina em 0,845, deixando o fim da
cena para o conjunto assentar.

O curso da hélice **não é escolhido**, é derivado. Para que todo card alcance
a altura de descolamento exatamente no seu instante de pouso, é preciso que:

```
θ_final - θ_inicial = PASSO_ANGULAR / PASSO_DO_POUSO
```

A demonstração é curta: exigir `y_i(pouso(i)) = ALTURA_DE_POUSO` para todo `i`
com `pouso(i)` linear em `i` só é possível se o termo em `i` se anular, e ele
se anula exatamente nessa razão.

Isso é o coração do módulo e a invariante mais importante do teste: **mexer no
passo angular ou no passo do pouso sem recalcular o curso faz o card
descolar na altura errada**. É o mesmo tipo de amarração que
`AJUSTES.altura` tem com `AJUSTES.escala` em `lib/costura.ts`.

`θ_inicial` sai de `SUBIDA · (θ_inicial + POUSO_DO_PRIMEIRO · Δθ) =
ALTURA_DE_POUSO`, com `ALTURA_DE_POUSO` fixada em 1,2 altura de card acima do
plano da fileira.

### 6.5 O voo, e por que o alvo é zero

```
voo(p, i) = suavizar(clamp01((p - pouso(i)) / DURACAO_DO_VOO))
```

A transformação escrita no card é a diferença entre onde a hélice o põe e onde
ele já está:

```
transformação = (1 - voo) · (pose_na_hélice - deslocamento_natural)
```

Com `voo` igual a 1 a transformação é zero exata, sem resíduo de arredondamento
e sem depender de nenhuma medida ter sido lida corretamente. O card parado é o
card sem transformação.

`deslocamento_natural` é o único número que vem do DOM: a distância entre o
centro do card e o centro da fileira. O componente mede uma vez por
redimensionamento e passa ao módulo; o módulo continua puro.

A suavização é `1 - (1 - t)³`, saída rápida e assentamento lento. A FITA usa um
`back` com ultrapassagem, que dá o estalo no lugar. Fica registrado como ajuste
possível, não como partida: ultrapassagem em card de texto sobre fundo claro
tende a ler como tremor.

### 6.6 Esmaecimento

Opacidade cheia enquanto a altura absoluta for menor que 3,4 alturas de card,
apagando por completo além de 4,8. São os valores da FITA convertidos para
proporção. Serve para o card que ainda está fundo na bobina não aparecer
flutuando sobre o título.

### 6.7 API exportada

```
PASSO_ANGULAR, CURSO_DA_HELICE, pousoDoCard(i), poseNaHelice(p, i),
voo(p, i), transformacaoDoCard(p, i, deslocamentoNatural, largura, altura)
```

Nenhuma constante é exportada sem consumidor. Foi um defeito registrado no
`CLAUDE.md` a respeito de `lib/labaredas.ts`, e este módulo não repete.

## 7. O componente de cliente

Arquivo novo, `components/sections/FileiraEmEspiral.tsx`, com `"use client"`.
Ele embrulha a fileira e recebe os cards como filhos, no padrão do `Reveal`.

O `Cardapio` continua Server Component `async` e continua sendo quem chama
`getCategorias`. Os `<article>` continuam saindo do servidor em HTML. Nenhum
conteúdo depende de JavaScript.

### 7.1 Montagem

Importa `gsap` e `gsap/ScrollTrigger` por `await import()`, como `Reveal` e
`RotaMascote` fazem, e cria o gatilho dentro de um `gsap.matchMedia()`:

```
mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
  ScrollTrigger.create({
    trigger: palco, start: "top top", end: "+=300%",
    pin: true, scrub: true, invalidateOnRefresh: true,
    onUpdate: (self) => pinta(self.progress),
  });
  return () => { /* devolve os cards ao estado limpo */ };
});
```

**`matchMedia` e não uma saída antecipada com `window.innerWidth`**, que é o
padrão que `Reveal` e `RotaMascote` usam. Os dois só precisam decidir uma vez,
na montagem, e uma janela que atravessa 1024 px depois disso não os afeta.
Aqui afeta: quem começa em 1400 px e reduz para 900 fica com um palco preso e
uma cena de 300vh num layout de coluna única, e quem faz o caminho inverso não
ganha a cena. O `matchMedia` do GSAP cria e destrói o gatilho nas duas
travessias, e o retorno da função é a limpeza que devolve os cards ao estado
sem transformação.

A mesma condição cobre `prefers-reduced-motion`, que também é reativo: quem
liga a preferência com a página aberta perde a cena na hora, sem recarregar.

A ponte com o Lenis já existe em `SmoothScrollProvider`, que chama
`ScrollTrigger.update` a cada evento de rolagem e roda `lenis.raf` no ticker do
GSAP. Não é preciso `scrollerProxy`.

### 7.2 Quem cria as três telas de rolagem

O espaçador do próprio ScrollTrigger, por conta do `end: "+=300%"`, e **não**
uma altura fixa no CSS.

A diferença importa e é o que resolve a degradação de graça: sem JavaScript, ou
com menos movimento pedido, o gatilho nunca é criado, e aí não existe palco
preso nem 300vh de vazio. A seção fica exatamente com a altura do conteúdo.

Uma altura de 300vh declarada no CSS deixaria três telas em branco para quem
pediu menos movimento, que é o oposto do que a preferência pede.

### 7.3 O que ele escreve

Em `onUpdate`, para cada card:

```
transform: translate3d(x px, y px, z px) rotateY(g deg)
opacity: o
```

A fileira recebe `perspective` e `transform-style: preserve-3d`. O `scrub` já
limita a taxa ao quadro, então não é preciso um `requestAnimationFrame`
próprio.

### 7.4 Ordem de pouso

Da esquerda para a direita, que é a ordem do índice e a ordem de leitura. A
FITA usa ordem de varredura porque o destino dela é um grid de duas linhas;
numa fileira única a questão não existe.

## 8. Degradação

| Situação | O que acontece |
|---|---|
| Sem JavaScript | Fileira estática, seis cards, altura natural |
| `prefers-reduced-motion` | Idem, e nenhuma transformação é escrita |
| Menos de 1024 px | Coluna única com `Reveal`, como hoje |
| GSAP falha ao carregar | Fileira estática; o `await import()` já é tolerante |

Nenhum card tem link ou elemento focável hoje, então a cena presa não cria
armadilha de foco. Se o card virar link quando ganhar foto, isso muda, e fica
registrado aqui como o ponto a revisitar.

## 9. Testes

### 9.1 Unitário da matemática, `tests/unit/espiral.test.ts`

1. Em progresso 1, todo card tem transformação zero em todos os eixos.
2. `pousoDoCard` é estritamente crescente, e não há dois pousos coincidentes.
3. O último card termina o voo antes do fim do percurso.
4. O curso da hélice é o passo angular dividido pelo passo do pouso, e cada
   card cruza a altura de descolamento no seu instante de pouso. É a
   invariante da seção 6.4.
5. O passo angular mantém as bordas encostadas: o comprimento de arco entre
   vizinhos é a largura mais o vão.
6. A opacidade fica sempre entre 0 e 1.
7. O voo é monótono e vale zero antes do pouso.

### 9.2 Unitário do componente, `tests/unit/FileiraEmEspiral.test.tsx`

1. Sob `prefers-reduced-motion`, os seis filhos aparecem e nenhum estilo de
   transformação é escrito.
2. Abaixo de 1024 px de largura, idem.
3. Os filhos são renderizados na ordem recebida nos dois casos.

O esboço de `ResizeObserver` já existe em `tests/setup.ts`.

### 9.3 Ponta a ponta, no fim de `tests/e2e/home.spec.ts`

Combinado com a outra sessão que trabalha no mesmo repositório: ela mexe
apenas no bloco do fecho do título, os testes novos vão para o fim do arquivo.

1. As seis categorias aparecem nos cinco viewports.
2. Em w320 e w768 não existe palco preso.
3. Em w1440, rolando até o fim da cena, os seis cards terminam sem
   transformação e dentro da fileira.
4. Sob movimento reduzido, a seção continua listando as seis categorias.

## 10. Orçamento de performance

Primeira carga: zero byte novo. GSAP e ScrollTrigger já entram por importação
tardia e já são baixados pelo `Reveal` na mesma página.

Custo de quadro: seis elementos com `translate3d` e `rotateY`, que o compositor
resolve sem recalcular layout. É menos trabalho por quadro do que a rota do
mascote, que anima caminho em SVG.

O que **não** entra: three.js, `next/image`, qualquer arquivo de imagem.

## 11. Fora do escopo

1. As fotos dos cards. Decisão do cliente: virão pelo painel de admin.
2. A dobra do card na bobina, que exigiria WebGL.
3. O campo `destaque`, que já não tinha consumidor na interface e continua no
   banco, no tipo e na fachada. Ligar o destaque ao tamanho do card na fileira
   é trabalho de outra leva, junto com a foto.
4. A `ParedeDeTipos`, que permanece onde está, entre o texto e a fileira.
5. Qualquer alteração em `contraste.test.ts`, já que nenhum par novo de cor
   nasce aqui.

## 12. Riscos

1. **`pin` e header fixo.** O `pin` do ScrollTrigger insere espaçador e fixa o
   elemento, e este site tem header fixo cuja máscara é posicionada por
   `scrollY` a cada quadro. A conta do header depende da altura do herói, não
   da altura desta seção, então não se espera briga. É previsão, e só o
   navegador confirma. Conferir em 1024 e em 1440.
2. **Nome de categoria em card estreito.** Seis cards de 147 px numa janela de
   1024 é pouca largura para display. "Carnes Nobres" é o caso difícil.
3. **Árvore compartilhada.** Outra sessão está editando `Hero.tsx`,
   `app/layout.tsx` e `app/globals.css` em paralelo, com troca da fonte do foco
   do herói. Remedir antes de fechar.
4. **`scrub` e Lenis em janela curta.** Com 300vh de cena e rolagem suave, o
   fim da cena pode chegar com atraso perceptível. Se incomodar, o ajuste é o
   número do `scrub`, não a duração da cena.

## 13. Sequenciamento sugerido

1. `lib/espiral.ts` e `tests/unit/espiral.test.ts`, por TDD, sem tocar em
   componente nenhum.
2. Reforma do `Cardapio.tsx`: bento sai, fileira entra, ainda sem movimento.
   Aqui a suíte e2e já deve passar, porque o conteúdo não mudou.
3. `FileiraEmEspiral.tsx` e o teste unitário dele.
4. Ligar a cena no `Cardapio`, conferir no navegador em 1024 e 1440.
5. Testes e2e novos no fim do arquivo, avisando a outra sessão antes.
6. Atualizar o `CLAUDE.md`: a seção do Cardápio, a fronteira cliente e
   servidor, que passa de sete para oito arquivos de cliente, e a lista de
   consumidores da fachada, que não muda mas fica ao lado.

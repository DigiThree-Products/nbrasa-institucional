/**
 * A bobina em espiral do Cardápio: onde cada card está em cada instante da
 * cena presa, e por onde passa o trilho que ele percorre.
 *
 * O gesto vem da seção "Programação completa" da FITA (`fita.art.br`), que o
 * resolve em WebGL (`lib/spiral-reel.ts` de lá). Aqui ele é CSS 3D, porque
 * three.js sozinho estoura o orçamento de primeira carga deste site. Ver
 * `docs/superpowers/specs/2026-09-09-espiral-do-cardapio-design.md`.
 *
 * Este módulo é puro: não importa nada, não toca no DOM e não sabe que React
 * existe. Fica assim pelo mesmo motivo de `lib/tituloHero.ts` e
 * `lib/horarios.ts`: é lógica que erra calada. Uma hélice mal parametrizada
 * não lança exceção nenhuma, ela só espalha os cards errado.
 *
 * ── A simplificação que sustenta o arquivo inteiro ──────────────────────────
 * Quem gira aqui é o próprio `<article>` do card, e não um plano de WebGL
 * separado como na FITA. Por isso o alvo do pouso é a TRANSFORMAÇÃO
 * IDENTIDADE: o fim da animação é o card sem transformação, na célula da grade
 * onde o layout já o coloca. Não há posição de destino para calcular nem para
 * medir, e por isso este módulo não mede o DOM em momento algum. A FITA precisa
 * de um aparato inteiro de entrega (`handoff`, `alvoDoRetangulo`) justamente
 * porque os planos dela não são os cards.
 *
 * ── Os números vieram da referência, e não do olho ──────────────────────────
 * Cada constante geométrica abaixo é a da FITA convertida para as unidades
 * daqui: lá o mundo é medido em unidades de three.js com o card valendo 3,0 de
 * largura por 2,0 de altura; aqui `x` e `z` estão em LARGURAS de card e `y` em
 * ALTURAS. Toda constante traz a conta da conversão junto, para a próxima
 * pessoa poder conferir contra o arquivo de lá sem refazer nada.
 */

/**
 * Altura sobre largura do card da fileira. O card é paisagem 3:2, o mesmo
 * crop da FITA (`CARD_ASPECT = 3 / 2`, portanto altura/largura = 2/3).
 *
 * Não é enfeite: ela é a conversão de unidade que o passo angular precisa.
 * `RAIO` está em larguras de card e `SUBIDA` em alturas, e as duas entram na
 * mesma hipotenusa.
 */
export const PROPORCAO = 2 / 3;

/**
 * Raio da hélice, em larguras de card. Quanto a bobina se espalha.
 *
 * FITA: `SPIRAL.radius` 4,4 sobre `SPIRAL_CARD_W` 3,0.
 */
export const RAIO = 4.4 / 3;

/**
 * Subida da hélice, em alturas de card por radiano.
 *
 * FITA: `SPIRAL.climb` 1,0 sobre `SPIRAL_CARD_H` 2,0.
 *
 * Ela não é livre: entra na hipotenusa do passo angular, então mexer aqui
 * muda o espaçamento entre os cards junto. Quem manda na separação que se vê
 * é o arco, não o ângulo.
 */
export const SUBIDA = 1 / 2;

/**
 * Folga entre cards vizinhos na bobina, em larguras de card.
 *
 * FITA: `SPIRAL_GAP` 0,2 sobre `SPIRAL_CARD_W` 3,0. É um vão quase nulo, e é
 * ele que faz a fila ler como UM CORPO CONTÍNUO, a cobra da referência, e não
 * como conta de rosário. Separar os cards aqui desmancha o gesto inteiro: sem
 * as bordas se encostando não há banda, só seis retângulos em órbita.
 */
export const VAO = 0.2 / 3;

/**
 * Passo angular entre vizinhos, em radianos. Derivado, não escolhido.
 *
 * É o ângulo que faz o comprimento de arco entre dois cards valer a largura
 * mais o vão, portanto o que encosta as bordas. Com os valores acima dá
 * 0,7092 rad, o mesmo número que `dTheta()` devolve na FITA.
 *
 * O `SUBIDA * PROPORCAO` é a conversão citada acima, e esquecê-la é o erro
 * silencioso mais fácil deste arquivo: a conta roda, devolve número plausível
 * e espalha os cards com vão errado. Há teste cobrando exatamente isso.
 */
export const PASSO_ANGULAR = (1 + VAO) / Math.hypot(RAIO, SUBIDA * PROPORCAO);

/** Quantos cards a bobina carrega. São as seis categorias do cardápio. */
export const CARDS_NA_BOBINA = 6;

/** Quanto dura o voo de um card, do descolamento até a identidade.
 *
 * FITA: `SPIRAL.peelDurP`. */
export const DURACAO_DO_VOO = 0.15;

/**
 * Intervalo de progresso entre um pouso e o seguinte.
 *
 * Aqui a referência NÃO pôde ser copiada, e a diferença tem causa: na FITA só
 * quatro dos seis cards pousam, os outros dois seguem subindo e saem de
 * quadro, o que enche o fim da cena sem precisar de card pousando. As seis
 * categorias do cardápio pousam todas, então o intervalo é o que faz o último
 * voo terminar no último quadro em vez de deixar rolagem morta no fim.
 *
 * O número sai de uma conta, não do olho: com o voo em 0,15 e seis cards,
 * `POUSO_DO_PRIMEIRO + 5 * PASSO_DO_POUSO + DURACAO_DO_VOO` tem que dar 1.
 */
export const PASSO_DO_POUSO = 0.045;

/**
 * Progresso em que o primeiro card começa a pousar.
 *
 * Alto de propósito, e é o preço de ter seis cards pousando em vez de quatro:
 * a cascata inteira precisa caber no fim da cena, então ela começa tarde e a
 * bobina ganha um trecho longo de subida limpa. Na FITA o primeiro pouso sai
 * em 0,477 e sobra tela para o painel de informação desdobrar depois; aqui
 * não há painel, e o que ocupa o fim é a própria cascata.
 */
export const POUSO_DO_PRIMEIRO = 1 - DURACAO_DO_VOO - (CARDS_NA_BOBINA - 1) * PASSO_DO_POUSO;

/**
 * Curso total da hélice, em radianos. Derivado, e a derivação é o coração
 * deste módulo.
 *
 * Exigir que todo card alcance a altura de descolamento exatamente no seu
 * instante de pouso, com os pousos igualmente espaçados, só é possível nesta
 * razão: o termo que depende do índice se anula, e sobra uma condição que não
 * depende de qual card é. A FITA obedece à mesma identidade sem escrevê-la,
 * porque lá o curso (`headEndY - headStartY` sobre `climb`, 20,6 rad) e o
 * passo do pouso (`dThetaClimb` sobre o mesmo curso) saem das mesmas duas
 * grandezas.
 *
 * **Mexer no passo angular ou no passo do pouso sem recalcular isto faz o card
 * descolar na altura errada.** É a mesma amarração que `AJUSTES.altura` tem
 * com `AJUSTES.escala` em `lib/costura.ts`, e pelo mesmo motivo: erra calada.
 */
export const CURSO_DA_HELICE = PASSO_ANGULAR / PASSO_DO_POUSO;

/**
 * Altura de descolamento, em alturas de card acima do EIXO da bobina.
 *
 * FITA: `SPIRAL.peelY` 4,6 sobre `SPIRAL_CARD_H` 2,0. O card sobe até o topo
 * da bobina, que fica junto à borda de cima do palco, e só ali descola para a
 * célula dele na grade. É isso que faz o voo ser um mergulho para dentro da
 * grade, e não um encaixe curto, e é o que separa esta versão da anterior, em
 * que o card pousava a 0,1 altura do próprio destino e o gesto sumia.
 *
 * O eixo da bobina é o CENTRO DO PALCO, não o centro da grade: quem mede o
 * deslocamento natural de cada card é o componente, e ele mede contra o palco.
 * Assim a bobina varre o meio da tela e os cards voam para a coluna da
 * direita, como na referência.
 */
export const ALTURA_DE_POUSO = 4.6 / 2;

/**
 * Ângulo da cabeça da fila no começo da cena.
 *
 * Sai de exigir que o card 0 esteja na altura de descolamento no instante
 * `POUSO_DO_PRIMEIRO`. Com os valores atuais dá cerca de −5,25 rad, o que põe
 * a cabeça 2,6 alturas de card abaixo do eixo, ou seja logo abaixo da borda de
 * baixo do palco, e o resto da cobra mais abaixo ainda. É o mesmo lugar de
 * onde a FITA parte depois de ter corrigido o `headStartY` dela duas vezes
 * pelo mesmo motivo: cabeça longe demais deixa a seção vazia no começo.
 */
export const THETA_INICIAL =
  ALTURA_DE_POUSO / SUBIDA - POUSO_DO_PRIMEIRO * CURSO_DA_HELICE;

/**
 * Distância do olho ao plano de pouso, em larguras de card. Vira o
 * `perspective` do CSS, em pixels, quando o componente multiplica pela largura
 * medida do card.
 *
 * FITA: a câmera está em `cameraZ` 9,5 e a grade em `gridZ` 2,6, portanto 6,9
 * unidades de mundo, ou 2,3 larguras de card. Não é número solto: é ele que
 * decide o quanto o lado de trás da bobina encolhe, e portanto se a espiral lê
 * como espiral ou como oval achatado. Com este valor o fundo da bobina sai a
 * 44% do tamanho da frente, contra os 37% da referência.
 */
export const DISTANCIA_DA_CAMERA = 2.3;

/**
 * Quanto o card é maior na bobina do que depois de pousado.
 *
 * FITA: `SPIRAL_CARD_SIZE` 2,0 sobre `GRID_CARD_SIZE` 1,43, ou seja o inverso
 * do `GRID_SCALE` de lá. A geometria da hélice é construída no tamanho da
 * BOBINA, e o tamanho da grade é alcançado encolhendo essa mesma geometria
 * durante o voo.
 *
 * Portar isto não é capricho, é o que faz a bobina dominar a tela. Sem a
 * ampliação a cena roda igual e lê pequena: os cards passam do tamanho que vão
 * ter parados, e a banda vira um cordão fino no meio de muito branco. Com ela
 * o card cresce 40% enquanto voa, que é exatamente a diferença entre a
 * referência e uma imitação tímida dela.
 *
 * Ela é também a unidade de TODA a geometria deste módulo: `RAIO`, `VAO` e o
 * afastamento do trilho estão em larguras de card DA BOBINA, e por isso quem
 * mede o card no DOM precisa multiplicar por ela antes de usar qualquer coisa
 * daqui. `transformacaoDoCard` já faz isso; o trilho recebe a unidade pronta.
 */
export const ESCALA_NA_BOBINA = 2 / 1.43;

/** A largura do card enquanto ele está na bobina, a partir da medida do DOM. */
export function larguraNaBobina(larguraMedida: number): number {
  return larguraMedida * ESCALA_NA_BOBINA;
}

/**
 * Onde um card está na hélice. `x` e `z` em larguras, `y` em alturas.
 *
 * **`y` cresce para BAIXO**, como no CSS, e não para cima como em geometria.
 * A convenção está escrita aqui porque a troca dela já custou uma versão
 * inteira: o módulo calculava para cima, o componente escrevia direto num
 * `translate3d`, e a bobina descia em vez de subir. Ninguém percebeu de
 * imediato, porque uma espiral invertida continua parecendo uma espiral.
 */
export type Pose = { x: number; y: number; z: number; giro: number };

/** O que vai para o `transform` do card, já em pixels e radianos. */
export type Transformacao = {
  x: number;
  y: number;
  z: number;
  giro: number;
  /** 1 é o card pousado; na bobina vale `ESCALA_NA_BOBINA`. */
  escala: number;
};

/** Distância do card à sua célula na grade, em pixels, nos dois eixos. */
export type Deslocamento = { x: number; y: number };

const entre0e1 = (v: number) => Math.min(1, Math.max(0, v));

/** Progresso em que o card de índice `indice` começa a pousar. */
export function pousoDoCard(indice: number): number {
  return POUSO_DO_PRIMEIRO + indice * PASSO_DO_POUSO;
}

/** Ângulo da cabeça da fila num dado instante da cena. */
export function thetaDaCabeca(progresso: number): number {
  return THETA_INICIAL + progresso * CURSO_DA_HELICE;
}

/**
 * Onde a hélice põe o card, ignorando o pouso.
 *
 * O `- RAIO` no `z` põe a origem no plano de pouso: em giro zero o card está
 * exatamente na profundidade em que vai assentar, o que faz a emenda entre
 * hélice e identidade não ter salto, e garante que a bobina inteira fique
 * ATRÁS desse plano, nunca à frente dele.
 */
export function poseNaHelice(progresso: number, indice: number): Pose {
  const giro = thetaDaCabeca(progresso) - indice * PASSO_ANGULAR;
  return {
    // O seno vem NEGADO, e isso e o espelho que o render da FITA aplica em
    // `mundoX = -p[0]`. Sem ele a bobina gira para o outro lado e o card
    // descola na esquerda, longe da grade, atravessando a tela inteira de
    // volta. Com ele o descolamento acontece do lado da grade, que e o que se
    // ve na referencia.
    x: -RAIO * Math.sin(giro),
    // o sinal negativo é a conversão para o eixo do CSS, ver `Pose`: giro
    // começa negativo, então o card começa embaixo e sobe conforme a cena anda
    y: -SUBIDA * giro,
    z: RAIO * Math.cos(giro) - RAIO,
    giro,
  };
}

/**
 * Ultrapassagem do pouso, o `backOut` da referência.
 *
 * O card passa um pouco da célula e volta, assentando EXATAMENTE em 1 no fim,
 * sem deriva sobrando. É o estalo físico do encaixe, e é o que a FITA usa no
 * `peel` (`backOut`, ultrapassagem 1,7). A versão anterior deste arquivo usava
 * uma saída cúbica sem ultrapassagem, por receio de o estalo virar tremor num
 * card de texto; com o card maior e o voo mais longo dá para ver que é estalo,
 * e o gesto sem ele fica manso perto da referência.
 */
const ULTRAPASSAGEM = 1.7;

function comEstalo(t: number): number {
  const x = t - 1;
  return 1 + (ULTRAPASSAGEM + 1) * x * x * x + ULTRAPASSAGEM * x * x;
}

/**
 * Quanto do voo já foi cumprido: 0 na hélice pura, 1 pousado.
 *
 * Pode passar de 1 no meio do caminho, e é de propósito: é a ultrapassagem
 * acima. Só o valor em `t = 1` é garantido exato.
 */
export function voo(progresso: number, indice: number): number {
  const t = entre0e1((progresso - pousoDoCard(indice)) / DURACAO_DO_VOO);
  // `comEstalo(0)` é zero na álgebra e −2,2e−16 em ponto flutuante, porque 2,7
  // e 1,7 não são exatos em binário. A diferença não move pixel nenhum, mas
  // tira do módulo a única garantia que ele dá de graça: card antes do
  // descolamento é card na hélice pura, sem resíduo somado.
  return t <= 0 ? 0 : comEstalo(t);
}

/**
 * A transformação a escrever no card, em pixels e radianos.
 *
 * `deslocamento` é a distância em pixels entre o centro do card e o eixo da
 * bobina, e é o único número que vem do DOM. Ele entra aqui porque a
 * transformação é RELATIVA à posição que o layout já deu ao card: subtrair o
 * deslocamento é o que faz o alvo ser a identidade em vez do eixo. Agora ele
 * tem duas componentes, e não só a horizontal: os cards pousam numa GRADE de
 * duas colunas, então cada um tem também uma distância vertical própria até o
 * eixo.
 *
 * Com o voo em 1 o fator zera e os quatro eixos saem zero exato, sem resíduo
 * de arredondamento e sem depender de nenhuma medida ter sido lida certo. O
 * card parado é o card sem transformação.
 */
export function transformacaoDoCard(
  progresso: number,
  indice: number,
  deslocamento: Deslocamento,
  largura: number,
  altura: number,
): Transformacao {
  const restante = 1 - voo(progresso, indice);
  if (restante === 0) return { x: 0, y: 0, z: 0, giro: 0, escala: 1 };

  /**
   * A pose CONGELA no instante do descolamento, e o voo interpola dela até a
   * identidade. É o que a FITA faz (`climbSp = Math.min(progress, peelP)`).
   *
   * Sem o congelamento a hélice continua girando durante o voo, e o card
   * ultrapassa o ponto de descolamento enquanto deveria estar assentando. De
   * quebra, o voo deixa de ser curvo: o card sai de um ponto fixo e vai direto
   * ao lugar dele, em vez de continuar balançando enquanto assenta.
   */
  const pose = poseNaHelice(Math.min(progresso, pousoDoCard(indice)), indice);
  // A hélice é medida no card DA BOBINA, que é maior que o card da grade. Usar
  // a medida crua do DOM aqui encolheria a bobina inteira em 28% e desgrudaria
  // as bordas dos cards, porque o vão continuaria valendo a largura ampliada.
  const larguraDaBobina = largura * ESCALA_NA_BOBINA;
  const alturaDaBobina = altura * ESCALA_NA_BOBINA;
  return {
    x: restante * (pose.x * larguraDaBobina - deslocamento.x),
    y: restante * (pose.y * alturaDaBobina - deslocamento.y),
    z: restante * (pose.z * larguraDaBobina),
    giro: restante * pose.giro,
    escala: 1 + (ESCALA_NA_BOBINA - 1) * restante,
  };
}

/* ── O trilho ───────────────────────────────────────────────────────────────
 *
 * Os dois filetes que correm rente às bordas dos cards são metade do gesto da
 * referência: sem eles a bobina é um punhado de retângulos girando, com eles
 * ela vira um trem sobre trilho. Na FITA são tubos de WebGL; aqui são dois
 * `path` de SVG, e é por isso que este módulo precisa saber projetar a hélice.
 *
 * Os pontos saem daqui em LARGURAS de card nos três eixos, inclusive em `y`.
 * `poseNaHelice` devolve `y` em alturas porque quem consome é o `translate3d`
 * do card, que tem a altura dele à mão; o trilho não tem card nenhum, e mistura
 * de unidade num deslocamento perpendicular à curva daria torto.
 */

/** Subida da hélice em LARGURAS de card por radiano. */
const SUBIDA_EM_LARGURAS = SUBIDA * PROPORCAO;

/** Comprimento de arco por radiano, em larguras de card. */
const ARCO_POR_RADIANO = Math.hypot(RAIO, SUBIDA_EM_LARGURAS);

/** Um ponto da bobina, em larguras de card nos três eixos, `y` para baixo. */
export type PontoDaBobina = { x: number; y: number; z: number };

/**
 * Pontos ao longo da hélice, no mesmo caminho que os cards percorrem.
 *
 * É isto que faz o trilho ser o trilho, e não uma espiral parecida desenhada
 * por cima: os dois saem da mesma equação, então não têm como divergir.
 *
 * `afastamento` desliza a linha perpendicular à curva, no plano do card: 0
 * passa pelo CENTRO dos cards, positivo desce para a borda de baixo e negativo
 * sobe para a de cima. Passar pelo centro é geometricamente certo e
 * visualmente ruim, porque a linha corta o card ao meio justo na curva da
 * frente, onde a perspectiva amplia. Meia altura de card põe o filete rente à
 * borda, que é o que se vê na referência.
 */
export function pontosDaBobina(
  de: number,
  ate: number,
  passos: number,
  afastamento = 0,
): PontoDaBobina[] {
  const pontos: PontoDaBobina[] = [];
  const n = Math.max(2, Math.round(passos));
  for (let i = 0; i <= n; i++) {
    const giro = de + ((ate - de) * i) / n;
    const seno = Math.sin(giro);
    const cosseno = Math.cos(giro);
    // A perpendicular que aponta para BAIXO na tela. É menos `normal ×
    // tangente`, com a normal em (−sen, 0, cos) e a tangente em (−R cos,
    // −subida, −R sen), as duas já espelhadas em x e já no eixo do CSS com y
    // para baixo. Vem unitária.
    const paraBaixo = {
      x: (-SUBIDA_EM_LARGURAS * cosseno) / ARCO_POR_RADIANO,
      y: RAIO / ARCO_POR_RADIANO,
      z: (-SUBIDA_EM_LARGURAS * seno) / ARCO_POR_RADIANO,
    };
    pontos.push({
      x: -RAIO * seno + paraBaixo.x * afastamento,
      y: -SUBIDA_EM_LARGURAS * giro + paraBaixo.y * afastamento,
      z: RAIO * cosseno - RAIO + paraBaixo.z * afastamento,
    });
  }
  return pontos;
}

/** Meia altura do card, em larguras: o afastamento que põe o filete na borda. */
export const AFASTAMENTO_DA_BORDA = PROPORCAO / 2;

/**
 * Comprimento do trilho depois de assentado, em radianos.
 *
 * O corpo da cobra mais uma sobra curta, para o filete continuar existindo
 * atrás do último card em vez de acabar exatamente na borda dele. A sobra é
 * pequena de propósito: em 1,2 rad o trilho avançava quase dois cards além da
 * cauda e desenhava uma alça solta no vazio, longe de qualquer card, que lia
 * como risco perdido e não como trilho.
 */
export const COMPRIMENTO_DO_TRILHO = (CARDS_NA_BOBINA - 1) * PASSO_ANGULAR + 0.3;

/** Em que ponto da cena o trilho começa a existir. */
export const ENTRADA_DO_TRILHO = 0.04;

/** Quanto tempo ele leva para se desenrolar até o comprimento cheio. */
export const DESENROLO_DO_TRILHO = 0.16;

/**
 * A fatia da hélice que o trilho ocupa num dado instante.
 *
 * A ponta nasce colada na cabeça e o corpo se desenrola PARA TRÁS até alcançar
 * o comprimento da cobra, que é literalmente o gesto de assentar trilho atrás
 * da locomotiva. A FITA chegou a esta forma depois de tentar o caminho óbvio,
 * atrasar o progresso do trilho inteiro, e descobrir que atraso de progresso
 * desloca o trilho no ESPAÇO: a janela caía numa volta anterior da espiral e
 * cruzava a bobina na diagonal. Desenrolando, a janela vive sempre dentro de
 * [ponta − cauda, ponta] e nunca escapa para outra volta.
 *
 * `atraso` é em radianos, e é o tempero que faz um filete vir um pouco antes
 * do outro sem que os dois deixem de acompanhar a mesma borda dos cards.
 */
export function janelaDoTrilho(
  progresso: number,
  atraso = 0,
): { de: number; ate: number } {
  const ponta = thetaDaCabeca(progresso) - atraso;
  const t = entre0e1((progresso - ENTRADA_DO_TRILHO) / DESENROLO_DO_TRILHO);
  const desenrolado = 1 - Math.pow(1 - t, 3);
  return { de: ponta - COMPRIMENTO_DO_TRILHO * desenrolado, ate: ponta };
}

/**
 * Projeta um ponto da bobina na tela, em pixels relativos ao eixo.
 *
 * É a MESMA projeção que o navegador faz nos cards: com `perspective: P` no
 * pai e a origem da perspectiva sobre o eixo, um filho em `translate3d(x, y,
 * z)` aparece em `(x, y) * P / (P − z)`. Refazer a conta aqui é o que mantém o
 * trilho e os cards no mesmo espaço; qualquer aproximação faria a linha
 * escorregar dos cards conforme a bobina gira.
 *
 * `largura` é a largura medida do card em pixels, que é a unidade em que os
 * pontos da bobina vêm.
 */
export function projetarNoPalco(
  ponto: PontoDaBobina,
  largura: number,
): { x: number; y: number } {
  const distancia = DISTANCIA_DA_CAMERA * largura;
  const escala = distancia / (distancia - ponto.z * largura);
  return { x: ponto.x * largura * escala, y: ponto.y * largura * escala };
}

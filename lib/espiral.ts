/**
 * A bobina em espiral do Cardápio: onde cada card está em cada instante da
 * cena presa.
 *
 * O gesto vem da seção "Programação completa" da FITA (`fita.art.br`), que o
 * resolve em WebGL. Aqui ele é CSS 3D, porque three.js sozinho estoura o
 * orçamento de primeira carga deste site. Ver
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
 * IDENTIDADE: o fim da animação é o card sem transformação, no lugar onde o
 * layout já o coloca. Não há posição de destino para calcular nem para medir,
 * e por isso este módulo não mede o DOM em momento algum.
 */

/**
 * Altura sobre largura do card da fileira.
 *
 * Não é enfeite: ela é a conversão de unidade que o passo angular precisa.
 * `RAIO` está em larguras de card e `SUBIDA` em alturas, e as duas entram na
 * mesma hipotenusa.
 */
export const PROPORCAO = 1.4;

/** Raio da hélice, em larguras de card. Quanto a bobina se espalha. */
export const RAIO = 1.47;

/**
 * Subida da hélice, em alturas de card por radiano.
 *
 * **É este número, e não o raio nem o vão, que decide se o card entra por
 * baixo ou pelo lado.** Era 0,5, o valor da FITA, e o card entrava pelo lado:
 * medido em 1440, do instante em que ele aparece até o pouso ele subia 289px
 * enquanto andava 437px na horizontal, então o olho lia balanço lateral e não
 * subida. Em 1,1 a conta inverte, 539px de subida contra 355px de lado, e a
 * bobina passa a vir de baixo. Pedido do cliente em 2026-09-09.
 *
 * Ela não é livre: entra na hipotenusa do passo angular, então mexer aqui
 * muda o espaçamento entre os cards junto. Subir a subida deixa a hélice mais
 * esticada, o que aumenta o arco por radiano e, para o mesmo vão, diminui o
 * passo angular. Quem manda na separação que se vê é o arco, não o ângulo.
 */
export const SUBIDA = 1.1;

/**
 * Folga entre cards vizinhos na bobina, em larguras de card.
 *
 * Era 0,067, o valor da FITA, onde os cards se tocam e a fila lê como um corpo
 * contínuo, uma cobra. Aqui o cliente pediu os cards separados, então são
 * 0,35, ou 67px de vão num card de 190px. A fila deixa de ser corpo contínuo e
 * passa a ser conta de rosário, que é uma decisão de desenho e não um desvio
 * acidental da referência.
 */
export const VAO = 0.35;

/**
 * Passo angular entre vizinhos, em radianos. Derivado, não escolhido.
 *
 * É o ângulo que faz o comprimento de arco entre dois cards valer a largura
 * mais o vão. Com o vão da FITA isso encostava as bordas; com o vão atual ele
 * reserva a largura do card mais os 0,35 de folga que o cliente pediu. Em
 * qualquer dos dois, quem manda na separação que se vê é o arco, e o ângulo é
 * só a consequência dele na hélice de hoje.
 *
 * O `SUBIDA * PROPORCAO` é a conversão citada acima, e esquecê-la é o erro
 * silencioso mais fácil deste arquivo: a conta roda, devolve número plausível
 * e espalha os cards com vão errado. Há teste cobrando exatamente isso.
 */
export const PASSO_ANGULAR = (1 + VAO) / Math.hypot(RAIO, SUBIDA * PROPORCAO);

/** Progresso em que o primeiro card começa a pousar. */
export const POUSO_DO_PRIMEIRO = 0.4;

/**
 * Intervalo de progresso entre um pouso e o seguinte.
 *
 * Era 0,055, portado da FITA, e deixava rolagem morta: o último card pousava
 * em 0,845 e sobravam 15% da cena, ou 45vh, sem nada acontecendo na tela.
 * Espaçar os pousos gasta a cena inteira sem apressar card nenhum.
 */
export const PASSO_DO_POUSO = 0.09;

/** Quanto dura o voo de um card, do descolamento até a identidade. */
export const DURACAO_DO_VOO = 0.15;

/**
 * Curso total da hélice, em radianos. Derivado, e a derivação é o coração
 * deste módulo.
 *
 * Exigir que todo card alcance a altura de descolamento exatamente no seu
 * instante de pouso, com os pousos igualmente espaçados, só é possível nesta
 * razão: o termo que depende do índice se anula, e sobra uma condição que não
 * depende de qual card é.
 *
 * **Mexer no passo angular ou no passo do pouso sem recalcular isto faz o card
 * descolar na altura errada.** É a mesma amarração que `AJUSTES.altura` tem
 * com `AJUSTES.escala` em `lib/costura.ts`, e pelo mesmo motivo: erra calada.
 */
export const CURSO_DA_HELICE = PASSO_ANGULAR / PASSO_DO_POUSO;

/**
 * Altura de descolamento, em alturas de card acima do plano da fileira.
 *
 * Ela decide duas coisas de uma vez, e nenhuma é folga escolhida no olho.
 *
 * A primeira é para que lado o card está virado ao descolar, porque o ângulo
 * ali vale `ALTURA_DE_POUSO / SUBIDA`. Em 0,1 isso dá 5 graus, praticamente de
 * frente. O primeiro valor tentado, 1,2, dava 137 graus, com o card de costas:
 * com `backface-visibility: hidden`, ele começaria o voo invisível e
 * apareceria no meio do caminho.
 *
 * A segunda é quanto o card sobe acima da fileira antes de assentar, e é isso
 * que decide se ele passa por cima do título. Medido em 1440: a fileira tem
 * 40px de respiro até a base do título, e 0,1 altura de card vale 27px, o que
 * deixa 13px de sobra. Em 0,3 ele invadia. Mexeu no respiro do cabeçalho,
 * confira este número, e vice-versa.
 *
 * Note que o ângulo depende de `SUBIDA`. Quando ela subiu de 0,5 para 1,1, o
 * descolamento ficou mais de frente sozinho. Baixar a subida de novo sem
 * revisar isto empurra o ângulo para cima.
 */
export const ALTURA_DE_POUSO = 0.1;

/**
 * Ângulo da cabeça da fila no começo da cena.
 *
 * Sai de exigir que o card 0 esteja na altura de descolamento no instante
 * `POUSO_DO_PRIMEIRO`. Com os valores atuais dá cerca de −2,543 rad, o que põe
 * os seis cards abaixo da fileira e fora do palco no primeiro quadro, de 745px
 * a 1673px abaixo dela num card de 266px de altura.
 *
 * Uma consequência que sai de graça da amarração e vale saber: **cada card
 * ganha exatamente o mesmo tempo de tela antes de pousar**. Com a face
 * escondida de costas, o card aparece quando o giro dele cruza −90 graus, e
 * esse instante anda de `PASSO_DO_POUSO` por índice, igual ao pouso. Todos têm
 * 0,26 da cena entre nascer e assentar.
 */
export const THETA_INICIAL =
  ALTURA_DE_POUSO / SUBIDA - POUSO_DO_PRIMEIRO * CURSO_DA_HELICE;

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
export type Transformacao = { x: number; y: number; z: number; giro: number };

const entre0e1 = (v: number) => Math.min(1, Math.max(0, v));

/** Progresso em que o card de índice `indice` começa a pousar. */
export function pousoDoCard(indice: number): number {
  return POUSO_DO_PRIMEIRO + indice * PASSO_DO_POUSO;
}

/**
 * Onde a hélice põe o card, ignorando o pouso.
 *
 * O `- RAIO` no `z` põe a origem no plano da fileira: em giro zero o card está
 * exatamente onde vai pousar, o que faz a emenda entre hélice e identidade não
 * ter salto.
 */
export function poseNaHelice(progresso: number, indice: number): Pose {
  const cabeca = THETA_INICIAL + progresso * CURSO_DA_HELICE;
  const giro = cabeca - indice * PASSO_ANGULAR;
  return {
    x: RAIO * Math.sin(giro),
    // o sinal negativo é a conversão para o eixo do CSS, ver `Pose`: giro
    // começa negativo, então o card começa embaixo e sobe conforme a cena anda
    y: -SUBIDA * giro,
    z: RAIO * Math.cos(giro) - RAIO,
    giro,
  };
}

/**
 * Quanto do voo já foi cumprido: 0 na hélice pura, 1 pousado.
 *
 * A suavização é saída rápida e assentamento lento. A FITA usa uma com
 * ultrapassagem, que dá o estalo no lugar; aqui ficaria como tremor, porque o
 * card é texto sobre fundo claro e não foto.
 */
export function voo(progresso: number, indice: number): number {
  const t = entre0e1((progresso - pousoDoCard(indice)) / DURACAO_DO_VOO);
  return 1 - Math.pow(1 - t, 3);
}

/**
 * A transformação a escrever no card, em pixels e radianos.
 *
 * `deslocamentoNatural` é a distância em pixels entre o centro do card e o
 * centro da fileira, e é o único número que vem do DOM. Ele entra aqui porque
 * a transformação é RELATIVA à posição que o layout já deu ao card: subtrair o
 * deslocamento é o que faz o alvo ser a identidade em vez do centro da fileira.
 *
 * Com o voo em 1 o fator zera e os quatro eixos saem zero exato, sem resíduo
 * de arredondamento e sem depender de nenhuma medida ter sido lida certo. O
 * card parado é o card sem transformação.
 */
export function transformacaoDoCard(
  progresso: number,
  indice: number,
  deslocamentoNatural: number,
  largura: number,
  altura: number,
): Transformacao {
  const restante = 1 - voo(progresso, indice);
  if (restante === 0) return { x: 0, y: 0, z: 0, giro: 0 };

  /**
   * A pose CONGELA no instante do descolamento, e o voo interpola dela até a
   * identidade. É o que a FITA faz, e eu tinha deixado de portar.
   *
   * Sem o congelamento a hélice continua girando durante o voo, e o card
   * ultrapassa o ponto de descolamento enquanto deveria estar assentando.
   * Medido antes do conserto: com descolamento a 80px acima da fileira, o card
   * chegava a 83px e invadia o título por 43px. O excesso não vem da altura de
   * descolamento, vem do que a hélice anda durante o voo, então baixar aquela
   * constante quase não resolvia.
   *
   * De quebra, o voo deixa de ser curvo: o card sai de um ponto fixo e vai
   * direto ao lugar dele, em vez de continuar balançando enquanto assenta.
   */
  const inicioDoVoo = pousoDoCard(indice);
  const pose = poseNaHelice(Math.min(progresso, inicioDoVoo), indice);
  return {
    x: restante * (pose.x * largura - deslocamentoNatural),
    y: restante * (pose.y * altura),
    z: restante * (pose.z * largura),
    giro: restante * pose.giro,
  };
}

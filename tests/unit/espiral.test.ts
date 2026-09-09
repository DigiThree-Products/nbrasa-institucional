import { describe, it, expect } from "vitest";
import {
  AFASTAMENTO_DA_BORDA,
  ALTURA_DE_POUSO,
  CARDS_NA_BOBINA,
  COMPRIMENTO_DO_TRILHO,
  CURSO_DA_HELICE,
  DESENROLO_DO_TRILHO,
  ESCALA_NA_BOBINA,
  DISTANCIA_DA_CAMERA,
  DURACAO_DO_VOO,
  ENTRADA_DO_TRILHO,
  PASSO_ANGULAR,
  PASSO_DO_POUSO,
  POUSO_DO_PRIMEIRO,
  PROPORCAO,
  RAIO,
  SUBIDA,
  VAO,
  janelaDoTrilho,
  larguraNaBobina,
  pontosDaBobina,
  poseNaHelice,
  pousoDoCard,
  projetarNoPalco,
  thetaDaCabeca,
  transformacaoDoCard,
  voo,
} from "@/lib/espiral";

/** Os seis cards da bobina. */
const CARDS = [0, 1, 2, 3, 4, 5];

/** Um card de 300x200, a medida da GRADE em 1440. */
const LARGURA = 300;
const ALTURA = 200;

/** As mesmas medidas na bobina, que é a unidade da hélice. */
const LARGURA_NA_BOBINA = LARGURA * ESCALA_NA_BOBINA;
const ALTURA_NA_BOBINA = ALTURA * ESCALA_NA_BOBINA;

/** Deslocamento de um card qualquer até o eixo, nos dois eixos. */
const deslocamento = (i: number) => ({
  x: 200 + (i % 2) * 316,
  y: -210 + Math.floor(i / 2) * 210,
});

describe("calendário de pouso", () => {
  it("pousa na ordem do DOM, sem dois cards no mesmo instante", () => {
    const pousos = CARDS.map(pousoDoCard);
    for (let i = 1; i < pousos.length; i++) {
      expect(pousos[i]).toBeGreaterThan(pousos[i - 1]!);
    }
  });

  it("o último card termina o voo exatamente no fim da cena", () => {
    const fim = pousoDoCard(CARDS_NA_BOBINA - 1) + DURACAO_DO_VOO;
    expect(fim).toBeCloseTo(1, 10);
  });

  // Com seis cards pousando, e não os quatro da FITA, a cascata inteira precisa
  // caber no fim da cena. É isso que empurra o primeiro pouso para tão tarde, e
  // é de propósito: o que sobra antes é a bobina subindo limpa.
  it("o primeiro pouso deixa a bobina subir a cena quase inteira", () => {
    expect(POUSO_DO_PRIMEIRO).toBeGreaterThan(0.5);
    expect(pousoDoCard(0)).toBe(POUSO_DO_PRIMEIRO);
  });
});

describe("a amarração entre curso da hélice e passo do pouso", () => {
  it("o curso é o passo angular dividido pelo passo do pouso", () => {
    expect(CURSO_DA_HELICE).toBeCloseTo(PASSO_ANGULAR / PASSO_DO_POUSO, 10);
  });

  // Esta é a invariante que o módulo existe para proteger. Mexer no passo
  // angular ou no passo do pouso sem recalcular o curso faz o card descolar na
  // altura errada, e nada lança.
  it("todo card cruza a altura de descolamento no seu próprio instante de pouso", () => {
    for (const i of CARDS) {
      const { y } = poseNaHelice(pousoDoCard(i), i);
      // negativo porque `y` cresce para baixo, como no CSS, e a altura de
      // descolamento é medida ACIMA do eixo da bobina
      expect(y).toBeCloseTo(-ALTURA_DE_POUSO, 10);
    }
  });

  it("dá a todo card o mesmo tempo de bobina antes de pousar", () => {
    // O instante em que o card cruza um ângulo qualquer anda de PASSO_DO_POUSO
    // por índice, igual ao pouso, então a diferença entre cruzar e assentar é a
    // mesma para os seis. Sai da amarração do curso, e não de ajuste manual.
    const cruza = (marco: number, i: number) =>
      (marco + i * PASSO_ANGULAR - poseNaHelice(0, 0).giro) / CURSO_DA_HELICE;

    const janelas = CARDS.map((i) => pousoDoCard(i) - cruza(-Math.PI / 2, i));
    for (const janela of janelas) {
      expect(janela).toBeCloseTo(janelas[0]!, 10);
    }
    expect(janelas[0]).toBeGreaterThan(0.15);
  });
});

/** Comprimento de arco da hélice por radiano, em larguras de card. */
const arcoPorRadiano = Math.hypot(RAIO, SUBIDA * PROPORCAO);

describe("o passo angular", () => {
  it("reserva a largura do card mais o vão ao longo do arco", () => {
    expect(PASSO_ANGULAR * arcoPorRadiano).toBeCloseTo(1 + VAO, 10);
  });

  // O vão é o da FITA, e ele é quase nulo. É isso que faz a fila ler como um
  // corpo contínuo em vez de seis retângulos em órbita: as bordas se encostam.
  // Quem separar os cards aqui derruba este teste, e é para derrubar mesmo.
  it("deixa as bordas praticamente encostadas, e não vão visível", () => {
    const distanciaEntreCentros = PASSO_ANGULAR * arcoPorRadiano;
    expect(distanciaEntreCentros - 1).toBeLessThan(0.1);
  });

  it("vale o mesmo `dTheta` da referência", () => {
    // FITA: (CARD_W + SPIRAL_GAP) / hypot(radius, climb) = 3,2 / hypot(4,4; 1).
    const daReferencia = 3.2 / Math.hypot(4.4, 1);
    expect(PASSO_ANGULAR).toBeCloseTo(daReferencia, 10);
  });

  it("converte a subida para largura antes da hipotenusa", () => {
    // Erro de unidade silencioso: RAIO está em larguras e SUBIDA em alturas.
    // Sem a proporção a conta roda e devolve número plausível.
    const errado = (1 + VAO) / Math.hypot(RAIO, SUBIDA);
    expect(PASSO_ANGULAR).not.toBeCloseTo(errado, 4);
  });
});

describe("o voo", () => {
  it("vale zero antes do pouso e um depois dele", () => {
    for (const i of CARDS) {
      expect(voo(pousoDoCard(i) - 0.001, i)).toBe(0);
      expect(voo(pousoDoCard(i) + DURACAO_DO_VOO, i)).toBeCloseTo(1, 10);
      expect(voo(1, i)).toBeCloseTo(1, 10);
    }
  });

  // O `backOut` da referência: o card passa um pouco da célula e volta. Sem a
  // ultrapassagem o encaixe é um deslize, e o estalo do gesto se perde. O que
  // NÃO pode acontecer é sobrar deriva no fim, porque o alvo é a identidade.
  it("ultrapassa o alvo no meio do caminho e assenta exatamente nele", () => {
    const i = 2;
    const amostras = Array.from({ length: 41 }, (_, k) =>
      voo(pousoDoCard(i) + (k / 40) * DURACAO_DO_VOO, i),
    );
    expect(Math.max(...amostras)).toBeGreaterThan(1.05);
    expect(amostras.at(-1)).toBeCloseTo(1, 12);
  });

  it("sai rápido do descolamento, e não devagar", () => {
    const i = 0;
    const meio = voo(pousoDoCard(i) + DURACAO_DO_VOO / 2, i);
    expect(meio).toBeGreaterThan(0.7);
  });
});

describe("a transformação escrita no card", () => {
  it("é zero exata no fim da cena, em todos os eixos e para todo card", () => {
    for (const i of CARDS) {
      const t = transformacaoDoCard(1, i, deslocamento(i), LARGURA, ALTURA);
      expect(t.x).toBe(0);
      expect(t.y).toBe(0);
      expect(t.z).toBe(0);
      expect(t.giro).toBe(0);
      expect(t.escala).toBe(1);
    }
  });

  it("é zero exata assim que o voo do card termina, sem esperar o fim", () => {
    const i = 0;
    const t = transformacaoDoCard(
      pousoDoCard(i) + DURACAO_DO_VOO,
      i,
      deslocamento(i),
      LARGURA,
      ALTURA,
    );
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  // A grade tem duas colunas e três linhas, então o card tem distância própria
  // até o eixo nos DOIS eixos. Descontar só a horizontal, como na fileira única
  // que veio antes, faria todo card pousar na altura da primeira linha.
  it("desconta o deslocamento natural nos dois eixos, para o alvo ser a identidade", () => {
    const i = 4;
    const d = deslocamento(i);
    const t = transformacaoDoCard(0, i, d, LARGURA, ALTURA);
    const pose = poseNaHelice(0, i);
    expect(t.x).toBeCloseTo(pose.x * LARGURA_NA_BOBINA - d.x, 6);
    expect(t.y).toBeCloseTo(pose.y * ALTURA_NA_BOBINA - d.y, 6);
  });

  it("converte cada eixo com a medida certa, largura em x e z, altura em y", () => {
    const p = poseNaHelice(0, 3);
    const t = transformacaoDoCard(0, 3, { x: 0, y: 0 }, LARGURA, ALTURA);
    expect(t.x).toBeCloseTo(p.x * LARGURA_NA_BOBINA, 6);
    expect(t.z).toBeCloseTo(p.z * LARGURA_NA_BOBINA, 6);
    expect(t.y).toBeCloseTo(p.y * ALTURA_NA_BOBINA, 6);
  });

  it("congela a pose no descolamento e não deixa a hélice seguir durante o voo", () => {
    const i = 1;
    const noDescolamento = poseNaHelice(pousoDoCard(i), i);
    const meioDoVoo = pousoDoCard(i) + DURACAO_DO_VOO / 2;
    const t = transformacaoDoCard(meioDoVoo, i, { x: 0, y: 0 }, LARGURA, ALTURA);
    const restante = 1 - voo(meioDoVoo, i);
    expect(t.x).toBeCloseTo(restante * noDescolamento.x * LARGURA_NA_BOBINA, 6);
  });

  // A ampliação da referência: o card é 40% maior enquanto voa. Sem ela a
  // bobina lê pequena, e com ela desacompanhada da unidade da hélice as bordas
  // dos cards se sobrepõem. As duas coisas andam juntas ou nenhuma vale.
  it("amplia o card na bobina e o devolve ao tamanho da grade ao pousar", () => {
    const i = 3;
    expect(transformacaoDoCard(0, i, { x: 0, y: 0 }, LARGURA, ALTURA).escala)
      .toBeCloseTo(ESCALA_NA_BOBINA, 10);
    expect(transformacaoDoCard(1, i, { x: 0, y: 0 }, LARGURA, ALTURA).escala).toBe(1);
    expect(ESCALA_NA_BOBINA).toBeGreaterThan(1.3);
  });

  it("mede a hélice na mesma unidade em que amplia o card", () => {
    // Se estas duas se separarem, o vão entre cards deixa de valer o que
    // `PASSO_ANGULAR` reservou e as bordas passam a se sobrepor ou a abrir.
    expect(larguraNaBobina(LARGURA)).toBeCloseTo(LARGURA_NA_BOBINA, 10);
    const t = transformacaoDoCard(0, 0, { x: 0, y: 0 }, LARGURA, ALTURA);
    const pose = poseNaHelice(0, 0);
    expect(t.x / pose.x).toBeCloseTo(larguraNaBobina(LARGURA), 6);
  });
});

describe("a hélice", () => {
  it("põe a origem no plano de pouso: giro zero é posição zero", () => {
    // z leva o desconto do raio justamente para isto: em giro zero o card está
    // exatamente onde vai pousar, sem salto na emenda. E a bobina inteira fica
    // ATRÁS desse plano, nunca à frente dele.
    for (let giro = -6; giro <= 6; giro += 0.25) {
      expect(RAIO * Math.cos(giro) - RAIO).toBeLessThanOrEqual(1e-12);
    }
    expect(-RAIO * Math.sin(0)).toBeCloseTo(0, 10);
    expect(RAIO * Math.cos(0) - RAIO).toBeCloseTo(0, 10);
  });

  it("mantém os seis cards contíguos, um passo angular atrás do outro", () => {
    for (let i = 1; i < CARDS.length; i++) {
      const a = poseNaHelice(0.5, i - 1);
      const b = poseNaHelice(0.5, i);
      expect(a.giro - b.giro).toBeCloseTo(PASSO_ANGULAR, 10);
    }
  });

  // O teste que pega a inversão de eixo. Ele já passou com a bobina descendo,
  // porque afirmava `y < 0` numa convenção e o CSS lia a outra. `y` cresce
  // para baixo, então card abaixo do eixo é `y` POSITIVO.
  it("começa com os seis cards abaixo do eixo, fora do palco", () => {
    for (const i of CARDS) {
      expect(poseNaHelice(0, i).y).toBeGreaterThan(0);
    }
  });

  it("faz a bobina subir conforme a cena anda, e não descer", () => {
    for (const i of CARDS) {
      const inicio = poseNaHelice(0, i).y;
      const meio = poseNaHelice(pousoDoCard(i) / 2, i).y;
      const pouso = poseNaHelice(pousoDoCard(i), i).y;
      expect(meio).toBeLessThan(inicio);
      expect(pouso).toBeLessThan(meio);
    }
  });

  // O espelho do render da FITA (`mundoX = -p[0]`). Sem ele a bobina gira para
  // o outro lado e o descolamento acontece na ponta ESQUERDA da tela, longe da
  // grade, com o card atravessando a janela inteira de volta no voo.
  it("descola do lado da grade, e não do lado oposto a ela", () => {
    for (const i of CARDS) {
      expect(poseNaHelice(pousoDoCard(i), i).x).toBeGreaterThan(0.9 * RAIO);
    }
  });

  it("gira o card mais de uma volta entre o começo da cena e o pouso", () => {
    // 9,85 rad, contra os 9,82 que um card da FITA percorre. É o que dá tempo
    // de o card mostrar frente, dorso e frente de novo, e é por isso que o
    // `<article>` precisa de verso: sem ele a banda some em metade do trecho.
    const percorrido = pousoDoCard(0) * CURSO_DA_HELICE;
    expect(percorrido).toBeGreaterThan(2 * Math.PI);
    expect(poseNaHelice(pousoDoCard(0), 0).giro).toBeGreaterThan(Math.PI / 2);
  });

  it("a cabeça acompanha o progresso e é a mesma que a pose usa", () => {
    for (const p of [0, 0.3, 0.75, 1]) {
      expect(poseNaHelice(p, 0).giro).toBeCloseTo(thetaDaCabeca(p), 12);
    }
  });
});

describe("o trilho", () => {
  it("corre pelo mesmo caminho dos cards quando não se afasta deles", () => {
    // Se estes dois desandarem, a linha escorrega das bordas dos cards e o
    // gesto de trem sobre trilho vira dois riscos soltos. `y` do trilho vem em
    // LARGURAS de card, e é essa a única diferença de unidade.
    for (const i of [0, 1, 2, 3]) {
      const giro = thetaDaCabeca(0.6) - i * PASSO_ANGULAR;
      const [ponto] = pontosDaBobina(giro, giro, 2, 0);
      const pose = poseNaHelice(0.6, i);
      expect(ponto!.x).toBeCloseTo(pose.x, 10);
      expect(ponto!.z).toBeCloseTo(pose.z, 10);
      expect(ponto!.y).toBeCloseTo(pose.y * PROPORCAO, 10);
    }
  });

  it("afasta perpendicular à curva, e exatamente o pedido", () => {
    const giro = 1.3;
    const [centro] = pontosDaBobina(giro, giro, 2, 0);
    const [borda] = pontosDaBobina(giro, giro, 2, AFASTAMENTO_DA_BORDA);
    const distancia = Math.hypot(
      borda!.x - centro!.x,
      borda!.y - centro!.y,
      borda!.z - centro!.z,
    );
    expect(distancia).toBeCloseTo(AFASTAMENTO_DA_BORDA, 10);
  });

  it("com afastamento positivo desce na tela, que é a borda de baixo do card", () => {
    const giro = 0;
    const [centro] = pontosDaBobina(giro, giro, 2, 0);
    const [baixo] = pontosDaBobina(giro, giro, 2, AFASTAMENTO_DA_BORDA);
    expect(baixo!.y).toBeGreaterThan(centro!.y);
  });

  it("põe o filete na borda do card, e não no meio dele", () => {
    // Meia altura de card, medida em larguras: é o que a referência usa
    // (`abaixoDoCard = CARD_H / 2`) depois de ter tentado o centro e visto a
    // linha cortar o card ao meio na curva da frente.
    expect(AFASTAMENTO_DA_BORDA).toBeCloseTo(PROPORCAO / 2, 12);
  });

  it("nasce sem comprimento e se desenrola para trás, atrás da cabeça", () => {
    const inicio = janelaDoTrilho(ENTRADA_DO_TRILHO);
    expect(inicio.ate - inicio.de).toBeCloseTo(0, 10);

    const assentado = janelaDoTrilho(ENTRADA_DO_TRILHO + DESENROLO_DO_TRILHO);
    expect(assentado.ate - assentado.de).toBeCloseTo(COMPRIMENTO_DO_TRILHO, 10);
  });

  it("cobre a cobra inteira depois de assentado", () => {
    expect(COMPRIMENTO_DO_TRILHO).toBeGreaterThan(
      (CARDS_NA_BOBINA - 1) * PASSO_ANGULAR,
    );
  });

  it("nunca se adianta à cabeça: a ponta fica no trecho já percorrido", () => {
    for (const p of [0.1, 0.4, 0.8, 1]) {
      expect(janelaDoTrilho(p, 0.22).ate).toBeLessThanOrEqual(thetaDaCabeca(p));
    }
  });
});

describe("a projeção do trilho", () => {
  it("no plano de pouso não encolhe nada", () => {
    const p = projetarNoPalco({ x: 1, y: -0.5, z: 0 }, LARGURA);
    expect(p.x).toBeCloseTo(LARGURA, 10);
    expect(p.y).toBeCloseTo(-LARGURA / 2, 10);
  });

  it("encolhe o que está atrás, e na medida da distância declarada", () => {
    const fundo = projetarNoPalco({ x: 1, y: 0, z: -2 * RAIO }, LARGURA);
    const escalaEsperada =
      DISTANCIA_DA_CAMERA / (DISTANCIA_DA_CAMERA + 2 * RAIO);
    expect(fundo.x).toBeCloseTo(LARGURA * escalaEsperada, 8);
    expect(escalaEsperada).toBeLessThan(0.5);
  });

  it("nunca divide por zero, porque a bobina toda fica atrás do plano", () => {
    for (let giro = -12; giro <= 12; giro += 0.5) {
      const [ponto] = pontosDaBobina(giro, giro, 2, AFASTAMENTO_DA_BORDA);
      expect(ponto!.z).toBeLessThan(DISTANCIA_DA_CAMERA);
    }
  });
});

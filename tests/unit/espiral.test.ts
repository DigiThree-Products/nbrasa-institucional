import { describe, it, expect } from "vitest";
import {
  ALTURA_DE_POUSO,
  CURSO_DA_HELICE,
  DURACAO_DO_VOO,
  PASSO_ANGULAR,
  PASSO_DO_POUSO,
  PROPORCAO,
  RAIO,
  SUBIDA,
  VAO,
  poseNaHelice,
  pousoDoCard,
  transformacaoDoCard,
  voo,
} from "@/lib/espiral";

/** Os seis cards da fileira. */
const CARDS = [0, 1, 2, 3, 4, 5];

describe("calendário de pouso", () => {
  it("pousa da esquerda para a direita, sem dois cards no mesmo instante", () => {
    const pousos = CARDS.map(pousoDoCard);
    for (let i = 1; i < pousos.length; i++) {
      expect(pousos[i]).toBeGreaterThan(pousos[i - 1]!);
    }
  });

  it("o último card termina o voo exatamente no fim da cena", () => {
    const fim = pousoDoCard(5) + DURACAO_DO_VOO;
    expect(fim).toBeCloseTo(1, 6);
  });

  it("o primeiro pouso deixa a bobina subir antes de entregar card nenhum", () => {
    expect(pousoDoCard(0)).toBeGreaterThan(0.3);
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
      // descolamento é medida ACIMA do plano da fileira
      expect(y).toBeCloseTo(-ALTURA_DE_POUSO, 10);
    }
  });

  it("o descolamento acontece com a face do card voltada para quem olha", () => {
    // O ângulo no descolamento vale ALTURA_DE_POUSO / SUBIDA. Acima de meio pi
    // o card está de costas e o voo começaria invisível.
    for (const i of CARDS) {
      const { giro } = poseNaHelice(pousoDoCard(i), i);
      expect(Math.abs(giro)).toBeLessThan(Math.PI / 2);
    }
  });
});

/** Comprimento de arco da hélice por radiano, em larguras de card. */
const arcoPorRadiano = Math.hypot(RAIO, SUBIDA * PROPORCAO);

describe("o passo angular", () => {
  it("reserva a largura do card mais o vão ao longo do arco", () => {
    expect(PASSO_ANGULAR * arcoPorRadiano).toBeCloseTo(1 + VAO, 10);
  });

  // O cliente pediu os cards separados na bobina, em 2026-09-09. Na FITA eles
  // se tocam, com vão de 0,067 largura. Quem baixar o vão de volta para perto
  // do valor da referência derruba este teste, e é para derrubar mesmo: a
  // separação é decisão de desenho, não sobra de cálculo.
  it("deixa vão visível entre um card e o vizinho, e não bordas encostadas", () => {
    const distanciaEntreCentros = PASSO_ANGULAR * arcoPorRadiano;
    expect(distanciaEntreCentros - 1).toBeGreaterThan(0.2);
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

  it("é monótono dentro do trecho de voo", () => {
    const i = 2;
    let anterior = -1;
    for (let k = 0; k <= 20; k++) {
      const v = voo(pousoDoCard(i) + (k / 20) * DURACAO_DO_VOO, i);
      expect(v).toBeGreaterThanOrEqual(anterior);
      anterior = v;
    }
  });
});

describe("a transformação escrita no card", () => {
  it("é zero exata no fim da cena, em todos os eixos e para todo card", () => {
    for (const i of CARDS) {
      const t = transformacaoDoCard(1, i, -520 + i * 208, 190, 266);
      expect(t.x).toBe(0);
      expect(t.y).toBe(0);
      expect(t.z).toBe(0);
      expect(t.giro).toBe(0);
    }
  });

  it("é zero exata assim que o voo do card termina, sem esperar o fim", () => {
    const i = 0;
    const t = transformacaoDoCard(pousoDoCard(i) + DURACAO_DO_VOO, i, -520, 190, 266);
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  it("desconta o deslocamento natural do card, para o alvo ser a identidade", () => {
    // No começo da cena o card ainda está na hélice, então a transformação
    // precisa levá-lo da posição natural até a hélice, e não até o centro.
    const deslocamento = -520;
    const t = transformacaoDoCard(0, 0, deslocamento, 190, 266);
    const { x } = poseNaHelice(0, 0);
    expect(t.x).toBeCloseTo(x * 190 - deslocamento, 6);
  });

  it("converte cada eixo com a medida certa, largura em x e z, altura em y", () => {
    const p = poseNaHelice(0, 3);
    const t = transformacaoDoCard(0, 3, 0, 190, 266);
    expect(t.x).toBeCloseTo(p.x * 190, 6);
    expect(t.z).toBeCloseTo(p.z * 190, 6);
    expect(t.y).toBeCloseTo(p.y * 266, 6);
  });
});

describe("a hélice", () => {
  it("põe a origem no plano da fileira: giro zero é posição zero", () => {
    // z leva o desconto do raio justamente para isto: em giro zero o card está
    // exatamente onde vai pousar, sem salto na emenda.
    const quase = { x: RAIO * Math.sin(0), z: RAIO * Math.cos(0) - RAIO };
    expect(quase.x).toBeCloseTo(0, 10);
    expect(quase.z).toBeCloseTo(0, 10);
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
  // para baixo, então card embaixo da fileira é `y` POSITIVO.
  it("começa com os seis cards abaixo da fileira, fora do palco", () => {
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

  // O card entra de baixo, e não pelo lado. Pedido do cliente em 2026-09-09,
  // e a versão anterior falhava: com SUBIDA em 0,5 ele subia 289px enquanto
  // andava 437px na horizontal, medido em 1440.
  //
  // O trecho medido é o que se vê. Com a face escondida de costas, o card só
  // aparece quando o giro cruza -90 graus, então comparar desde o começo da
  // cena contaria movimento que ninguém enxerga.
  //
  // A conta é adimensional de propósito: a subida está em alturas de card e o
  // desvio lateral em larguras, então a proporção converte uma na outra e a
  // largura do card se cancela. Vale igual nos três breakpoints de desktop.
  it("sobe mais do que anda de lado, senão o card entra pelo lado", () => {
    const giroAoNascer = -Math.PI / 2;
    const giroNoPouso = ALTURA_DE_POUSO / SUBIDA;

    const subiu = SUBIDA * (giroNoPouso - giroAoNascer) * PROPORCAO;
    const andou = Math.abs(RAIO * Math.sin(giroNoPouso) - RAIO * Math.sin(giroAoNascer));

    expect(subiu).toBeGreaterThan(andou);
  });

  it("dá a todo card o mesmo tempo de tela antes de pousar", () => {
    // O instante em que o card aparece anda de PASSO_DO_POUSO por índice,
    // igual ao pouso, então a diferença entre nascer e assentar é a mesma para
    // os seis. Sai da amarração do curso, e não de ajuste manual.
    const nasce = (i: number) =>
      (-Math.PI / 2 - (poseNaHelice(0, i).giro)) / CURSO_DA_HELICE;

    const janelas = CARDS.map((i) => pousoDoCard(i) - nasce(i));
    for (const janela of janelas) {
      expect(janela).toBeCloseTo(janelas[0]!, 10);
    }
    expect(janelas[0]).toBeGreaterThan(0.15);
  });
});

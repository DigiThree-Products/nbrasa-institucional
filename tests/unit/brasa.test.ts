import { describe, it, expect } from "vitest";
import {
  DURACAO_DA_CHAMA,
  DURACAO_DO_ASSENTO,
  EMENDA_DAS_FASES,
  ORCAMENTO_DA_BRASA,
  PASSO_ENTRE_CARDS,
  PASSO_ENTRE_CHAMAS,
  PASSO_DENTRO_DO_CARD,
  atrasoNaChama,
  custoDaBrasa,
  estadosDaBrasa,
} from "@/lib/brasa";

const BRILHO = "#cf2434";
const REPOUSO = "rgb(36, 30, 31)";

describe("a brasa que vira letra", () => {
  it("nasce invisível e termina opaca", () => {
    // A fase de brasa é o que substitui o esconder: se ela nascesse visível,
    // o texto apareceria pronto antes de acender. E terminar abaixo de 1
    // deixaria o título pálido para sempre, sem nada lançar.
    const { brasa, letra } = estadosDaBrasa(BRILHO, REPOUSO);
    expect(brasa.opacity).toBe(0);
    expect(letra.opacity).toBe(1);
  });

  it("apaga o brilho e o desfoque ao assentar", () => {
    /*
     * Este é o erro mais calado do gesto. Sobra de `textShadow` ou de `blur`
     * na última fase não lança e não some sozinha: o título fica borrado e
     * com halo vermelho PARADO na tela, e ainda paga uma camada de composição
     * para sempre. É o mesmo tipo de dívida que a máscara da queima tinha, e
     * lá foi preciso um `clearProps` para resolver.
     */
    const { letra } = estadosDaBrasa(BRILHO, REPOUSO);
    expect(letra.filter).toBe("blur(0px)");
    expect(String(letra.textShadow)).toMatch(/0 0 0/);
    expect(String(letra.textShadow)).not.toContain(BRILHO);
  });

  it("assenta na cor de repouso lida do DOM, e não num hex escrito aqui", () => {
    // Cada linha das duas seções repousa numa cor diferente: carvão no
    // título do evento, branco sobre o véu das avaliações. Fixar a cor aqui
    // pintaria o título das avaliações de carvão sobre carvão.
    const { letra } = estadosDaBrasa(BRILHO, REPOUSO);
    expect(letra.color).toBe(REPOUSO);
  });

  it("acende no brilho que recebe, nas duas primeiras fases", () => {
    // O brilho é parâmetro porque a seção clara e a escura podem querer
    // halos diferentes: em 2026-09-11 o cliente tirou o vermelho da seção
    // com foto, e o gesto não pode ter a cor grudada.
    const { brasa, chama } = estadosDaBrasa(BRILHO, REPOUSO);
    expect(String(brasa.textShadow)).toContain(BRILHO);
    expect(String(chama.textShadow)).toContain(BRILHO);
  });

  it("dispensa o halo em texto de corpo, porque a sombra custa por glifo", () => {
    /*
     * Medido no navegador em 2026-09-11, rolando pela seção de avaliações a
     * 900 px/s: com halo nos três cards e no subtítulo, 22,7 ms por quadro e
     * 43% dos quadros acima de 20 ms; sem halo, 16,7 ms, que é o controle.
     * Desligar o DESFOQUE no lugar dele não mudou nada, 23,3 ms.
     *
     * A razão é que a sombra é paga por GLIFO, e não por bloco animado: um
     * card de avaliação tem centenas de letrinhas, cada uma pintando duas
     * cópias borradas sobre a foto de fundo. No display são poucas letras
     * grandes, e ali ela cabe.
     *
     * Por isso o halo é opcional, e não porque alguém achou bonito sem. Quem
     * ligar isto num bloco de corpo devolve o engasgo, e nada lança.
     */
    const { brasa, chama, letra } = estadosDaBrasa(BRILHO, REPOUSO, false);
    for (const fase of [brasa, chama, letra]) {
      expect(String(fase.textShadow)).not.toContain(BRILHO);
      expect(String(fase.textShadow)).toMatch(/0 0 0/);
    }
  });

  it("continua acendendo a cor mesmo sem halo", () => {
    // Sem o halo o gesto ainda é brasa que vira letra: quem faz o fogo é a
    // passagem pela cor, e a sombra só engrossa. Se a cor saísse junto, o
    // bloco viraria um fade e o gesto sumiria do corpo da seção.
    const { brasa, chama, letra } = estadosDaBrasa(BRILHO, REPOUSO, false);
    expect(brasa.color).not.toBe(letra.color);
    expect(chama.color).not.toBe(letra.color);
  });

  it("emenda a terceira fase antes de a segunda acabar", () => {
    /*
     * Sem sobreposição o texto fica parado em vermelho cheio entre as duas
     * tweens, e o gesto lê como dois movimentos colados em vez de brasa que
     * vira letra. Nada lança: só aparece uma pausa no meio.
     */
    expect(EMENDA_DAS_FASES).toBeLessThan(DURACAO_DA_CHAMA);
    expect(EMENDA_DAS_FASES).toBeGreaterThan(0);
  });

  it("mantém o salto de escala sutil", () => {
    /*
     * O cliente pediu o salto mais sutil em 2026-09-11, logo depois de ver o
     * gesto no ar: a chama passava de 1,05 e voltava para 1, e essa
     * ultrapassagem lê como pulo, não como fogo. O que dá o fogo é a cor, o
     * halo e o desfoque; a escala é só o corpo do movimento.
     *
     * Erra calado nos dois sentidos. Ultrapassagem grande devolve o pulo. E
     * nascer pequeno demais faz o texto REDIMENSIONAR na frente do visitante,
     * que num título de 5rem empurra a linha inteira.
     */
    const TETO_DA_ULTRAPASSAGEM = 1.03;
    const PISO_DO_NASCIMENTO = 0.95;
    const { brasa, chama, letra } = estadosDaBrasa(BRILHO, REPOUSO);

    expect(Number(chama.scale)).toBeLessThanOrEqual(TETO_DA_ULTRAPASSAGEM);
    expect(Number(chama.scale)).toBeGreaterThan(Number(letra.scale));
    expect(Number(brasa.scale)).toBeGreaterThanOrEqual(PISO_DO_NASCIMENTO);
    expect(Number(brasa.scale)).toBeLessThan(Number(letra.scale));
  });

  it("mantém o deslocamento vertical curto", () => {
    // Mesmo pedido: o que sobe muito lê como o texto entrando de baixo, e o
    // gesto passa a competir com o `Reveal`, que é justamente subir e
    // aparecer. Aqui o movimento é só o assentar da brasa.
    const { brasa, letra } = estadosDaBrasa(BRILHO, REPOUSO);
    expect(Number(brasa.y)).toBeLessThanOrEqual(9);
    expect(Number(brasa.y)).toBeGreaterThan(Number(letra.y));
  });

  it("sai do foco para o foco, e nunca ao contrário", () => {
    // A brasa é fosca porque ainda não tem forma de letra. Terminar mais
    // desfocado do que começou inverteria o gesto inteiro.
    const { brasa, chama, letra } = estadosDaBrasa(BRILHO, REPOUSO);
    const px = (v: unknown) => Number(String(v).replace(/[^\d.]/g, ""));
    expect(px(brasa.filter)).toBeGreaterThan(px(chama.filter));
    expect(px(chama.filter)).toBeGreaterThan(px(letra.filter));
  });
});

/**
 * O orçamento de tempo.
 *
 * A lição é de 2026-09-11, e custou a queima: o custo de uma revelação é
 * `atraso + duração`, e naquele gesto só a duração tinha sido escolhida de
 * propósito. O total emergia, ninguém o media, e o texto não terminava de
 * aparecer antes de a seção sair da tela. Aqui o total é a grandeza projetada.
 */
describe("o orçamento de tempo da brasa", () => {
  it("cabe no orçamento a última linha da última chama", () => {
    // A seção de horários escalona quatro chamas, e dentro de cada uma quatro
    // degraus: contorno, rótulo, título e hora.
    expect(custoDaBrasa(atrasoNaChama(3, 3))).toBeLessThanOrEqual(ORCAMENTO_DA_BRASA);
  });

  it("cabe no orçamento o último card das avaliações", () => {
    // Os três cards são irmãos da mesma linha da grade e têm o mesmo topo,
    // então sem atraso os três acendem no mesmo instante.
    expect(custoDaBrasa(PASSO_ENTRE_CARDS * 2)).toBeLessThanOrEqual(ORCAMENTO_DA_BRASA);
  });

  it("não depende do comprimento do texto", () => {
    // É a diferença para a queima, e a razão de o gesto ser de BLOCO: lá a
    // cascata era passo vezes número de letras, então quem escrevesse a copy
    // no painel decidia a duração da cena. Aqui só existe o atraso da grade.
    expect(custoDaBrasa(0)).toBeCloseTo(EMENDA_DAS_FASES + DURACAO_DO_ASSENTO, 5);
    expect(custoDaBrasa(0)).toBeGreaterThan(DURACAO_DA_CHAMA);
  });

  it("mantém as chamas da programação mais apertadas que os cards de avaliação", () => {
    // São quatro chamas contra três cards, dividindo o mesmo orçamento: a
    // fileira mais longa precisa do passo mais curto para a última caber.
    expect(PASSO_ENTRE_CHAMAS).toBeLessThan(PASSO_ENTRE_CARDS);
  });

  it("acende o contorno da chama antes do texto que vai dentro dela", () => {
    // O SVG é o degrau 0 e o rótulo o 1. Invertido, o texto apareceria no ar
    // antes de existir chama em volta dele.
    expect(atrasoNaChama(2, 0)).toBeLessThan(atrasoNaChama(2, 1));
    expect(PASSO_DENTRO_DO_CARD).toBeGreaterThan(0);
  });
});

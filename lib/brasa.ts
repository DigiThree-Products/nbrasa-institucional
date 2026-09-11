/**
 * A brasa que vira letra: o gesto de revelação das seções de horários e de
 * avaliações desde 2026-09-11.
 *
 * O texto nasce brasa fosca, sem forma ainda, entra em chamas, e o fogo apaga
 * deixando a letra assentada na cor de repouso dela. São três fases numa
 * linha do tempo só.
 *
 * ── Por que ele substituiu a queima ────────────────────────────────────────
 * A queima, que fazia uma linha de fogo subir por dentro de cada glifo, foi
 * aposentada por custo medido. Ela era LETRA A LETRA, e cada letra carregava
 * duas camadas filhas, uma máscara repintada a cada quadro e uma pluma de seis
 * sombras. Medido no navegador a 1440x900, rolando a 900 px/s pela seção de
 * horários, contra um trecho de controle de mesma distância dentro da
 * Delivery, que não anima texto nenhum:
 *
 * | Trecho                        | Médio   | Quadros > 20 ms | Pior    |
 * |-------------------------------|---------|-----------------|---------|
 * | Delivery, controle            | 16,7 ms | 3%              | 22 ms   |
 * | Queima, 71 letras             | 62,4 ms | 91%             | 267 ms  |
 * | Queima, só 23 letras          | 31,0 ms | 75%             | 150 ms  |
 * | Tudo em bloco                 | 17,8 ms | 17%             | 60 ms   |
 *
 * A resposta é linear no número de elementos animados, e some quando ele
 * chega a zero. Por isso este gesto é de **BLOCO**: um elemento animado por
 * texto, e não um por letra. É também o que o cliente escolheu vendo, no
 * mockup, em 2026-09-11.
 *
 * ── O que erra calado aqui ─────────────────────────────────────────────────
 * Sobra de brilho ou de desfoque na última fase não lança e não se desfaz
 * sozinha: o título fica borrado e com halo vermelho PARADO na tela, e ainda
 * paga uma camada de composição para sempre. E emenda mal posta entre as fases
 * deixa uma pausa em vermelho cheio no meio do gesto. Os dois têm teste.
 */

/** Cor da brasa fosca, o nascimento. Rótulo pequeno do site já usa esta. */
const BRASA_ESCURA = "#b81f2c";
/** Cor do auge da chama. */
const BRASA = "#cf2434";

/**
 * Quanto a brasa leva para virar chama.
 *
 * É a fase curta de propósito: o que se lê aqui é um estalo, e não uma
 * travessia. A travessia lenta era da queima, e foi ela que não coube na
 * corrida de rolagem.
 */
export const DURACAO_DA_CHAMA = 0.38;

/** Quanto a chama leva para apagar e a letra assentar. */
export const DURACAO_DO_ASSENTO = 0.52;

/**
 * Em que instante a terceira fase começa, contado do início.
 *
 * Precisa ser menor que `DURACAO_DA_CHAMA`, senão o texto fica parado em
 * vermelho cheio entre as duas tweens e o gesto lê como dois movimentos
 * colados, em vez de brasa que vira letra. Nada lança: só aparece uma pausa.
 */
export const EMENDA_DAS_FASES = 0.3;

/**
 * O teto de tempo de qualquer revelação, do gatilho ao repouso.
 *
 * É bem mais apertado que o da queima, que chegou a 3,15 s, e essa é a
 * correção de fundo. O elemento fica cerca de 890 px dentro do gatilho, que a
 * 1100 px/s dá 0,81 s, e o visitante chega na seção por volta de 0,55 s depois
 * do gatilho. Com este teto o gesto termina praticamente junto com a chegada
 * dele, em vez de ainda estar na metade quando a seção sai pelo topo.
 */
export const ORCAMENTO_DA_BRASA = 1.3;

/** Atraso entre uma chama da programação e a vizinha. */
export const PASSO_ENTRE_CHAMAS = 0.07;

/**
 * Atraso entre os degraus de dentro de uma chama: contorno, rótulo, título,
 * hora.
 */
export const PASSO_DENTRO_DO_CARD = 0.05;

/**
 * Atraso entre um card de avaliação e o vizinho.
 *
 * Maior que `PASSO_ENTRE_CHAMAS` porque são três cards contra quatro chamas
 * dividindo o mesmo orçamento: a fileira mais curta cabe com passo mais largo.
 * Os três são irmãos da mesma linha da grade e têm o mesmo topo, então sem
 * atraso os três gatilhos pegam no mesmo instante e a fileira acende de uma
 * vez. No telefone eles empilham e a própria rolagem já os separa.
 */
export const PASSO_ENTRE_CARDS = 0.12;

/**
 * O atraso de um degrau de uma chama da programação.
 *
 * É função, e não somas escritas na JSX, porque o teste do orçamento precisa
 * perguntar pelo pior degrau exatamente como o componente o calcula. Escritos
 * em dois lugares, os números divergem no dia em que alguém mexer num só, e o
 * que estoura é o orçamento, que não lança.
 */
export function atrasoNaChama(chama: number, degrau: number): number {
  return chama * PASSO_ENTRE_CHAMAS + degrau * PASSO_DENTRO_DO_CARD;
}

/**
 * Quanto custa, do gatilho ao repouso, uma revelação que começa com `atraso`.
 *
 * A terceira fase é quem termina por último, e ela começa na emenda, não no
 * fim da segunda. **Não depende do comprimento do texto**, e é essa a
 * diferença para a queima: lá a cascata era passo vezes número de letras, então
 * quem escrevesse a copy no painel decidia a duração da cena.
 */
export function custoDaBrasa(atraso: number): number {
  return atraso + EMENDA_DAS_FASES + DURACAO_DO_ASSENTO;
}

/** Os três estados da linha do tempo, na ordem em que acontecem. */
export type EstadosDaBrasa = {
  brasa: Record<string, string | number>;
  chama: Record<string, string | number>;
  letra: Record<string, string | number>;
};

/**
 * Monta os três estados.
 *
 * `repouso` é a cor final, e ela vem lida do DOM, nunca escrita aqui: cada
 * linha das duas seções repousa numa cor diferente, carvão no título do
 * evento e branco sobre o véu das avaliações, e um hex fixo pintaria carvão
 * sobre carvão. `brilho` é parâmetro pela mesma razão: em 2026-09-11 o cliente
 * tirou o vermelho da seção que tem foto atrás, então a cor do halo não pode
 * ficar grudada no gesto.
 */
export function estadosDaBrasa(
  brilho: string,
  repouso: string,
  halo = true,
): EstadosDaBrasa {
  /*
   * O halo é opcional porque ele custa por GLIFO, e não por bloco animado.
   *
   * Medido em 2026-09-11, rolando pela seção de avaliações a 900 px/s: com
   * halo no subtítulo e nos três cards, 22,7 ms por quadro e 43% dos quadros
   * acima de 20 ms; sem ele, 16,7 ms, que é exatamente o controle. Desligar o
   * desfoque no lugar dele não mudou nada, 23,3 ms, então a conta é mesmo a
   * sombra: um card tem centenas de letrinhas e cada uma pinta duas cópias
   * borradas sobre a foto de fundo.
   *
   * No display são poucas letras grandes e ele cabe, então lá fica. Ligar
   * isto num bloco de corpo devolve o engasgo, calado.
   */
  const apagado = "0 0 0px rgba(0,0,0,0)";
  return {
    /*
     * Fosca, desfocada e ainda sem forma de letra.
     *
     * A escala e o `y` são de propósito pequenos, e ficaram menores a pedido
     * do cliente em 2026-09-11: o gesto nasceu em 0,88 e 14px e o salto lia
     * como pulo. Quem carrega o fogo é a COR, o halo e o desfoque; o
     * movimento é só o corpo em que eles acontecem. `brasa.test.ts` prende os
     * dois números.
     */
    brasa: {
      opacity: 0, y: 8, scale: 0.965,
      filter: "blur(7px)", color: BRASA_ESCURA,
      textShadow: halo ? `0 0 12px ${brilho}` : apagado,
    },
    // O estalo: acende, o halo estoura e a letra passa de raspão do tamanho
    // final. A ultrapassagem tem teto, ver o teste: acima dele volta o pulo.
    chama: {
      opacity: 1, y: 3, scale: 1.015,
      filter: "blur(2px)", color: BRASA,
      textShadow: halo ? `0 0 26px ${brilho}, 0 0 52px ${brilho}` : apagado,
    },
    // O fogo apaga. Brilho e desfoque precisam zerar aqui, ver o cabeçalho.
    letra: {
      opacity: 1, y: 0, scale: 1,
      filter: "blur(0px)", color: repouso,
      textShadow: apagado,
    },
  };
}

/**
 * Diz se o elemento deve nascer escondido.
 *
 * Escondido na montagem, e não no instante do gatilho, é o que evita a
 * piscada: sem isto o elemento sobe a tela em opacidade cheia, aparece de
 * verdade por uns cem pixels de rolagem, e só então salta para escondido
 * quando o gatilho pega. Mas esconder o que já está à vista seria pior que a
 * piscada, porque apagaria na frente de quem está lendo. Por isso a pergunta é
 * sobre a posição, e não sobre o tempo.
 */
export function escondeNaMontagem(topo: number, alturaDaJanela: number): boolean {
  return topo >= alturaDaJanela;
}

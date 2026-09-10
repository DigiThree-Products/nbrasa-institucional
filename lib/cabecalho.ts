/**
 * As duas contas do header fixo do desktop.
 *
 * Elas moram aqui, e não dentro do componente de cliente que as usa, pelo
 * mesmo motivo de `lib/tituloHero.ts` e `lib/horarios.ts`: as duas erram em
 * silêncio. Uma máscara fora de lugar não lança nada, só desalinha o recorte;
 * um limiar errado estende a barra alguns pixels cedo ou tarde e ninguém vê
 * no console. Função pura tem teste, `useEffect` não tem.
 */

/**
 * Altura da faixa do header, em px.
 *
 * O mesmo número aparece na classe `h-[74px]` do `Header` e na altura do
 * pseudoelemento que pinta a metade esquerda, em `app/globals.css`. Ele
 * precisa estar aqui porque o limiar depende dele: o recorte deixa de valer
 * quando a base do herói cruza a base do header, e essa base é esta altura.
 * `tests/unit/cabecalho.test.ts` falha se os três saírem de sincronia.
 */
export const ALTURA_DO_CABECALHO = 74;

/**
 * Quanto a máscara do header desce, em px, para acompanhar a foto.
 *
 * A máscara do header e a da foto são a mesma forma, ancoradas na mesma
 * altura de referência. Enquanto o header era absoluto, os dois desciam
 * juntos e nada precisava ser feito. Fixo, o header fica parado e a foto sobe:
 * deslocar a máscara pela distância rolada é o que devolve o casamento.
 *
 * O travamento em zero não é defensivo à toa. No repique de fim de curso, o
 * Safari e o trackpad do macOS entregam `scrollY` negativo. Sem trava a
 * máscara desceria, e o recorte abriria um vão branco no alto da foto no
 * exato quadro em que o olho do usuário está nele.
 */
export function deslocamentoDaMascara(rolagem: number): number {
  return Math.max(0, rolagem);
}

/**
 * O herói já saiu de trás da faixa do header?
 *
 * O recorte só é honesto enquanto existe foto atrás dele. A faixa do header
 * ocupa, em coordenadas de página, de `rolagem` a `rolagem + altura da faixa`;
 * a foto ocupa de zero até o fim do herói. Enquanto a base da faixa não passa
 * da base do herói, a foto cobre a faixa inteira e o recorte continua valendo.
 * Passou, e o que aparece pelo vazado é o conteúdo branco rolando por baixo,
 * que é a hora de estender a barra.
 *
 * Altura zero significa "ainda não medi", não "herói sem altura": entre a
 * primeira pintura e o efeito que mede o elemento não há número nenhum.
 * Responder que passou ali faria a barra piscar estendida antes de recolher.
 */
export function passouDoHeroi(rolagem: number, alturaDoHeroi: number): boolean {
  if (alturaDoHeroi <= 0) return false;
  return rolagem > alturaDoHeroi - ALTURA_DO_CABECALHO;
}

/** As três partes em que o título do herói é escalonado. */
export type PartesDoTitulo = { abertura: string; foco: string; fecho: string };

/**
 * Reparte o título do herói em abertura, foco e fecho.
 *
 * O desenho dá três corpos diferentes ao `h1` ("Sua fome" pequeno, "acende"
 * grande e vermelho, "aqui." pequeno de novo), e a regra que decide quem é
 * quem mora aqui, e não na JSX, por dois motivos: o painel de admin ainda
 * pode trocar `heroTitulo` e o destaque precisa acompanhar o texto novo, e o
 * `Hero` é Server Component que arrasta a fachada do Supabase junto, então
 * nenhum teste em jsdom conseguiria importá-lo para exercitar a repartição.
 *
 * A regra: o foco é a penúltima palavra, o fecho é a última, e todo o resto
 * abre o título na primeira linha. Num título de uma palavra só ela vira o
 * foco, porque o destaque é o que não pode faltar; sem palavra nenhuma as
 * três partes saem vazias e o `h1` simplesmente não desenha nada.
 */
export function partesDoTitulo(texto: string): PartesDoTitulo {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);

  if (palavras.length === 0) return { abertura: "", foco: "", fecho: "" };
  if (palavras.length === 1) return { abertura: "", foco: palavras[0], fecho: "" };

  return {
    abertura: palavras.slice(0, -2).join(" "),
    foco: palavras[palavras.length - 2],
    fecho: palavras[palavras.length - 1],
  };
}

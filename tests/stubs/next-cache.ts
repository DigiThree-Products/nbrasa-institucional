/** Substituto de `next/cache` para a suite de integracao.
 *
 *  `unstable_cache` exige o incrementalCache do work store do Next e lanca
 *  fora de um render. A suite de integracao roda em Node puro, entao importar
 *  o modulo real derruba todo teste que chame a fachada.
 *
 *  Neutralizar aqui e o comportamento correto, nao um atalho: o que estes
 *  testes provam e que a fachada devolve o que o banco tem — consulta, RLS e
 *  traducao de snake_case para camelCase. O cache e camada do Next, exercitada
 *  no build e no e2e, e memorizar entre os `it` so mascararia mudanca de dado.
 */
export function unstable_cache<A extends unknown[], R>(
  cb: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return cb;
}

export function revalidateTag(_tag: string): void {}

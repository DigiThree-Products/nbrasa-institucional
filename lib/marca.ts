/**
 * As duas formas de chama da marca, que existem de propósito e não devem ser
 * unificadas.
 *
 * `D_CHAMA_OFICIAL` é a chama do vetor entregue pelo cliente
 * (`fotos-site/logo.svg`): três pinceladas afiladas e separadas, com vãos
 * entre elas. É a marca de verdade, e é ela que aparece como ícone.
 *
 * `D_SILHUETA` é uma gota sólida desenhada à mão. Ela não é a logo, é uma
 * ferramenta: a máscara do herói (`lib/costura.ts`) monta a borda da foto
 * pela união desta forma com um retângulo, e o mascote apoia óculos e boca
 * no corpo dela. A chama oficial não serve para nenhum dos dois, porque uma
 * forma aberta em três traços viraria fitas rasgadas na união e não tem
 * corpo onde encaixar um rosto.
 *
 * Trocar uma pela outra quebra o herói em silêncio: há teste em
 * `tests/unit/costura.test.ts` que impede.
 */

/** viewBox do vetor oficial, na proporção em que ele foi entregue. */
export const VIEWBOX_OFICIAL = "0 0 468.1 684.1";

/**
 * Proporção largura/altura do vetor oficial.
 *
 * Existe porque a chama oficial é bem mais alta que larga (0,684) e os usos
 * de ícone reservavam um quadrado para a silhueta antiga. Quem for
 * dimensionar a `Chama` multiplica a altura por isto para achar a largura.
 */
export const PROPORCAO_OFICIAL = 468.1 / 684.1;

/** Os dois paths de `fotos-site/logo.svg`, na ordem original. */
export const D_CHAMA_OFICIAL = [
  "M396.93,460.52c13.56-33.18,47.31-48.56,61.81-82.15,14.9-34.49,11.05-75.62-4.85-109.73-7.65-16.41-18.25-32.08-29.43-45.76-5.84-7.13-12.13-13.88-19.1-19.63-6.18-5.1-16.38-7.93-21.68-13.33,3.95,4.03,7.13,9.19,9.43,14.79,24.83,60.54-19.38,101-29.76,155.93-8.89,47.05-.01,95.4,28.33,133.55-4.84-6.51,2.95-28.04,5.25-33.66",
  "M192.49,684.1c-160.87-104.04-104.58-227.44-104.58-227.44-1.44,3.17,11.15,21.75,13.03,25.21,4.78,8.82,9.76,17.54,14.98,26.11,5.85,9.6,12.13,18.93,18.78,28,46.9,63.97,128,135.29,209.98,87.79-30.23,14.95-48.08-78.04-50.92-94.36-7.63-43.79-5.64-89.21,2.11-132.39,14.86-82.7,72-177.14,13.2-254.06-32.54-42.56-88.64-49.2-133.38-73.34C150.47,56.02,119.14,31.14,115.63,0c3.95,35.1,6.92,60.51,32.3,87.83,33.79,36.37,61.92,80.74,68.72,130.77,7.19,52.96-17.11,97.95-30.4,147.56-7.53,28.08-13.29,57.5-11.98,86.71.96,21.48,7.91,59.1,33.38,66.14-53.85-14.89-64.53-66.66-56.64-116.99,11.52-73.46,53.07-178.3-14.17-237.73-9.76-8.63-21.08-15.97-31.53-23.82-2.81-2.11-17.49-10.13-17.94-13.94,6.08,57.17-6.88,110.76-32.57,161.46C30.13,336.68-.34,382.75,0,439.48c.29,49.63,20.58,95.68,50.96,134.2,39.37,49.92,89.79,76.96,141.53,110.42",
] as const;

/** Silhueta sólida de recorte, em viewBox 100×116, bico para cima. */
export const D_SILHUETA =
  "M50 3C43 20 34 25 32 39c-1 8 2 12 2 18-12-6-16-17-16-17C9 52 6 63 6 74c0 22 20 39 44 39s44-17 44-39c0-19-11-33-19-43C68 22 58 14 50 3Z";

/** Meia largura da silhueta no viewBox: o eixo dela, usado pela costura. */
export const EIXO_SILHUETA = 50;

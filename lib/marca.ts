/**
 * Silhueta da chama da logo, em viewBox 100×116, bico para cima.
 *
 * Fonte única da curva: consumida pelo anel do header e pelo mascote
 * (`components/ui/Chama.tsx`) e pela costura do herói (`lib/costura.ts`).
 * Duplicar este path em CSS ou num .svg solto faria a marca sair do lugar
 * quando um dos lados fosse ajustado.
 */
export const D_CHAMA =
  "M50 3C43 20 34 25 32 39c-1 8 2 12 2 18-12-6-16-17-16-17C9 52 6 63 6 74c0 22 20 39 44 39s44-17 44-39c0-19-11-33-19-43C68 22 58 14 50 3Z";

/** Meia largura da chama no viewBox: o eixo dela, usado pela costura. */
export const EIXO_CHAMA = 50;

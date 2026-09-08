import {
  ALTURAS, LABAREDAS, baseNoViewBox, linguaDeFogo,
} from "@/lib/labaredas";

/**
 * As labaredas que saem das letras do foco do herói.
 *
 * Decorativa e nada mais: `aria-hidden` e `pointer-events-none`, porque ela
 * mora DENTRO do `h1` e o nome acessível do título precisa continuar sendo a
 * frase inteira. O SVG não carrega texto, então o `textContent` que o buscador
 * lê não muda; o `aria-hidden` garante o mesmo para o leitor de tela.
 *
 * É um `span`, e não um `div`, porque o pai é o `span` do foco: `div` dentro
 * de `span` é HTML inválido e o navegador reabre a caixa no lugar errado.
 *
 * A faixa é absoluta e de altura zero, então **não custa layout nenhum**: as
 * línguas transbordam dela para cima. Quem paga o espaço vertical é a margem
 * do próprio foco, no `Hero`, e não este componente.
 *
 * Tudo em `em`, então o conjunto acompanha os dois `clamp` do foco sozinho.
 * A cor vem de `currentColor` sobre o `text-brasa` do foco: chapada, sem
 * degradê e sem contorno, ao contrário da referência, que é desenho para fundo
 * escuro. Ver o comentário de abertura em `lib/labaredas.ts`.
 */
export function Labaredas() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 block h-0"
      style={{ top: `${ALTURAS.topoDasMaiusculas}em` }}
    >
      {LABAREDAS.map((labareda) => (
        <svg
          key={`${labareda.x}-${labareda.h}`}
          viewBox="0 0 100 100"
          className="absolute overflow-visible"
          style={{
            left: `${labareda.x.toFixed(2)}%`,
            bottom: `${-ALTURAS.afunda}em`,
            width: `${labareda.h}em`,
            height: `${labareda.h}em`,
            transform: "translateX(-50%)",
          }}
        >
          <path
            d={linguaDeFogo(baseNoViewBox(labareda), labareda.d)}
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  );
}

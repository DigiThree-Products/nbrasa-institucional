"use client";

import { useEffect, useState } from "react";

/**
 * Monta o vídeo de fundo do herói só quando ele pode de fato ajudar.
 *
 * Duas guardas, por motivos diferentes:
 *
 * - `prefers-reduced-motion`, porque um laço de fundo é movimento que
 *   ninguém pediu. Aqui a guarda vale dobrado: sem montar o elemento, o
 *   arquivo de 1 MB não é nem requisitado.
 * - o adiamento, porque o elemento candidato a LCP é a foto que está logo
 *   atrás deste vídeo. Montar os dois juntos põe 1 MB disputando banda com o
 *   LCP no pior momento possível.
 *
 * O `poster` é a mesma foto que já estava no herói, então enquanto o vídeo
 * não chega, e para quem nunca vai receber, o quadro continua idêntico ao
 * que era antes desta mudança.
 */
export function VideoFachada({
  poster,
  recorte,
}: {
  poster: string;
  recorte: string;
}) {
  const [montar, setMontar] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 1,2 s é folgado o bastante para a foto do herói já ter pintado em
    // conexão ruim, e curto o bastante para o vídeo entrar antes de o
    // visitante rolar para fora da dobra.
    const relogio = window.setTimeout(() => setMontar(true), 1200);
    return () => window.clearTimeout(relogio);
  }, []);

  if (!montar) return null;

  return (
    <video
      src="/video-fachada.mp4"
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: recorte }}
    />
  );
}

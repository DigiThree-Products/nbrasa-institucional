"use client";

import { useEffect, useState } from "react";
import { Chama } from "@/components/ui/Chama";

const CHAVE = "nbrasa:preloader";
const TETO_MS = 1200;

export function Preloader() {
  // Estado inicial fixo em `false` nos dois lados: o servidor não tem acesso
  // ao sessionStorage, então ler a chave já na inicialização do useState
  // divergiria do HTML estático e quebraria a hidratação. A checagem real
  // acontece no efeito abaixo, que só roda no cliente após montar.
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE) === null) setVisivel(true);
    } catch { /* modo privado: mantém oculto */ }
  }, []);

  useEffect(() => {
    if (!visivel) return;

    const fechar = () => {
      try { sessionStorage.setItem(CHAVE, "1"); } catch { /* modo privado */ }
      setVisivel(false);
    };

    const t = setTimeout(fechar, TETO_MS);
    window.addEventListener("keydown", fechar, { once: true });
    window.addEventListener("pointerdown", fechar, { once: true });
    window.addEventListener("wheel", fechar, { once: true, passive: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", fechar);
      window.removeEventListener("pointerdown", fechar);
      window.removeEventListener("wheel", fechar);
    };
  }, [visivel]);

  if (!visivel) return null;

  return (
    <div
      role="status" aria-label="Carregando"
      // pointer-events-none: os listeners de dismiss ficam em `window`, entao
      // o painel nao precisa ser o alvo do ponteiro para se fechar — e nao
      // pode ser, senao ele engole o primeiro toque do visitante (ex.: um
      // tap em "Pedir no WhatsApp" durante os ~1,2s do preloader fecharia o
      // painel em vez de abrir o WhatsApp). Com pointer-events-none, o mesmo
      // tap alcanca o elemento por baixo E dispara o pointerdown em window.
      className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-brasa motion-safe:animate-pulse"
    >
      <Chama className="h-24 w-24 text-branco" />
      <span className="sr-only">Acendendo a brasa…</span>
    </div>
  );
}

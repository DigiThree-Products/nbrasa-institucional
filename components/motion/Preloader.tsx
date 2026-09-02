"use client";

import { useEffect, useState } from "react";
import { Chama } from "@/components/ui/Chama";

const CHAVE = "nbrasa:preloader";
const TETO_MS = 1200;

export function Preloader() {
  const [visivel, setVisivel] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(CHAVE) === null; } catch { return false; }
  });

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
      className="fixed inset-0 z-[100] grid place-items-center bg-brasa motion-safe:animate-pulse"
    >
      <Chama className="h-24 w-24 text-branco" />
      <span className="sr-only">Acendendo a brasa…</span>
    </div>
  );
}

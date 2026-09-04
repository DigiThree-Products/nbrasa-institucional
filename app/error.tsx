"use client";

import { useEffect } from "react";

export default function Erro({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
      <h1 className="font-display text-[3.68rem] uppercase">Algo saiu do ponto</h1>
      <p className="mt-4 text-creme-texto">
        Não conseguimos carregar esta parte da página. Tente de novo.
      </p>
      <button onClick={reset}
              className="mt-8 rounded-full bg-brasa px-6 py-3 font-bold uppercase tracking-widest text-branco">
        Tentar de novo
      </button>
    </main>
  );
}

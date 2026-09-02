"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
      <h1 className="font-display text-5xl uppercase">Algo saiu do ponto</h1>
      <p className="mt-4 text-cinza">
        Não conseguimos carregar esta parte da página. Tente de novo.
      </p>
      <button onClick={reset}
              className="mt-8 rounded-full bg-brasa px-6 py-3 font-bold uppercase tracking-widest">
        Tentar de novo
      </button>
    </main>
  );
}

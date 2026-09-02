"use client";

import { useEffect, useRef, useState } from "react";

export type LinkNav = { href: string; rotulo: string };

export function MenuMobile({ links }: { links: LinkNav[] }) {
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("keydown", onKey);
    painel.current?.querySelector<HTMLElement>("a")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-fumaca md:hidden"
      >
        <span className="block h-0.5 w-[18px] bg-branco shadow-[0_-6px_0_#fff,0_6px_0_#fff]" />
      </button>

      {aberto && (
        <div
          ref={painel} role="dialog" aria-modal="true" aria-label="Menu de navegação"
          className="fixed inset-0 z-[80] flex flex-col gap-6 bg-carvao p-8 pt-24"
        >
          <button
            type="button" aria-label="Fechar menu" onClick={() => setAberto(false)}
            className="absolute right-6 top-6 h-11 w-11 rounded-xl border-2 border-fumaca text-2xl leading-none"
          >×</button>
          {links.map((l) => (
            <a
              key={l.href} href={l.href} onClick={() => setAberto(false)}
              className="font-display text-4xl uppercase leading-none"
            >{l.rotulo}</a>
          ))}
        </div>
      )}
    </>
  );
}

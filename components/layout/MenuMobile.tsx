"use client";

import { useEffect, useRef, useState } from "react";

export type LinkNav = { href: string; rotulo: string };

const FOCAVEIS = "a[href], button:not([disabled])";

export function MenuMobile({ links }: { links: LinkNav[] }) {
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const alternar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    // Copiado para uma local: o cleanup roda depois que React já pode ter
    // desmontado/trocado o ref, e o lint (react-hooks/exhaustive-deps)
    // alerta exatamente sobre ler `alternar.current` de novo no cleanup.
    const botaoAlternar = alternar.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        return;
      }
      if (e.key === "Tab") {
        const focaveis = painel.current?.querySelectorAll<HTMLElement>(FOCAVEIS);
        if (!focaveis || focaveis.length === 0) return;
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    painel.current?.querySelector<HTMLElement>("a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      botaoAlternar?.focus();
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={alternar}
        type="button"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        aria-hidden={aberto || undefined}
        tabIndex={aberto ? -1 : undefined}
        onClick={() => setAberto((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-fumaca md:hidden"
      >
        <span className="flex flex-col items-center gap-[6px]">
          <span className="block h-0.5 w-[18px] bg-branco" />
          <span className="block h-0.5 w-[18px] bg-branco" />
          <span className="block h-0.5 w-[18px] bg-branco" />
        </span>
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

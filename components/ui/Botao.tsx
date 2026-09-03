import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  variante?: "solido" | "fantasma";
  className?: string;
};

const base =
  "inline-flex items-center gap-2 rounded-full px-5 py-3 text-[.79rem] font-extrabold " +
  "uppercase tracking-[.13em] transition-transform hover:-translate-y-0.5";

const variantes = {
  solido: "bg-brasa text-branco hover:brightness-110",
  fantasma: "border-2 border-fumaca text-branco hover:border-branco",
} as const;

export function Botao({ children, href, variante = "solido", className = "" }: Props) {
  const classe = `${base} ${variantes[variante]} ${className}`;
  return href
    ? <a href={href} className={classe}>{children}</a>
    : <button type="button" className={classe}>{children}</button>;
}

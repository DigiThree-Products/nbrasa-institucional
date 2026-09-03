import { createClient } from "@supabase/supabase-js";

function exigir(nome: string): string {
  const v = process.env[nome];
  if (!v) {
    throw new Error(
      `Variável de ambiente ${nome} ausente. Copie .env.example para ` +
      `.env.local e preencha com os valores do painel do Supabase ` +
      `(Project Settings > API).`,
    );
  }
  return v;
}

export const SUPABASE_URL = exigir("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = exigir("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/** Cliente de leitura, usado pelos Server Components através de lib/conteudo.ts.
 *  Usa a chave anônima: o que ele pode ler é decidido pelas policies de RLS,
 *  não por confiança no código. */
export function criarClienteServidor() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

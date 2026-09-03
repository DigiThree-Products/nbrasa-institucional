import { createClient } from "@supabase/supabase-js";

function exigir(nome: string): string {
  const v = process.env[nome];
  if (!v) {
    // Cita os dois ambientes de proposito: a primeira versao desta mensagem so
    // falava de .env.local, e quando o build da Vercel quebrou por falta da
    // variavel ela mandou procurar no lugar errado.
    throw new Error(
      `Variável de ambiente ${nome} ausente.\n` +
      `Local: copie .env.example para .env.local e preencha com os valores ` +
      `do painel do Supabase (Project Settings > API Keys).\n` +
      `Deploy: cadastre-a nas variáveis de ambiente do projeto na Vercel, ` +
      `marcando Production, Preview e Development. Sem ela o build falha ao ` +
      `coletar as páginas, não em runtime.`,
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

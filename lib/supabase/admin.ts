import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./servidor";

/** Cliente com service role: IGNORA RLS por completo.
 *
 *  Use apenas em scripts locais (seed, manutenção). Nunca importe este módulo
 *  de dentro de `app/` ou `components/` — a chave não pode alcançar o bundle
 *  do cliente nem o runtime de request. */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ausente. Ela só existe em .env.local e nas " +
      "variáveis da Vercel; nunca no repositório.",
    );
  }
  return createClient(SUPABASE_URL, chave, { auth: { persistSession: false } });
}

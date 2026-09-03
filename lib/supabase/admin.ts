// Guarda de build: faz o build falhar se este módulo for puxado para um
// bundle de cliente (qualquer arquivo com "use client" na cadeia de
// importação). Isso torna a regra do comentário abaixo uma checagem do
// toolchain, não apenas uma convenção que depende da memória de quem edita.
import "server-only";

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
      "SUPABASE_SERVICE_ROLE_KEY ausente. Copie .env.example para .env.local " +
      "e preencha com o valor do painel do Supabase (Project Settings > API " +
      "> service_role); ela também precisa estar nas variáveis de ambiente " +
      "da Vercel. Nunca no repositório.",
    );
  }
  return createClient(SUPABASE_URL, chave, { auth: { persistSession: false } });
}

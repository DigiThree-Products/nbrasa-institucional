import { defineConfig } from "vitest/config";
import path from "node:path";

// Suite separada da unitaria de proposito: estes testes falam com o Supabase
// real. A unitaria precisa continuar rapida e offline; esta precisa de rede,
// de .env.local carregado (ver o script test:integracao) e de mais folga de
// tempo por causa da latencia ate South America (Sao Paulo).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integracao/**/*.test.ts"],
    testTimeout: 20_000,
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
});

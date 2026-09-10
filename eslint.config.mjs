import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Worktrees do Claude Code moram DENTRO do projeto, e cada uma traz o
      // proprio `.next` e o proprio `node_modules`. Sem esta linha o lint
      // varre o build de outra branch e devolve milhares de problemas que nao
      // sao deste codigo: medido, 6789 de uma vez.
      ".claude/worktrees/**",
    ],
  },
];

export default eslintConfig;

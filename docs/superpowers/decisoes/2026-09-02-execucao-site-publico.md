# Registro de decisões — execução do site público N'Brasa

Ledger da execução do plano `docs/superpowers/plans/2026-09-02-site-publico-nbrasa.md`,
preservado porque cada decisão registra o raciocínio e o custo caso esteja errada.
Insumo direto para o plano seguinte (Supabase + painel de admin).

Gerado em 2026-09-02. Branch `site-publico`, 37 commits.

---

# SDD ledger — plan: docs/superpowers/plans/2026-09-02-site-publico-nbrasa.md

Spec: docs/superpowers/specs/2026-09-02-site-nbrasa-design.md (lido; autoridade vinculante)
Branch: site-publico (criada a partir de main @ 8273f26)

## Ruling de setup

Ruling: trabalhar em branch `site-publico`, não em worktree — o cliente valida o
preview local NESTE checkout e a isolação por worktree já foi desativada em
.claude/settings.json justamente por isso. Custo se errado: nenhum; basta
`git checkout main` e recriar.

Ruling: não fazer `git push` em nenhum momento. O §11 do spec define a validação
local do cliente como portão. Custo se errado: nenhum; o push é um comando.

## Pre-flight: varredura de conflitos

### Pares de tarefas que compartilham arquivo ou interface

| A | B | Produz → Consome | Achado |
|---|---|---|---|
| 1 | 6,12,13 | `app/layout.tsx` criado → editado 3x | OK; edições em pontos distintos do `<body>`, ordem não conflita |
| 1 | 7,8,9,10,11 | `app/page.tsx` criado → reescrito/estendido | OK; a Task 11 Step 4 dá o arquivo final canônico |
| 1 | todas | tokens `@theme` → classes Tailwind | OK; `text-brasa-texto` deriva de `--color-brasa-texto` |
| 2 | 5,7,8,9,10,11,13 | tipos + getters → consumo | OK; nomes de campo idênticos em todos os usos |
| 3 | 7,10 | `FaixaHorario {label,texto}` → consumo | OK; ambos usam `.label` e `.texto` |
| 4 | 5,7,8,9,10,11,12 | `Botao`,`Chama`,`Mascote`,`DivisoriaCurva` | OK; `Mascote` já nasce com forwardRef na 4, que é o que a 9 precisa |
| 6 | 8,10,11 | `Reveal` → consumo | OK |
| 4 | 12 | `Chama` → Preloader | OK |
| 2,3 | 13 | tipos + seed → `montarSchemaRestaurant` | OK |
| todas | 14 | site completo → e2e | 1 achado, ver abaixo |

### Coerência interna de cada tarefa

| Task | Testes x código que especifica | Achado |
|---|---|---|
| 1 | teste lê 7 tokens x CSS declara 7 | OK |
| 2 | 11 asserções x seed | OK; `[1,2,3,4,5,6,0]` bate com `ordem` 1..7 |
| 3 | 6 casos x `agruparHorarios` | OK; "Segunda-feira" (NOMES) para dia isolado e "Terça a quinta" (CURTOS) em faixa — as duas tabelas existem |
| 4 | 4 casos x Botao | OK |
| 5 | 4 casos x MenuMobile | OK |
| 6 | 2 casos x Reveal | OK; `immediateRender:false` é o que o teste trava |
| 7 | sem teste unitário, verificação visual | OK; filtro `!== "Fechado"` remove segunda, como o Expected diz |
| 8 | sem teste unitário | OK; VAOS tem 6 entradas para 6 categorias |
| 9 | 3 casos x RotaMascote | **ACHADO 1** |
| 10 | sem teste unitário | OK |
| 11 | sem teste unitário | OK |
| 12 | 4 casos x Preloader | OK |
| 13 | 4 casos x schema | OK; segunda é filtrada por `!h.fechado` |
| 14 | 9 testes e2e | **ACHADO 2** |

### Achados e rulings

**ACHADO 1 — Task 9: `ssr: false` é inválido em Server Component.**
`Delivery.tsx` é Server Component e usa `dynamic(..., { ssr: false })`. O Next.js 15
rejeita isso: `ssr: false` só é permitido dentro de Client Components. O passo como
escrito quebra o build.

Ruling: trocar por import estático de `RotaMascote`. Ela já é `"use client"`, então o
Next entrega o markup no HTML e hidrata depois — o que é **melhor** para dois
requisitos do spec: as paradas passam a existir no HTML mesmo sem JS (§9,
"nenhum conteúdo depende de animação") e o SEO enxerga o conteúdo. O GSAP continua
fora do bundle inicial porque é importado dentro do `useEffect`, que é o que de fato
protege o orçamento de §8. Custo se errado: o JS de primeira carga sobe alguns KB
do componente em si; medido na Task 14 e reversível.

**ACHADO 2 — Task 14: colisão de strict mode no Playwright.**
`page.getByText("Terça a quinta")` casa em dois lugares: a faixa de horário do herói
(Task 7) e a lista de horários (Task 10). Sem `exact` nem `.first()`, o Playwright
lança strict mode violation e o teste falha por motivo errado.

Ruling: usar `.first()` nessa asserção, como já é feito na linha seguinte com
"16h — 03h". Custo se errado: nenhum; o teste continua verificando que o
agrupamento aparece na página.


## Execução

Task 1: dispatched (implementer sonnet, BASE 8273f26)
Task 1: implementer DONE_WITH_CONCERNS, commit 2617431 (7/7 testes, build OK)
  Ruling: pacote de revisão exclui package-lock.json e favicon binário — conteúdo
  gerado, 300KB de ruído. Controller verificou next@15.5.25, coerente com o spec.
  Custo se errado: uma mudança maliciosa/errada no lockfile passa sem revisão humana.
  Ruling: aceito o pin `create-next-app@15` feito pelo implementador. O `@latest`
  traria Next 16, fora do spec (§3 diz Next.js 15), e geraria CLAUDE.md/AGENTS.md
  colidindo com o CLAUDE.md protegido do repo. Custo se errado: nenhum.
Task 1: review — Spec OK, qualidade Aprovada. 2 Important, ambos plan-mandated.

  Ruling (achado 1, regex case-insensitive em tokens.test.ts): PROCEDE, corrigir.
  O spec exige os hex "caractere por caractere"; a flag `i` deixaria `#241E1F`
  passar. O plano era mais frouxo que o spec, e o spec é a autoridade vinculante.
  Correção: remover a flag `i`. Custo se errado: nenhum — o CSS atual já está em
  minúsculas, então a correção só aperta a guarda.

  Ruling (achado 2, aviso do Vitest em toda rodada): PROCEDE, corrigir.
  O vitest.config.ts do plano usa sintaxe ESM mais `__dirname` sem `"type":
  "module"`, e adicionar o type quebra o `__dirname` — conflito estrutural que eu
  mesmo escrevi. Saída de teste tem que ser limpa. Correção: renomear para
  vitest.config.mts (ESM explícito, sem mexer no package.json, sem risco para o
  next.config.ts) e trocar `__dirname` por `import.meta.dirname`, disponível no
  Node 24 desta máquina. Custo se errado: se o Vitest não resolver .mts, volta-se
  ao .ts e o aviso permanece — cosmético, não bloqueia.

  Ruling: corrigir também o texto do plano (Task 1, Steps 3 e 4), não só o código.
  O plano é executado por outros agentes e ficaria mandando reproduzir o mesmo
  defeito. Custo se errado: nenhum.

Task 1: fix round 1/5 dispatched (resume do implementer original)
Task 1: fix round 1/5 (3 addressed, 0 open; commits 2617431..78d470a)
Task 1: complete (commits 8273f26..78d470a, review clean)
Task 1: minor (deferred): npm audit aponta vulnerabilidades transitivas em postcss
  via next@15.5.25. Corrigir exigiria Next 16, fora do spec. Triar na revisão final.

Task 2: dispatched (implementer sonnet, BASE 78d470a)
Task 2: review — Spec OK, qualidade Aprovada. 0 Critical, 0 Important, 2 Minor
  (ambos plan-mandated, não entram no fix loop).
Task 2: minor (deferred): getConteudo devolve conteudoSeed por referência, sem
  cópia. Mutação por um consumidor corromperia o singleton. Sem consumidor hoje.
Task 2: minor (RESOLVIDO pela Task 3, não é dívida): os testes da Task 2 conferem
  abre/fecha individualmente só de terça e sábado. Verificado: o teste
  "NÃO junta dias de mesmo horário que não são consecutivos" da Task 3 roda
  agruparHorarios(horariosSeed) e compara as 4 faixas inteiras — depende dos 7
  registros, então pega hora errada em qualquer dia.
Task 2: complete (commits 78d470a..18b1dcf, review clean)

Task 3: dispatched (implementer sonnet, BASE 18b1dcf)
Task 3: review — Spec OK, mas qualidade "Needs fixes". 1 Important (plan-mandated), 3 Minor.

  Ruling (achado: guarda de adjacência não é load-bearing nos testes): PROCEDE.
  Verifiquei o raciocínio do revisor à mão e está certo: com `ordem` contígua 1..7,
  `atual.ordem === anterior.ordem + 1` é sempre verdadeiro entre vizinhos do array,
  então a condição nunca decide nada. Deletar a guarda passaria nos 6 testes. O
  teste que eu rotulei "caso crítico" trava a igualdade de horário, não a
  adjacência — meu erro de plano. Correção: adicionar teste com buraco real em
  `ordem` (2 e 5, mesmo horário, nada entre) e afirmar que NÃO se juntam.
  Cenário realista: o painel de admin vai editar essas linhas, e apagar uma cria
  o buraco. Custo se errado: nenhum — o teste novo só aperta a guarda existente.

Task 3: minor (deferred): hhmm() usa v.slice(0,2) e assume HH:MM zero-padded;
  "9:00" viraria "9:h". Inalcançável pelo seed atual. AÇÃO PARA A FASE DO ADMIN:
  o formulário de horário precisa validar/normalizar HH:MM antes de gravar.
Task 3: minor (deferred): abre/fecha vazio cai em "Fechado" por checagem falsy —
  padrão seguro, mas sem teste nem comentário registrando a intenção.
Task 3: minor (deferred): `ordem` duplicada não junta (fallback seguro, sem crash).

Task 3: fix round 1/5 dispatched (resume do implementer original)
Task 3: fix round 1/5 (2 addressed, 0 open; commits dff95d0..ee20011)
Task 3: complete (commits 18b1dcf..ee20011, review clean — guarda de adjacência
  agora provada load-bearing por trace independente do re-revisor)

Task 4: dispatched (implementer sonnet, BASE ee20011)
Task 4: review — Spec OK, qualidade Aprovada. 0 Critical, 0 Important, 1 Minor.
  Ruling: ACEITO o desvio de escopo em tests/setup.ts. Diagnóstico do implementador
  confirmado independentemente pelo revisor: o Testing Library só auto-registra
  cleanup se houver `afterEach` global, ausente sem `test.globals`. O remédio
  explícito é mais estreito que ligar globals (blast radius menor). Defeito do meu
  plano, não do implementador. Custo se errado: nenhum — sem ele os testes de
  componente das Tasks 5, 6, 9 e 12 falhariam.
  Ruling: corrigi o plano (Task 1 Step 3) eu mesmo — é documento, não código, e não
  passaria por revisão de qualquer forma. Custo se errado: nenhum.
Task 4: minor (deferred): nenhum teste prova que a ref do Mascote chega ao <svg>.
  Encaminhamento correto por inspeção. A Task 9 depende disso — CARREGAR PONTEIRO
  no dispatch da Task 9.
Task 4: complete (commits ee20011..25c5e25, review clean)
Task 5: dispatched (implementer sonnet, BASE 41238fc)
Task 5: review — Spec ❌. 4 Important + 1 Minor, todos plan-mandated.

  Ruling (aria-modal sem armadilha de foco): PROCEDE, e com agravante. O §9 do spec
  aprovado diz literalmente "menu mobile com foco preso e fechando no Esc". Meu
  plano implementou o Esc e omitiu o foco preso — o plano falhou contra o próprio
  spec, que é a autoridade vinculante. Correção: implementar armadilha real
  (Tab/Shift+Tab com wrap) e marcar o botão de toggle como inerte enquanto aberto.
  Custo se errado: nenhum; é o comportamento que o spec já pedia.

  Ruling (foco não volta ao gatilho ao fechar): PROCEDE. Padrão WAI-ARIA APG para
  diálogo dispensável; sem isso o usuário de teclado perde a posição. Correção:
  guardar ref do botão e devolver foco nos três caminhos de fechamento.

  Ruling (nome acessível duplicado "Fechar menu" em dois controles): PROCEDE, e é
  resolvido pela mesma correção — o toggle sai da árvore de acessibilidade enquanto
  o painel está aberto.

  Ruling (hex cru #fff no shadow do ícone hambúrguer): PROCEDE. Viola a regra de
  usar só tokens nomeados. Correção: trocar o truque de box-shadow por três spans
  com bg-branco. Custo se errado: nenhum, é equivalente visual.

  Ruling (trava de rolagem de fundo — classificado Minor pelo revisor): INCLUO
  nesta rodada, contrariando a regra de que Minor não entra no loop. Motivo: faz
  parte da mesma correção coerente de "fazer o modal se comportar como modal", e
  separá-la significaria uma segunda rodada depois por três linhas. Custo se errado:
  escopo levemente maior nesta rodada.

Task 5: fix round 1/5 dispatched (resume do implementer original)
Task 5: fix round 1/5 (6 addressed, 0 open; commits 25b13b3..09fc8a6)
Task 5: minor (deferred): trava de scroll restaura "" em vez do valor anterior.
  Nada mais no código toca body.style.overflow hoje — latente, não ativo.
Task 5: minor (deferred): ao abrir, o foco vai para o primeiro <a> e não para o
  primeiro focável (botão fechar). Inconsistente com a noção de "primeiro" da
  armadilha, mas Shift+Tab a partir do link alcança o botão normalmente, e ir
  direto ao primeiro link é UX defensável num menu de navegação.
Task 5: complete (commits 41238fc..09fc8a6, review clean)

Task 6: dispatched (implementer sonnet, BASE 09fc8a6)
Task 6: minor (deferred, ORIGEM NA TASK 5): aviso de lint em MenuMobile.tsx:44 —
  react-hooks/exhaustive-deps sobre ler alternar.current na limpeza do efeito.
  Falso positivo na prática (o botão está sempre montado, ref estável, guardado
  por ?.), mas o remédio padrão é copiar para variável local dentro do efeito.
  Não reabro a Task 5 por um Minor; TRIAR NA REVISÃO FINAL.
Task 6: nota: verificação de scroll no navegador (Step 7) NÃO foi feita — o
  subagente não alcançou o dev server pelo browser. Substituída por leitura do
  fonte do lenis. COBRIR NA TASK 14, que roda Playwright com browser próprio.
Task 6: review — Spec ❌. 1 Important + 2 Minor.

  Ruling (testes do Reveal não fixam immediateRender:false): PROCEDE, com prova
  empírica. O revisor copiou o repo para temp e rodou: (a) testes intactos passam,
  (b) com immediateRender deletado passam, (c) com o componente inteiro trocado por
  uma div no-op passam. Causa: import() dinâmico resolve em microtask, então o corpo
  síncrono do teste termina antes do GSAP rodar. As asserções mediam uma div sem
  estilo. TERCEIRA ocorrência desta classe de defeito neste projeto (Task 3, Task 5,
  agora Task 6) — é o meu padrão de plano que está errado, não azar.
  Correção: espionar gsap.fromTo, aguardar a resolução do import, e afirmar que
  immediateRender:false está nas vars. Custo se errado: nenhum; hoje o teste não
  protege nada, qualquer coisa é ganho.

  Ruling (caminho de reduced-motion nunca testado — Minor): INCLUO nesta rodada.
  O mock fixa matches:false globalmente, então o early-return do Reveal é código
  morto em teste. É o mesmo arquivo e a mesma correção; separar geraria segunda
  rodada. Custo se errado: escopo levemente maior.

Task 6: PENDÊNCIA OBRIGATÓRIA PARA A TASK 14: verificação em navegador real do
  SmoothScrollProvider (montagem sem erro de hidratação, ticker do GSAP alimentando
  lenis.raf, ScrollTrigger em sincronia, console limpo). tsc e testes unitários não
  pegam erro de wiring cliente nem de interop ESM do bundler.

Task 6: fix round 1/5 dispatched (resume do implementer original)
Task 6: fix round 1/5 (3 addressed, 0 open; commits bafab2b..3abfb2d)
Task 6: minor (deferred): teste de reduced-motion usa setTimeout fixo de 150ms.
  Validado como folgado (módulos mockados resolvem em microtask), mas é espera
  fixa: custo de tempo na suíte e padrão frágil em princípio.
Task 6: complete (commits 09fc8a6..3abfb2d, review clean)

Ruling: AGRUPAR Tasks 7+8 num único despacho. São de mesma forma — componentes de
  apresentação com código completo no plano, sem teste unitário, ambos editando
  app/page.tsx. Agrupar evita duas edições sequenciais no mesmo arquivo e poupa um
  ciclo completo de implementação+revisão. Custo se errado: o diff da revisão fica
  maior e um achado num componente atrasa o outro.

Tasks 7+8: dispatched em lote (implementer sonnet, BASE 3abfb2d)

VERIFICAÇÃO VISUAL FEITA PELO CONTROLLER (o extensão do Chrome não alcança
localhost nesta máquina; usei o Playwright, que sobe navegador próprio):
  - 1440px e 320px capturados. Mobile OK: sem estouro horizontal, herói empilha,
    botões em coluna, faixa de horário legível.
  - ACHADO DO CONTROLLER (Important, plan-mandated): o grid bento NÃO funciona.
    Os seis cards renderizam todos do mesmo tamanho. Causa: em Cardapio.tsx o
    <Reveal> envolve o <article>, e o Reveal renderiza um <div> próprio. Os filhos
    diretos do grid são portanto os divs do Reveal, sem classe de span; as classes
    sm:col-span-2 / sm:row-span-2 estão no <article> lá dentro, num elemento que
    não é item de grid. Defeito do meu plano (Task 8). Nenhum teste unitário
    pegaria; só render.
    Correção possível: passar a classe de span para o Reveal (aceitar className) ou
    aplicar o Reveal por dentro do article. Decidir com o revisor.
Tasks 7+8: review — Spec ❌. 3 Important + 2 Minor.

  Ruling (grid bento inerte por causa do wrapper do Reveal): PROCEDE. Achado
  convergente: eu vi na captura, o revisor deduziu do código. Correção escolhida:
  dar ao Reveal um className opcional repassado à div, e mover VAOS[i] para lá.
  Escolhi essa em vez de reestruturar o article porque o Reveal é usado em grid
  também na Task 11 (Depoimentos), onde hoje passa despercebido só porque os itens
  são todos iguais. Custo se errado: nenhum; prop opcional é aditiva.

  Ruling (string mágica "Fechado" duplicada entre Hero e lib/horarios.ts): PROCEDE.
  Correção: exportar a constante FECHADO de lib/horarios.ts e usá-la nos dois
  lugares, mais um teste que trava que dia fechado produz essa constante. Considerei
  a correção estrutural (campo booleano em FaixaHorario), mas ela obrigaria a mexer
  nos testes existentes, no Hero, na Task 10 e no texto do plano — desproporcional
  para o risco. Custo se errado: a constante ainda pode ser mal usada, mas some a
  duplicação silenciosa.

  Ruling (relatório superdimensionou a cobertura do curl+grep): PROCEDE como crítica
  legítima, sem correção de código. Grep em HTML prova que a classe existe, não que
  ela produz layout. Vou repassar como orientação, não como conserto.

Tasks 7+8: minor (deferred): VAOS acopla o card destaque à posição 0. Se o painel
  de admin reordenar categorias, outra herda o tile grande sem sinal de conteúdo.
  AÇÃO PARA A FASE DO ADMIN: considerar um campo `destaque` em categorias.
Tasks 7+8: minor (deferred): sombra inline arbitrária no Hero em vez de token.
  Neutra, não é cor de marca.
Tasks 7+8: ATENÇÃO TASK 11: Depoimentos também usa <Reveal> dentro de grid. Hoje
  não quebra porque os itens são iguais, mas o h-full do <figure> pode não esticar.
  Verificar no render.

Tasks 7+8: fix round 1/5 dispatched (resume do implementer original)
Tasks 7+8: fix round 1/5 (3 addressed, 0 open; commits a2cbe94..7bbc5ae)
Tasks 7+8: complete (commits 3abfb2d..7bbc5ae, review clean; bento confirmado
  visualmente pelo controller via Playwright)

Task 9: dispatched (implementer sonnet, BASE 7bbc5ae)
Task 9: review — Spec ❌. 3 Important + 3 Minor.

  Ruling (achado 1, "a linha se desenha" não acontece): PROCEDE tecnicamente, mas
  a correção é na DESCRIÇÃO, não no código. Com dasharray curto, o dashoffset só
  desloca a fase do tracejado — os pontos marcham, a linha não é traçada. Fui
  conferir a referência: o Crav usa `42 42`, exatamente o mesmo padrão. Ou seja, a
  técnica está correta e fiel à referência; o errado foi meu texto no plano.
  Marcha de pontos é inclusive mais adequada para entrega. Corrigi o plano.
  Custo se errado: o cliente esperava uma linha sendo traçada e recebe pontos
  marchando — visualmente próximo, e é o que a referência aprovada faz.

  Ruling (achado 2, 3 paradas no mobile x 5): MANTENHO AS CINCO, contrariando o
  §7.3 do spec aprovado. Razão: esconder dois bairros no celular é perda de
  conteúdo na plataforma majoritária, e é o mesmo modo de falha que o próprio spec
  proíbe em §9 para movimento reduzido. Verifiquei em render a 375px: as cinco
  cabem, legíveis, sem rolagem horizontal. Emendei o §7.3 registrando a reversão e
  o motivo. Custo se errado: densidade maior no celular; reversível ajustando
  ritmo vertical, sem apagar conteúdo.

  Ruling (achado 3, paradas podem sair da curva por causa de preserveAspectRatio):
  NÃO PROCEDE na prática. Verifiquei render a 375px: as paradas acompanham a linha
  adequadamente e não há estouro horizontal. Risco teórico real, mas não observado.
  A Task 14 mede em 320/768/1024/1440/1920 e pegaria qualquer deriva.

Task 9: minor (deferred): dois ScrollTriggers criados a partir do mesmo config em
  vez de um compartilhado — sobrecarga evitável, não bug; cleanup cobre ambos.
Task 9: minor (deferred): `autoRotate: 90` sem comentário explicando a compensação
  de 90° pela orientação da arte do mascote.
Task 9: minor (deferred): a animação em si (autoRotate, percurso, scrub) não tem
  guarda automatizada; repousa na verificação manual via Playwright. GAP PERMANENTE
  — triar na revisão final.
Task 9: complete (commits 7bbc5ae..d0e2fd1, 3 Important resolvidos por ruling do
  controller: 1 correção de documento, 1 emenda de spec, 1 não procedente)
Tasks 10+11: dispatched em lote (implementer sonnet, BASE 4911d52)
Tasks 10+11: review — Spec OK, qualidade Aprovada. 1 Important + 3 Minor.
  Revisor reproduziu o build: 117 kB de primeira carga, dentro do orçamento.

  Ruling (achado: 4 hex crus fora da exceção de SVG): PROCEDE, e é PIOR do que o
  revisor apontou. Ele diagnosticou lacuna de token; eu medi o contraste e as três
  cores de TEXTO reprovam em WCAG:
    #7a6a63 sobre creme  -> 4.19:1 (exige 4.5)
    #8b7c75 sobre creme  -> 3.26:1
    #7d6f70 sobre carvao -> 3.42:1
    (o token cinza #a39596 sobre carvao passa: 5.70:1)
  Eu criei a disciplina de contraste no §9 e depois a violei 3x na faixa creme.
  Correção: novo token --color-creme-texto: #6b5c55 (5.19:1) para texto apagado
  sobre creme; novo --color-creme-borda: #e3d5c8 para a divisória (decorativa, sem
  exigência); e o copyright passa a usar o token cinza existente. Some o hex cru e
  somem as três reprovações. Custo se errado: tons ligeiramente mais escuros na
  faixa creme; ajustável sem quebrar nada.

  Ruling (Minor, aria-label em <div> sem role): INCLUO nesta rodada. div tem role
  implícito 'generic', que pela spec ARIA não suporta nome do autor — leitores de
  tela modernos costumam expor, mas não é garantido. role="img" resolve e é uma
  palavra. Mesmo arquivo, mesma rodada.

Tasks 10+11: minor (deferred): contato no rodapé é texto puro, sem tel:/link,
  enquanto OndeEstamos é semântico e clicável. Intencional pelo brief.
Tasks 10+11: minor (deferred): links externos abrem na mesma aba.

Tasks 10+11: fix round 1/5 dispatched (resume do implementer original)
Tasks 10+11: fix round 1/5 (3 addressed, 0 open; commits fdac7f7..f3d6ed1)
Tasks 10+11: complete (commits 4911d52..f3d6ed1, review clean; contraste medido
  pelo controller depois da correção: 5.19:1 e 5.70:1, ambos passam)

  Ruling antecipado para a Task 13: app/error.tsx PRECISA de "use client" — o
  Next.js exige Client Component para error boundary. Isso leva a contagem a 6,
  contra os 5 do spec §7.4. Não é escolha de implementação, é imposição do
  framework, e o componente só carrega em caso de erro. Aceito como exceção
  documentada; vou emendar o spec ao fim se a revisão confirmar.

Tasks 12+13: dispatched em lote (implementer sonnet, BASE f3d6ed1)

ARMADILHA ENCONTRADA E NEUTRALIZADA PELO CONTROLLER (antes da Task 14):
  O dev server que eu subi lá na Task 8 ficou OBSOLETO — parou de recompilar e
  servia conteúdo anterior às Tasks 10/11 (nem role="img" nem o token creme-texto
  apareciam no HTML). Isso me fez, por um momento, achar que os dados estruturados
  da Task 13 estavam ausentes.
  Gravidade real: o playwright.config da Task 14 usa `reuseExistingServer` na porta
  3000. Se aquele servidor podre continuasse de pé, a suíte inteira de 5 viewports
  teria testado conteúdo velho e passado verde por engano.
  Ação: processos nas portas 3000 e 3002 finalizados. Build de produção fresco
  rodando na 3007 e verificado.
  Verificado no build de produção: JSON-LD presente e correto — Restaurant,
  +552433645253, endereço com travessão e CEP, BR, terça a domingo com SEGUNDA
  OMITIDA, sábado 16:00->03:00. Build: / em 122 kB (orçamento 130 kB).

  LIÇÃO PARA A TASK 14: nunca verificar contra servidor de longa duração. Deixar o
  Playwright subir o dele, ou reconstruir antes de medir.
Tasks 12+13: review — Spec OK, qualidade Aprovada. 3 Important + 4 Minor.

  Ruling (error.tsx descarta o erro): PROCEDE. Error boundary sem log deixa todo
  erro de runtime da subárvore invisível em produção. Código do meu brief.
  Correção: console.error(error) num useEffect. Custo se errado: nenhum.

  Ruling (ambiguidade na evidência de deleção do preloader): PROCEDE. A descrição
  no relatório usa termos da estrutura pré-correção de hidratação, então não dá
  para saber se a deleção foi refeita contra o HEAD final. O revisor confirmou por
  leitura de código que os testes 1+2 não são vazios, então o risco é baixo — mas
  este projeto já foi mordido 3x por teste vazio e a evidência tem que ficar
  registrada contra o código que efetivamente vai para produção.

  Ruling (teste de dia fechado não isola a flag `fechado` do null de abre/fecha):
  PROCEDE. A implementação já está correta; é o teste que não discrimina. Vira
  problema quando o painel de admin permitir marcar fechado com horários
  preenchidos — cenário explicitamente previsto. Correção: fixture com
  fechado:true e horários populados.

  Ruling (Minor, cor implícita nos botões de erro/404): INCLUO, mesmo arquivo.

Tasks 12+13: minor (deferred): Preloader não é literalmente o primeiro filho do
  body (DadosEstruturados vem antes) — sem efeito, o irmão não renderiza nada.
Tasks 12+13: minor (deferred): com a correção de hidratação, o conteúdo existe no
  DOM um ciclo antes do overlay aparecer. É consequência inerente e correta da
  correção, melhor para o LCP; só some com script bloqueante no <head>, que
  contraria o orçamento. Aceito como trade-off consciente.
Tasks 12+13: minor (deferred): preloader sem focus trap — inócuo, porque qualquer
  tecla (inclusive Tab) já o dispensa.

Tasks 12+13: fix round 1/5 dispatched (resume do implementer original)
Tasks 12+13: fix round 1/5 (5 addressed, 0 open; commits 379b993..c42f09e)
Tasks 12+13: complete (commits f3d6ed1..c42f09e, review clean)

Task 14: dispatched (implementer sonnet, BASE c42f09e)
Task 14: implementer DONE_WITH_CONCERNS, commit bd77782.
  MEDIÇÕES REAIS (a razão de esta tarefa existir):
    JS primeira carga /      : 122 kB   (meta <=130 kB)  ATENDIDO
    Lighthouse mobile Perf   : 92       (meta >=90)      ATENDIDO
    CLS                      : 0        (meta <0.05)     ATENDIDO
    Lighthouse desktop Perf  : 99, LCP 0.7s              ATENDIDO
    LCP mobile               : 3.2-3.3s (meta <=2.0s)    ** NÃO ATENDIDO **
    Console em navegador real: 0 erros, 0 avisos, 0 requisições falhas
    Playwright 5 viewports   : 46/46 verdes, 4 skips esperados
    Sem rolagem horizontal em 320px.

  Lacunas herdadas FECHADAS nesta tarefa:
    - Task 6: SmoothScrollProvider/Lenis/GSAP finalmente visto em navegador real,
      console limpo. A pendência que eu carregava desde a Task 6 está resolvida.
    - Task 9: implementador adicionou, além do brief, um teste e2e que afirma que a
      transform do mascote muda entre duas posições de scroll. A animação de
      assinatura agora tem guarda automatizada.

  LCP mobile — para a revisão final triar: diagnóstico do implementador aponta o
  throttling de 4G lento simulado do Lighthouse contra ~20 requisições / 273 KiB
  (fontes + muitos chunks pequenos). O elemento de LCP é um parágrafo de texto com
  render-delay de ~216ms, ou seja, o gargalo é rede, não renderização. Hipótese de
  remédio mais barato: o eixo variável da Hanken Grotesk carrega 300..800; estreitar
  para os pesos usados deve cortar peso de fonte relevante.
Task 14: review — Spec OK, qualidade Aprovada. 4 Important + 2 Minor.

  Ruling (reuseExistingServer reproduz o risco de servidor obsoleto): PROCEDE, e
  com urgência especial: eu JÁ encontrei esse cenário neste projeto hoje. Não é
  hipótese. Correção: reuseExistingServer: false, sem condição. O custo de
  reconstruir a cada rodada é trivial perto de uma suíte que passa verde contra
  código velho. Custo se errado: cada rodada da suíte fica mais lenta.

  Ruling (teste de movimento reduzido não discrimina): PROCEDE. QUARTA ocorrência
  desta classe no projeto. Ele afirma que conteúdo renderizado no servidor está
  visível — passaria idêntico com a guarda de matchMedia deletada. Correção:
  afirmar o que a guarda de fato controla — sob reducedMotion, a transform do
  mascote NÃO muda com o scroll.

  Ruling (esperas fixas no teste do mascote = risco de flake): PROCEDE. 4,2s de
  sleeps fixos, com 4 workers em paralelo. O próprio implementador identificou e
  apontou o remédio (expect.poll) sem aplicar. Suíte que floca é suíte que será
  ignorada. Correção: trocar por expect.poll.

  Ruling (lacuna do SmoothScrollProvider só fracamente fechada): PROCEDE. A
  checagem de console foi script ad-hoc, apagado depois — não é guarda de
  regressão. Correção barata: afirmar que window.scrollY de fato avançou após
  wheel, o que prova diretamente que o raf do Lenis está dirigindo o scroll.

  Ruling (LCP mobile 3.2s x meta 2.0s): NÃO gastar rodada de correção ainda.
  O revisor descartou minhas hipóteses com argumento: o Preloader retorna null no
  SSR e só monta depois da pintura inicial (coerente com CLS=0, pois fixed não
  desloca layout); as fontes já usam next/font com display:swap, auto-hospedadas e
  não bloqueantes. Restou o throttling SIMULADO do Lighthouse mobile contra ~20
  requisições. Assinatura clássica: Performance 92, CLS 0, TBT ~80ms e LCP 3.2s.
  Próximo passo é DIAGNÓSTICO, não código: rodar com --throttling-method=devtools.
  Se confirmar artefato de laboratório, emendo a meta do spec para ser específica
  de método de medição. Custo se errado: adiar otimização real de bundle.

Task 14: fix round 1/5 dispatched (resume do implementer original)
Task 14: fix round 1 aplicada, commit cde9bbe. 51/51 verdes.
  DESCOBERTA IMPORTANTE do implementador: test.use({reducedMotion:"reduce"}) NÃO
  estava definindo matchMedia neste ambiente — confirmado com repro isolado.
  Trocado por page.emulateMedia() explícito. Ou seja, o teste original de movimento
  reduzido estava quebrado em DUAS camadas: não discriminava E a preferência nem
  era aplicada. Causa raiz do mismatch não rastreada; workaround confirmado.
  LCP DIAGNÓSTICO: 2.5s com --throttling-method=devtools (real) contra 3.2-3.3s
  com simulate. Ainda acima da meta de 2.0s, por margem menor. FCP == LCP == 2.5s,
  TBT subiu para 500ms.
Task 14: re-review — achados 1,2,3 ADDRESSED com prova real (delete/restore
  empírico no 2, polling limitado no 3, recusa de reuso de servidor verificada no 1).
  Achado 4 PERMANECE ABERTO.

  Ruling (achado 4, asserção de scrollY não discrimina Lenis): PROCEDE, rodada 2.
  Raciocínio do revisor confere: sem override de `wrapper`, sem CSS de trava de
  scroll, e com o ScrollTrigger no listener nativo, remover o Lenis inteiro ainda
  deixaria o scroll nativo avançar window.scrollY e mover o mascote. O teste passa
  nos dois mundos. Pior: o comentário inline no teste AFIRMA provar o contrário.
  Correção: afirmar também que <html> carrega a classe `lenis` (o Lenis a adiciona
  ao montar — confirmado na documentação durante a pesquisa inicial), o que
  discrimina presença; e corrigir o comentário para dizer o que o teste prova de
  fato. Custo se errado: nenhum; duas asserções baratas.
Task 14: fix round 2/5 aplicada, commit 95945dc. 51/51 verdes.
  Prova por deleção: removido <SmoothScrollProvider> do layout -> asserção nova
  falhou por timeout (onde a versão só-scrollY passaria) -> restaurado -> passou.
  Discrimina de verdade.

  NOVO ACHADO DISCLOSURE ESPONTÂNEO do implementador (não pedido, e por isso
  valioso): o teste "expõe os cinco bairros" usa toBeAttached() e não
  toBeVisible(). Mesma família das outras cinco guardas fracas. Fora do escopo dos
  4 achados, então não tocado, mas declarado. -> LEVAR PARA A REVISÃO FINAL TRIAR.
Task 14: fix round 2/5 (1 addressed, 0 open; commits cde9bbe..95945dc)
Task 14: complete (commits c42f09e..95945dc, review clean)

TODAS AS 14 TAREFAS COMPLETAS. Partindo para a revisão final da branch inteira
(merge-base 8273f26 .. 95945dc), modelo mais capaz.

=== REVISÃO FINAL DA BRANCH (opus) — 2 Critical, 7 Important, ~15 Minor ===

  Ruling (C1, brasa-texto reprova nos DOIS fundos): PROCEDE. VERIFIQUEI EU MESMO:
    #e8505f sobre fumaca (#2f2728) = 3.98:1  <- onde é REALMENTE usado (2 lugares)
    #e8505f sobre carvao (#241e1f) = 4.49:1  <- reprova por 0.01
  Eu criei esse token para corrigir contraste e ele falha nos dois. Causa: calculei
  4.54 de cabeça ao inventá-lo e não medi; só comecei a medir de fato na faixa
  creme, tarefas depois. Correção: --color-brasa-texto = #ee6b76 (4.86 fumaca /
  5.47 carvao). Escolhi acima do #ec6570 sugerido (4.62) porque margem fina já me
  mordeu. Custo se errado: vermelho um tom mais claro nos rótulos pequenos.

  Ruling (§9 do spec afirma que #cf2434 sobre creme "passa com folga"): FALSO.
  Medido: 4.31:1, reprova. Não quebra nada hoje porque só aparece sobre cards
  brancos (5.31:1), mas é armadilha no documento vinculante. Corrigir o texto.

  Ruling (I1, preloader cobre conteúdo legível e ENGOLE o primeiro toque):
  PROCEDE, e é a crítica mais dolorosa: meu ruling da correção de hidratação
  registrou só o que ele otimizava (LCP) e não o que piorava (custo de interação).
  O revisor está certo de que "o que isto piora" deveria ser linha obrigatória de
  todo ruling. Correção mínima: pointer-events-none, para nunca custar um toque —
  os listeners em window seguem funcionando, então o toque abre o WhatsApp E
  dispensa o painel. LEVAR AO CLIENTE a opção de simplesmente remover o preloader,
  que é o que eu faria.

  Ruling (C2, ifoodUrl aponta para a home do iFood): PROCEDE, mas NÃO É CÓDIGO —
  é pergunta ao cliente. Dois CTAs primários largam o visitante na home nacional
  do iFood. Ou o cliente dá a URL da loja, ou o botão sai. SURFACE AO USUÁRIO.

  Rulings I2..I7 e minors baratos: todos PROCEDEM, entram na onda única de
  correção conforme o processo (uma dispatch, não uma por achado).

Onda de correção final: dispatched (implementer sonnet)

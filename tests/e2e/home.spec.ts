import { test, expect, type Page, type Locator } from "@playwright/test";

type AlvoRota = { topo: number; altura: number };

/** Encontra, no DOM, a posição absoluta e a altura da seção da rota de entrega. */
async function localizarSecaoDaRota(page: Page): Promise<AlvoRota | null> {
  return page.evaluate(() => {
    const linha = document.getElementById("rota-entrega");
    const wrap = linha ? linha.closest("div") : null;
    if (!wrap) return null;
    const retangulo = wrap.getBoundingClientRect();
    return { topo: retangulo.top + window.scrollY, altura: wrap.clientHeight };
  });
}

/** Lê o transform aplicado pelo GSAP (via style ou, em navegadores que
 *  preferem o atributo de apresentação, via `transform`). */
function lerTransform(mascote: Locator) {
  return mascote.evaluate((el) => el.getAttribute("style") ?? el.getAttribute("transform"));
}

/**
 * Rola em passos, via wheel real, até o meio da seção da rota. A distância é
 * contada a partir do topo real da página (não só da altura da própria
 * seção) — em telas estreitas o cardápio empilhado antes dela é bem mais
 * alto, então essa distância muda por viewport.
 */
async function rolarAteOMeioDaRota(page: Page, alvo: AlvoRota) {
  const distanciaAteOMeio = alvo.topo + alvo.altura * 0.5;
  const passos = 10;
  for (let i = 0; i < passos; i++) {
    await page.mouse.wheel(0, distanciaAteOMeio / passos);
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nbrasa:preloader", "1"));
  await page.goto("/");
});

test("mostra o título do herói", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("acende");
});

test("tem exatamente um h1", async ({ page }) => {
  await expect(page.locator("h1")).toHaveCount(1);
});

test("a página não rola na horizontal", async ({ page }) => {
  const estoura = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(estoura).toBe(false);
});

test("lista as seis categorias", async ({ page }) => {
  for (const nome of ["Burgers", "Espetinhos", "Carnes Nobres", "Petiscos", "Drinks", "Sobremesas"]) {
    await expect(page.getByText(nome, { exact: true }).first()).toBeVisible();
  }
});

test("mostra os horários agrupados corretamente", async ({ page }) => {
  // "Terça a quinta" aparece duas vezes na página (resumo do herói e lista
  // de horários na faixa creme); .first() evita a falha do strict mode.
  await expect(page.getByText("Terça a quinta").first()).toBeVisible();
  await expect(page.getByText("16h — 03h").first()).toBeVisible();
});

test("expõe os cinco bairros da rota de entrega", async ({ page }) => {
  for (const b of ["Centro", "Praia do Anil", "Japuíba", "Praia Grande", "Mambucaba"]) {
    await expect(page.getByText(b, { exact: true })).toBeAttached();
  }
});

test("publica dados estruturados de Restaurant", async ({ page }) => {
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(json!)["@type"]).toBe("Restaurant");
});

test.describe("com movimento reduzido", () => {
  // `test.use({ reducedMotion: "reduce" })` foi a primeira tentativa, mas
  // uma reprodução isolada (config mínima, sem nenhuma customização deste
  // projeto) mostrou que essa opção de contexto não faz
  // window.matchMedia("(prefers-reduced-motion: reduce)") reportar `true`
  // neste ambiente — fica `false` mesmo com o contexto configurado.
  // page.emulateMedia() aplica de fato (confirmado na mesma reprodução), e
  // é o que usamos aqui. Por isso este describe navega de novo, depois de
  // emular: RotaMascote só lê a preferência uma vez, no mount, e o
  // beforeEach do topo do arquivo já tinha navegado antes desta preferência
  // existir.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("nenhum conteúdo depende de animação", async ({ page }) => {
    await expect(page.getByText("Mambucaba")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  // Espelho do teste "o mascote se move..." abaixo: aquele prova que a
  // animação roda; este prova que o guard de reduced-motion realmente a
  // desliga. Sem este teste, o de cima passaria (e passou, numa versão
  // anterior) mesmo que o matchMedia("(prefers-reduced-motion: reduce)")
  // de RotaMascote.tsx fosse apagado — nada aqui checava o comportamento
  // que a asserção alegava cobrir.
  test("o mascote não se move com prefers-reduced-motion", async ({ page }) => {
    const mascote = page.locator('#delivery svg[viewBox="0 0 100 116"]');
    await expect(mascote).toBeAttached();

    const alvo = await localizarSecaoDaRota(page);
    expect(alvo).not.toBeNull();

    const antes = await lerTransform(mascote);

    await rolarAteOMeioDaRota(page, alvo!);

    // Asserção negativa: não dá para "esperar até nunca acontecer". Uma
    // espera fixa é legítima aqui, mas curta — o bastante para o
    // ScrollTrigger reagir *se* o guard não estivesse funcionando (o teste
    // irmão, com o mesmo scroll, converge bem dentro de poucos segundos).
    await page.waitForTimeout(2_500);

    const depois = await lerTransform(mascote);
    expect(depois).toBe(antes);
  });
});

test("o menu mobile abre e fecha", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) >= 768, "só faz sentido no mobile");
  await page.getByRole("button", { name: /abrir menu/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

// Guarda de regressão adicional (não faz parte da lista do brief): a Task 6
// nunca viu o SmoothScrollProvider rodar num browser real, e a animação do
// mascote (Task 9) só foi conferida manualmente uma vez. Aqui confirmamos
// barato que o GSAP MotionPath realmente está mexendo o mascote ao rolar —
// sem isso, uma regressão silenciosa no wiring do cliente não quebraria
// nenhum teste automatizado.
test("o mascote se move ao longo da rota ao rolar", async ({ page }) => {
  const mascote = page.locator('#delivery svg[viewBox="0 0 100 116"]');
  await expect(mascote).toBeAttached();

  const alvo = await localizarSecaoDaRota(page);
  expect(alvo).not.toBeNull();

  const antes = await lerTransform(mascote);
  const scrollAntes = await page.evaluate(() => window.scrollY);

  await rolarAteOMeioDaRota(page, alvo!);

  // Prova direta (não inferência) de que o Lenis está de fato aplicando o
  // scroll: smoothWheel intercepta o evento de wheel e só move a página via
  // lenis.raf(), alimentado pelo ticker do GSAP em SmoothScrollProvider. Se
  // esse wiring quebrar — Lenis não montar, o ticker não rodar —
  // window.scrollY nunca avança, mesmo com o wheel disparado.
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 8_000 })
    .toBeGreaterThan(scrollAntes);

  // O scrub do ScrollTrigger (scrub: 1) converge suavemente até o progresso
  // alvo; poll em vez de sleep fixo — mais rápido quando a máquina está
  // livre, sem flakar quando não está.
  await expect.poll(() => lerTransform(mascote), { timeout: 8_000 }).not.toBe(antes);

  const depois = await lerTransform(mascote);
  expect(depois).not.toBeNull();
});

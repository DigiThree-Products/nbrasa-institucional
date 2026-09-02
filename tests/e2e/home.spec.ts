import { test, expect } from "@playwright/test";

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
  test.use({ reducedMotion: "reduce" });

  test("nenhum conteúdo depende de animação", async ({ page }) => {
    await expect(page.getByText("Mambucaba")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

  const alvo = await page.evaluate(() => {
    const linha = document.getElementById("rota-entrega");
    const wrap = linha ? linha.closest("div") : null;
    if (!wrap) return null;
    const retangulo = wrap.getBoundingClientRect();
    return { topo: retangulo.top + window.scrollY, altura: wrap.clientHeight };
  });
  expect(alvo).not.toBeNull();

  const antes = await mascote.evaluate((el) => el.getAttribute("style") ?? el.getAttribute("transform"));

  // distância até o meio da rota, contada a partir do topo real da página
  // (não só da altura da seção) — em telas estreitas o cardápio empilhado
  // antes dela é bem mais alto, então essa distância muda por viewport.
  const distanciaAteOMeio = alvo!.topo + alvo!.altura * 0.5;

  // rola em passos, via wheel real, para que o Lenis (que intercepta o
  // scroll) e o ScrollTrigger (scrub) tenham tempo de convergir.
  const passos = 10;
  for (let i = 0; i < passos; i++) {
    await page.mouse.wheel(0, distanciaAteOMeio / passos);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1200);

  const depois = await mascote.evaluate((el) => el.getAttribute("style") ?? el.getAttribute("transform"));

  expect(depois).not.toBe(antes);
  expect(depois).not.toBeNull();
});

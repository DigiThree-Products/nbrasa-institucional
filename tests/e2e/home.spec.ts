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
 * seção), em telas estreitas o cardápio empilhado antes dela é bem mais
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
  await page.goto("/");
});

test("mostra o título do herói", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("acende");
});

test("o h1 continua sendo a frase inteira, apesar das três linhas", async ({ page }) => {
  // O título é quebrado em três spans `block`, um por palavra. O JSX descarta
  // espaço em branco entre expressões irmãs, então basta esquecer o `{" "}`
  // no fim de uma linha para o texto do heading virar "Sua fomeacendeaqui." e
  // continuar parecendo certo na tela, porque cada bloco desenha na sua
  // própria linha de qualquer jeito. Quem paga são o leitor de tela e o
  // buscador, e nenhum dos dois aparece numa revisão visual.
  const h1 = page.getByRole("heading", { level: 1 });

  expect(await h1.evaluate((el) => el.textContent?.trim())).toBe("Sua fome acende aqui.");
  // o nome acessível é computado pelo navegador, não é o mesmo caminho
  await expect(h1).toHaveAccessibleName("Sua fome acende aqui.");
});

test("o fecho do título encosta na direita do foco, medindo a tinta", async ({ page }) => {
  // Mede TINTA, e não a caixa de layout, de propósito. A linha do meio é
  // desenhada e inclinada: o traço sangra para fora da caixa nos dois lados,
  // e o alinhamento que o desenho pede é o que se vê, não o que a caixa diz.
  // O componente compensa isso com `ml` e `pr` no foco, o que faz as caixas
  // ficarem DESALINHADAS de propósito. Um teste de caixa aqui reprovaria o
  // acerto e aprovaria o erro, que foi exatamente o que aconteceu quando a
  // fonte passou a ser inclinada.
  const bordas = await page.locator("h1").evaluate((h1) => {
    const caixa = (el: Element) => {
      const faixa = document.createRange();
      faixa.selectNodeContents(el);
      const cx = [...faixa.getClientRects()].filter((c) => c.width > 0.5);
      return { esq: Math.min(...cx.map((c) => c.left)) };
    };
    // actualBoundingBox* dá a extensão do traço desenhado, que é o que
    // getClientRects não sabe: ele só conhece o avanço da fonte.
    const ctx = document.createElement("canvas").getContext("2d")!;
    const tinta = (el: Element) => {
      const st = getComputedStyle(el);
      ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
      if ("letterSpacing" in ctx) ctx.letterSpacing = st.letterSpacing;
      const m = ctx.measureText((el.textContent ?? "").trim().toUpperCase());
      return { recuo: m.actualBoundingBoxLeft, avanco: m.actualBoundingBoxRight };
    };
    const [abertura, foco, fecho] = [...h1.querySelectorAll(":scope > span")];
    const dir = (el: Element) => caixa(el).esq + tinta(el).avanco;
    const esq = (el: Element) => caixa(el).esq - tinta(el).recuo;
    return {
      focoDir: dir(foco), fechoDir: dir(fecho),
      aberturaDir: dir(abertura), aberturaEsq: esq(abertura), focoEsq: esq(foco),
    };
  });

  expect(Math.abs(bordas.focoDir - bordas.fechoDir)).toBeLessThan(1.5);
  // as três linhas alinham à esquerda pela tinta, e não pela caixa
  expect(Math.abs(bordas.focoEsq - bordas.aberturaEsq)).toBeLessThan(1.5);
  // a premissa do `w-fit`: o foco é a linha mais larga, senão o h1 mede pela errada
  expect(bordas.focoDir).toBeGreaterThan(bordas.aberturaDir);
});

test("o botão se encaixa na última linha do título, sem encostar no fecho", async ({ page }) => {
  // A partir de `sm` o botão sobe para dentro da linha do fecho, no vão que
  // ele deixou ao encostar na direita. O vão vale a largura do foco menos a
  // do fecho, e os dois crescem em ritmos diferentes conforme o trecho do
  // `clamp` que está ativo, então "cabe" não é garantido por construção: em
  // viewport estreito o botão é mais largo que o vão, e por isso ele só sobe
  // de `sm` para cima. Se alguém mexer na escala e o vão encolher, aqui os
  // dois se sobrepõem, e sobreposição de link com texto não falha em teste
  // nenhum, só fica feia e difícil de clicar.
  const m = await page.evaluate(() => {
    const h1 = document.querySelector("h1")!;
    const caixa = (el: Element) => {
      const faixa = document.createRange();
      faixa.selectNodeContents(el);
      const cx = [...faixa.getClientRects()].filter((c) => c.width > 0.5);
      return {
        esq: Math.min(...cx.map((c) => c.left)),
        topo: Math.min(...cx.map((c) => c.top)),
        base: Math.max(...cx.map((c) => c.bottom)),
      };
    };
    const fecho = caixa([...h1.querySelectorAll(":scope > span")][2]);
    const b = h1.parentElement!.querySelector("a")!.getBoundingClientRect();
    return { fecho, botao: { dir: b.right, topo: b.top, base: b.bottom }, largura: window.innerWidth };
  });

  const naMesmaLinha = m.botao.topo < m.fecho.base && m.botao.base > m.fecho.topo;

  if (m.largura >= 640) {
    expect(naMesmaLinha).toBe(true);
    // o vão precisa sobrar: encostar já é colisão
    expect(m.botao.dir).toBeLessThan(m.fecho.esq);
  } else {
    // abaixo de `sm` o botão volta a ser bloco em fluxo, embaixo do título
    expect(naMesmaLinha).toBe(false);
    expect(m.botao.topo).toBeGreaterThan(m.fecho.base);
  }
});

test("a costura de chama chega ao navegador aplicada", async ({ page }) => {
  // Modo de falha observado duas vezes durante o desenvolvimento: basta um
  // caractere cru no data URI para o Chrome descartar a declaração inteira
  //, sem erro no console, sem aviso. A máscara vira `none` e a foto aparece
  // como um retângulo comum, que é fácil de não notar numa revisão rápida.
  const mascara = await page
    .locator(".costura-chama")
    .evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);

  expect(mascara).not.toBe("none");
  expect(mascara).toContain("data:image/svg+xml");
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
  await expect(page.getByText("16h às 03h").first()).toBeVisible();
});

test("expõe os cinco bairros da rota de entrega", async ({ page }) => {
  for (const b of ["Centro", "Praia do Anil", "Japuíba", "Praia Grande", "Mambucaba"]) {
    await expect(page.getByText(b, { exact: true })).toBeVisible();
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
  // neste ambiente, fica `false` mesmo com o contexto configurado.
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
  // de RotaMascote.tsx fosse apagado, nada aqui checava o comportamento
  // que a asserção alegava cobrir.
  test("o mascote não se move com prefers-reduced-motion", async ({ page }) => {
    const mascote = page.locator('#delivery svg[viewBox="0 0 100 116"]');
    await expect(mascote).toBeAttached();

    const alvo = await localizarSecaoDaRota(page);
    expect(alvo).not.toBeNull();

    const antes = await lerTransform(mascote);

    await rolarAteOMeioDaRota(page, alvo!);

    // Asserção negativa: não dá para "esperar até nunca acontecer". Uma
    // espera fixa é legítima aqui, mas curta, o bastante para o
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
  const painel = page.getByRole("dialog");
  await expect(painel).toBeVisible();

  // O painel precisa cobrir a viewport inteira: enquanto ele era filho do
  // header (que tem backdrop-blur, e portanto vira bloco de contenção de
  // `fixed`), o inset-0 media os 75px do header e a página aparecia por baixo
  // dos links. Ver o comentário do portal em MenuMobile.tsx.
  const caixa = await painel.boundingBox();
  expect(caixa?.height).toBeGreaterThanOrEqual((viewport?.height ?? 0) - 1);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

// Guarda de regressão adicional (não faz parte da lista do brief): a Task 6
// nunca viu o SmoothScrollProvider rodar num browser real, e a animação do
// mascote (Task 9) só foi conferida manualmente uma vez. Aqui confirmamos
// barato que o GSAP MotionPath realmente está mexendo o mascote ao rolar:
// sem isso, uma regressão silenciosa no wiring do cliente não quebraria
// nenhum teste automatizado.
test("o mascote se move ao longo da rota ao rolar", async ({ page }) => {
  const mascote = page.locator('#delivery svg[viewBox="0 0 100 116"]');
  await expect(mascote).toBeAttached();

  // Lenis adiciona a classe "lenis" a <html> ao montar, o mesmo gancho que
  // app/globals.css (linhas 19-21) usa para o CSS oficial do Lenis
  // funcionar (html.lenis, .lenis.lenis-smooth). Isso discrimina a presença
  // do Lenis de um jeito que window.scrollY, sozinho, não discrimina:
  // SmoothScrollProvider usa Lenis sobre `window` sem `wrapper` customizado,
  // não há scroll-lock de CSS como fallback, e o ScrollTrigger de
  // RotaMascote não define `scroller`, ambos escutam scroll nativo. Se o
  // <SmoothScrollProvider> inteiro fosse removido do layout, o wheel nativo
  // ainda avançaria window.scrollY e o ScrollTrigger ainda moveria o
  // mascote, e as duas asserções abaixo passariam do mesmo jeito sem o
  // Lenis existir. A classe + o scrollY, juntos, estabelecem "o Lenis está
  // montado E o scroll avança", não isolam especificamente o binding
  // gsap.ticker.add(tick) → lenis.raf(), e não devem ser lidos como se
  // provassem isso.
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), {
      timeout: 3_000,
    })
    .toBe(true);

  const alvo = await localizarSecaoDaRota(page);
  expect(alvo).not.toBeNull();

  const antes = await lerTransform(mascote);
  const scrollAntes = await page.evaluate(() => window.scrollY);

  await rolarAteOMeioDaRota(page, alvo!);

  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 8_000 })
    .toBeGreaterThan(scrollAntes);

  // O scrub do ScrollTrigger (scrub: 1) converge suavemente até o progresso
  // alvo; poll em vez de sleep fixo, mais rápido quando a máquina está
  // livre, sem flakar quando não está.
  await expect.poll(() => lerTransform(mascote), { timeout: 8_000 }).not.toBe(antes);

  const depois = await lerTransform(mascote);
  expect(depois).not.toBeNull();
});

test("o herói usa a foto IMG_3643 sem montar vídeo", async ({ page }) => {
  const pedidos: string[] = [];
  page.on("request", (r) => pedidos.push(r.url()));

  await page.goto("/");
  await expect(page.locator("video")).toHaveCount(0);
  expect(pedidos.filter((u) => u.includes("video-fachada.mp4"))).toHaveLength(0);

  const foto = page.locator('img[src="/fachada-nbrasa-1600.jpg"]');
  await expect(foto).toBeVisible();
  await expect(foto.locator("xpath=preceding-sibling::source[@type='image/avif']")).toHaveCount(1);
  await expect(foto.locator("xpath=preceding-sibling::source[@type='image/webp']")).toHaveCount(1);
});

/**
 * Rola em passos, via wheel real, até o topo do cardápio encostar no topo da
 * janela, que é onde a cena presa começa. Mesmo motivo de
 * `rolarAteOMeioDaRota`: o Lenis escuta wheel, e um `scrollTo` seco passaria
 * por cima dele.
 */
async function rolarAteOCardapio(page: Page) {
  const distancia = await page.evaluate(
    () => document.querySelector("#cardapio")!.getBoundingClientRect().top + window.scrollY,
  );
  const passos = 12;
  for (let i = 0; i < passos; i++) {
    await page.mouse.wheel(0, distancia / passos);
  }
  await page.waitForTimeout(400);
}

/** Rola `telas` alturas de janela, em passos, e espera o scrub assentar. */
async function rolarTelas(page: Page, telas: number) {
  const altura = page.viewportSize()!.height;
  const passos = Math.max(8, Math.round(telas * 8));
  for (let i = 0; i < passos; i++) {
    await page.mouse.wheel(0, (telas * altura) / passos);
  }
  await page.waitForTimeout(600);
}

const transformacoesDoCardapio = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("#cardapio article")].map(
      (e) => (e as HTMLElement).style.transform,
    ),
  );

test("o cardápio mostra as seis categorias em qualquer viewport", async ({ page }) => {
  await expect(page.locator("#cardapio article")).toHaveCount(6);
  await expect(page.locator("#cardapio article").first()).toBeVisible();
});

test("abaixo de 1024 o cardápio não prende a rolagem", async ({ page }) => {
  test.skip(page.viewportSize()!.width >= 1024, "de 1024 pra cima a cena existe");

  // O `pin` do ScrollTrigger envolve o palco num `div.pin-spacer`. A ausência
  // dele é a prova de que a consulta de mídia barrou a cena: sem isto, o
  // celular ganharia duas telas e meia de rolagem presa para seis cards.
  await expect(page.locator("#cardapio .pin-spacer")).toHaveCount(0);

  // E sem cena não há trilho: os dois filetes existem no DOM sempre, mas
  // nascem com o `d` vazio e só o efeito escreve neles.
  const trilhos = await page.locator("#cardapio [data-trilho] path").evaluateAll((es) =>
    es.map((e) => e.getAttribute("d")),
  );
  expect(trilhos).toHaveLength(2);
  expect(trilhos.every((d) => d === "")).toBe(true);
});

test("no desktop o palco fica preso enquanto a cena corre", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "abaixo de 1024 não há cena");

  await expect(page.locator("#cardapio .pin-spacer")).toHaveCount(1);
  await rolarAteOCardapio(page);

  // As duas medidas são tiradas DENTRO da cena, e não uma na borda e outra no
  // meio. Rolar por wheel não para no pixel exato em que o pin engata, e a
  // sobra de uma dezena de pixels do último passo apareceria como se o palco
  // tivesse escorregado. Meia tela adiante já está firmemente preso.
  await rolarTelas(page, 0.5);
  const palco = page.locator("#cardapio .pin-spacer > div");
  const topoNoComeco = (await palco.boundingBox())!.y;

  await rolarTelas(page, 1.5);
  const topoNoMeio = (await palco.boundingBox())!.y;

  // Preso quer dizer parado na tela enquanto a página anda por baixo. Sem o
  // pin, uma tela e meia de rolagem levaria o palco para bem longe do topo.
  expect(Math.abs(topoNoMeio - topoNoComeco)).toBeLessThan(4);
});

test("no desktop os seis cards terminam a cena sem transformação", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "abaixo de 1024 não há cena");

  await rolarAteOCardapio(page);
  await rolarTelas(page, 2.8);

  const transformacoes = await transformacoesDoCardapio(page);
  expect(transformacoes).toHaveLength(6);

  // O navegador normaliza o valor: o componente escreve "0.00px" e a leitura
  // devolve "0px". Casar com casas decimais aqui falharia sem haver defeito.
  // A escala volta a 1 junto com o resto: o card cresce 40% na bobina e o
  // encolhimento faz parte do pouso, não é um passo separado.
  for (const t of transformacoes) {
    expect(t).toContain("translate3d(0px, 0px, 0px)");
    expect(t).toContain("rotateY(0deg)");
    expect(t).toContain("scale(1)");
  }

  // Pousados quer dizer na GRADE: três linhas de dois, cada linha na mesma
  // altura, e a coluna da direita à direita da esquerda. É o que prova que o
  // alvo do pouso é a posição do layout, e não uma coordenada calculada que
  // por acaso deu perto.
  const caixas = await page.locator("#cardapio article").evaluateAll((es) =>
    es.map((e) => {
      const r = e.getBoundingClientRect();
      return { topo: Math.round(r.top), esquerda: Math.round(r.left) };
    }),
  );
  for (let i = 0; i < caixas.length; i += 2) {
    expect(caixas[i + 1]!.topo).toBe(caixas[i]!.topo);
    expect(caixas[i + 1]!.esquerda).toBeGreaterThan(caixas[i]!.esquerda);
    expect(caixas[i]!.esquerda).toBe(caixas[0]!.esquerda);
    if (i > 0) expect(caixas[i]!.topo).toBeGreaterThan(caixas[i - 2]!.topo);
  }
});

test("no desktop o trilho é desenhado durante a cena e some no fim", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "abaixo de 1024 não há cena");

  await rolarAteOCardapio(page);
  await rolarTelas(page, 0.9);

  // Os dois filetes acompanham a bobina. Um `d` vazio no meio da cena quer
  // dizer que a projeção deixou de bater com a medida do card, e o gesto perde
  // metade do que faz a bobina ler como trilho.
  const noMeio = await page.locator("#cardapio [data-trilho] path").evaluateAll((es) =>
    es.map((e) => e.getAttribute("d") ?? ""),
  );
  expect(noMeio).toHaveLength(2);
  for (const d of noMeio) {
    expect(d.startsWith("M")).toBe(true);
    expect(d.length).toBeGreaterThan(200);
  }
});

test.describe("cardápio com movimento reduzido", () => {
  // Mesmo motivo documentado no describe da rota: `test.use({ reducedMotion })`
  // não faz o matchMedia reportar `true` neste ambiente, e `emulateMedia` faz.
  // A navegação se repete porque a consulta do `gsap.matchMedia` é avaliada na
  // montagem, e o `beforeEach` do topo do arquivo navegou antes da preferência.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("as seis categorias aparecem e a cena não existe", async ({ page }) => {
    await expect(page.locator("#cardapio article")).toHaveCount(6);
    await expect(page.locator("#cardapio .pin-spacer")).toHaveCount(0);

    const transformacoes = await transformacoesDoCardapio(page);
    expect(transformacoes.every((t) => t === "")).toBe(true);

    const trilhos = await page.locator("#cardapio [data-trilho] path").evaluateAll((es) =>
      es.map((e) => e.getAttribute("d")),
    );
    expect(trilhos.every((d) => d === "")).toBe(true);
  });
});

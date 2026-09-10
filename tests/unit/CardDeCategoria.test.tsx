import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardDeCategoria } from "@/components/sections/CardDeCategoria";
import { categoriasSeed } from "@/lib/conteudo.seed";
import type { Categoria } from "@/lib/conteudo.tipos";

/** Todo arquivo citado pelo card, vindo do <img> e de cada <source>. */
function arquivosCitados(raiz: Element) {
  const src = raiz.querySelector("img")?.getAttribute("src") ?? "";
  const dosSources = [...raiz.querySelectorAll("source")].flatMap((s) =>
    (s.getAttribute("srcset") ?? "")
      .split(",")
      .map((parte) => parte.trim().split(/\s+/)[0])
      .filter(Boolean),
  );
  return [src, ...dosSources].filter(Boolean);
}

const semFoto: Categoria = {
  slug: "chopp",
  nome: "Chopp",
  kicker: "Descontinuada nesta versão",
  descricao: "Categoria do mockup inicial, guardada como fixture do caminho sem foto.",
  fotoPath: null,
  ordem: 7,
  ativo: false,
  destaque: false,
};

const comFoto = categoriasSeed[0];

describe("CardDeCategoria, a frente com foto", () => {
  it("monta o <picture> com AVIF, WebP e a reserva em JPEG", () => {
    const { container } = render(<CardDeCategoria categoria={comFoto} indice={0} />);
    const tipos = [...container.querySelectorAll("source")].map((s) =>
      s.getAttribute("type"),
    );
    expect(tipos).toEqual(["image/avif", "image/webp"]);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      `${comFoto.fotoPath}-640.jpg`,
    );
  });

  it("cita as duas larguras em cada formato", () => {
    const { container } = render(<CardDeCategoria categoria={comFoto} indice={0} />);
    for (const s of container.querySelectorAll("source")) {
      const srcset = s.getAttribute("srcset") ?? "";
      expect(srcset).toContain("320w");
      expect(srcset).toContain("640w");
    }
  });

  /**
   * O guarda mais importante deste arquivo.
   *
   * O `<picture>` cita nome de arquivo em string montada. Um erro de digitação
   * no seed, ou uma categoria nova sem rodar `python scripts/gerar-pratos.py`,
   * dá card com buraco no ar e nenhum erro em lugar nenhum. É o mesmo teste
   * que a rota do delivery tem, pelo mesmo motivo.
   */
  it("aponta só para derivados que existem em public/", () => {
    const publico = join(process.cwd(), "public");
    const comFotoNoSeed = categoriasSeed.filter((c) => c.fotoPath);
    expect(comFotoNoSeed.length).toBeGreaterThan(0);

    for (const categoria of comFotoNoSeed) {
      const { container } = render(
        <CardDeCategoria categoria={categoria} indice={0} />,
      );
      const citados = arquivosCitados(container);
      expect(citados.length).toBe(5);
      for (const url of citados) {
        expect(
          existsSync(join(publico, url.replace(/^\//, ""))),
          `faltando em public/: ${url}`,
        ).toBe(true);
      }
    }
  });

  it("carrega a foto preguiçosamente e reserva a caixa dela", () => {
    // São seis fotos numa seção que só começa depois do herói e da Delivery,
    // bem abaixo da dobra. E o par width/height evita o card pular quando a
    // foto chega, que num palco preso desalinharia o trilho da espiral.
    const { container } = render(<CardDeCategoria categoria={comFoto} indice={0} />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("width")).toBe("640");
    expect(img?.getAttribute("height")).toBe("427");
  });

  it("deita o véu sobre a foto, com a cor saindo do token", () => {
    const { container } = render(<CardDeCategoria categoria={comFoto} indice={0} />);
    const veu = [...container.querySelectorAll("div")].find((d) =>
      d.style.backgroundImage.includes("linear-gradient"),
    );
    expect(veu, "nenhum elemento carrega o degradê do véu").toBeTruthy();
    expect(veu!.style.backgroundImage).toContain("var(--color-carvao)");
  });

  it("escreve o texto em branco, que é o que passa AA sobre o véu", () => {
    render(<CardDeCategoria categoria={comFoto} indice={0} />);
    expect(screen.getByText(comFoto.kicker).className).toContain("text-branco");
    expect(screen.getByText(comFoto.nome).className).toContain("text-branco");
  });

  it("esconde a descrição, que a fotografia substitui", () => {
    render(<CardDeCategoria categoria={comFoto} indice={0} />);
    expect(screen.queryByText(comFoto.descricao)).not.toBeInTheDocument();
  });
});

describe("CardDeCategoria, a frente sem foto", () => {
  /**
   * Nulo é caminho legítimo, e não pendência. Ele é o que a seção mostra
   * enquanto uma categoria nova não tem fotografia, e apagá-lo obrigaria o
   * dono a esperar o fotógrafo para publicar um item no cardápio.
   */
  it("volta ao creme chapado, sem imagem nenhuma", () => {
    const { container } = render(<CardDeCategoria categoria={semFoto} indice={0} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("picture")).toBeNull();
    expect(container.innerHTML).toContain("bg-creme");
  });

  it("mantém o kicker em brasa-escura, que é o par medido sobre creme", () => {
    render(<CardDeCategoria categoria={semFoto} indice={0} />);
    const kicker = screen.getByText(semFoto.kicker).className;
    expect(kicker).toContain("text-brasa-escura");
    expect(kicker).not.toContain("text-branco");
  });

  it("mantém a descrição, que só ali ainda tem lugar", () => {
    render(<CardDeCategoria categoria={semFoto} indice={0} />);
    expect(screen.getByText(semFoto.descricao)).toBeInTheDocument();
  });

  it("não deita véu nenhum, porque não há foto para segurar", () => {
    const { container } = render(<CardDeCategoria categoria={semFoto} indice={0} />);
    const veu = [...container.querySelectorAll("div")].find((d) =>
      d.style.backgroundImage.includes("linear-gradient"),
    );
    expect(veu).toBeUndefined();
  });
});

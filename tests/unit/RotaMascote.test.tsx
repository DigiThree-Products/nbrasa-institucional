import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RotaMascote } from "@/components/sections/RotaMascote";

/** Todo arquivo citado pelo card, vindo do <img> e de cada <source>. */
function arquivosCitados(card: Element) {
  const src = card.querySelector("img")?.getAttribute("src") ?? "";
  const dosSources = [...card.querySelectorAll("source")].flatMap((s) =>
    (s.getAttribute("srcset") ?? "")
      .split(",")
      .map((parte) => parte.trim().split(/\s+/)[0])
      .filter(Boolean),
  );
  return [src, ...dosSources].filter(Boolean);
}

const paradas = [
  { id: "centro", bairro: "Centro" },
  { id: "anil", bairro: "Praia do Anil" },
  { id: "grande", bairro: "Praia Grande" },
  { id: "pontal", bairro: "Pontal" },
  { id: "verolme", bairro: "Verolme" },
];

describe("RotaMascote", () => {
  it("renderiza todas as paradas, sem depender de animação", () => {
    render(<RotaMascote paradas={paradas} />);
    for (const p of paradas) {
      expect(screen.getByText(p.bairro)).toBeInTheDocument();
    }
  });

  it("mantém a ordem da viagem, do topo da seção para a base", () => {
    // POSICOES é uma lista posicional: o card de índice 0 fica em cima e o
    // de índice 4 embaixo. Quem reordenar o `map`, ou parear as paradas com
    // as posições por outro critério, troca a ordem da viagem sem quebrar o
    // teste de presença acima, que só olha se cada nome existe.
    const { container } = render(<RotaMascote paradas={paradas} />);
    const cards = [...container.querySelectorAll("[data-parada]")];
    expect(cards.map((c) => c.getAttribute("data-parada"))).toEqual(
      paradas.map((p) => p.id),
    );
  });

  it("dá a cada parada a foto do próprio bairro", () => {
    // Errar o pareamento é fácil e silencioso: cinco cards com a mesma foto
    // continuariam renderizando, e o teste de ordem acima seguiria passando.
    const { container } = render(<RotaMascote paradas={paradas} />);
    for (const p of paradas) {
      const card = container.querySelector(`[data-parada="${p.id}"]`);
      const arquivos = arquivosCitados(card!);
      expect(arquivos.length).toBeGreaterThan(0);
      for (const a of arquivos) {
        expect(a).toContain(`parada-${p.id}-`);
      }
    }
  });

  it("aponta só para derivados que existem em public/", () => {
    // O <picture> cita nome de arquivo em string. Um erro de digitação, ou
    // um id de parada novo sem rodar scripts/gerar-paradas.py, dá card com
    // buraco no ar e nenhum erro em lugar nenhum.
    const { container } = render(<RotaMascote paradas={paradas} />);
    const publico = join(process.cwd(), "public");
    const citados = [...container.querySelectorAll("[data-parada]")].flatMap(
      arquivosCitados,
    );
    expect(citados.length).toBeGreaterThan(0);
    for (const url of citados) {
      expect(
        existsSync(join(publico, url.replace(/^\//, ""))),
        `faltando em public/: ${url}`,
      ).toBe(true);
    }
  });

  it("carrega as fotos das paradas preguiçosamente", () => {
    // São cinco fotos no fim de uma seção de 1900px, muito abaixo da dobra.
    // Sem lazy elas competem com o LCP do herói, que é a foto da fachada.
    const { container } = render(<RotaMascote paradas={paradas} />);
    const fotos = [...container.querySelectorAll("[data-parada] img")];
    expect(fotos).toHaveLength(paradas.length);
    for (const foto of fotos) {
      expect(foto).toHaveAttribute("loading", "lazy");
    }
  });

  it("expõe o path da rota para o MotionPath", () => {
    const { container } = render(<RotaMascote paradas={paradas} />);
    expect(container.querySelector("#rota-entrega")).toBeInTheDocument();
  });

  it("marca a arte da rota como decorativa", () => {
    // Escopado ao <svg> que é ANCESTRAL de #rota-entrega: um querySelector
    // solto por "svg[aria-hidden='true']" também casa com o <Mascote>, que
    // tem o mesmo atributo — o teste passaria mesmo se o SVG da rota não
    // fosse decorativo, contanto que o mascote continuasse sendo.
    const { container } = render(<RotaMascote paradas={paradas} />);
    const rota = container.querySelector("#rota-entrega");
    const svgDaRota = rota?.closest("svg");
    expect(svgDaRota).toHaveAttribute("aria-hidden", "true");
  });
});

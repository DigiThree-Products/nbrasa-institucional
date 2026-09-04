"""Gera o favicon do site a partir da chama oficial de lib/marca.ts.

Rodar so quando a chama ou o tratamento mudarem:

    python scripts/gerar-favicon.py

Precisa de PyMuPDF e Pillow (os dois ja usados por scripts/gerar-fachada.py).

Saida, toda versionada em app/, que e onde o App Router procura:

    app/icon.svg        vetor, o que Chrome e Firefox usam
    app/favicon.ico     16/32/48/64/128/256, para Safari e para /favicon.ico
    app/apple-icon.png  180x180, atalho na tela de inicio do iOS

O tratamento e chama BRANCA sobre azulejo BRASA, e nao a chama vermelha
solta. A 16px, que e o tamanho que de fato aparece na aba, a chama solta
vira uma mancha sem presenca: ela e muito mais alta que larga (468x684) e
sobra pouca massa. O azulejo resolve por dois motivos, a cor da marca lê
antes da forma, e branco sobre brasa faz 5,31:1, o mesmo par que
tests/unit/contraste.test.ts ja valida para o botao solido.

A fonte de verdade da curva continua sendo lib/marca.ts: este script le os
paths de la e tests/unit/favicon.test.ts falha se app/icon.svg sair de
sincronia com eles.
"""

import io
import re
from pathlib import Path

import fitz
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
MARCA = RAIZ / "lib" / "marca.ts"
DESTINO = RAIZ / "app"

# A chama oficial, no viewBox em que foi entregue.
LARGURA_CHAMA = 468.1
ALTURA_CHAMA = 684.1

# O quadrado do icone tem o lado da altura da chama, e ela e centrada nele.
LADO = ALTURA_CHAMA
DESLOCA_X = (LADO - LARGURA_CHAMA) / 2

# Quanto da caixa a chama ocupa. 0,66 deixa respiro suficiente para o
# azulejo continuar lendo como azulejo em 16px; acima de ~0,8 a chama
# encosta nas bordas e o icone vira uma mancha so.
ESCALA = 0.66

# Raio do canto, na escala do viewBox. 150/684 e ~22%, a proporcao de
# "quadrado arredondado" que os sistemas operacionais usam.
RAIO = 150

BRASA = "#cf2434"
BRANCO = "#ffffff"

TAMANHOS_ICO = [16, 32, 48, 64, 128, 256]
TAMANHO_APPLE = 180


def paths_da_chama() -> list[str]:
    """Le os dois paths de D_CHAMA_OFICIAL, sem executar TypeScript."""
    fonte = io.open(MARCA, encoding="utf-8").read()
    bloco = re.search(
        r"export const D_CHAMA_OFICIAL = \[(.*?)\] as const;", fonte, re.S
    )
    if not bloco:
        raise SystemExit("D_CHAMA_OFICIAL nao encontrado em lib/marca.ts")
    paths = re.findall(r'"(M[^"]+)"', bloco.group(1))
    if len(paths) != 2:
        raise SystemExit(f"esperava 2 paths em D_CHAMA_OFICIAL, achei {len(paths)}")
    return paths


def montar_svg(paths: list[str]) -> str:
    corpo = "".join(f'<path d="{p}" fill="{BRANCO}"/>' for p in paths)
    meio = LADO / 2
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LADO} {LADO}" '
        f'width="{LADO}" height="{LADO}">'
        f'<rect width="{LADO}" height="{LADO}" rx="{RAIO}" fill="{BRASA}"/>'
        f'<g transform="translate({meio},{meio}) scale({ESCALA}) '
        f'translate({-meio},{-meio}) translate({DESLOCA_X},0)">{corpo}</g>'
        "</svg>"
    )


def rasterizar(svg: str, lado: int) -> Image.Image:
    doc = fitz.open("svg", svg.encode("utf-8"))
    pagina = fitz.open("pdf", doc.convert_to_pdf())[0]
    escala = lado / LADO
    pix = pagina.get_pixmap(matrix=fitz.Matrix(escala, escala), alpha=False)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    # O pixmap sai com arredondamento de 1px conforme o lado pedido; o
    # resize final garante a dimensao exata que o .ico espera.
    return im if im.size == (lado, lado) else im.resize((lado, lado), Image.LANCZOS)


def main() -> None:
    svg = montar_svg(paths_da_chama())

    caminho_svg = DESTINO / "icon.svg"
    io.open(caminho_svg, "w", encoding="utf-8").write(svg)

    # RGBA, e nao RGB: o Turbopack decodifica o .ico durante o build e recusa
    # PNG interno que nao esteja em RGBA ("The PNG is not in RGBA format!").
    # O azulejo e opaco, entao o canal alfa sai todo em 255, e de conformidade.
    mestre = rasterizar(svg, max(TAMANHOS_ICO)).convert("RGBA")
    caminho_ico = DESTINO / "favicon.ico"
    mestre.save(caminho_ico, format="ICO", sizes=[(t, t) for t in TAMANHOS_ICO])

    caminho_apple = DESTINO / "apple-icon.png"
    rasterizar(svg, TAMANHO_APPLE).save(caminho_apple, format="PNG")

    for caminho in (caminho_svg, caminho_ico, caminho_apple):
        print(f"{caminho.relative_to(RAIZ)}  {caminho.stat().st_size} bytes")


if __name__ == "__main__":
    main()

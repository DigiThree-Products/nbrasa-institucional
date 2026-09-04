"""Converte a Owners XNarrow Black de OTF para o WOFF2 que o site serve.

Rodar so quando o arquivo de origem mudar:

    python scripts/gerar-owners.py

Precisa de fonttools e brotli:

    pip install fonttools brotli

A origem e a versao TRIAL da familia, licenciada como "Personal Use Only".
O cliente decidiu usa-la assim mesmo; a compra da licenca de webfont esta
registrada como pendencia no README. Quando os arquivos licenciados
chegarem, e so solta-los na mesma pasta: o script acha pelo PREFIXO, e o
teste tests/unit/owners.test.ts passa a ver os acentos e afrouxa sozinho.

A saida vai para app/fontes/ e nao para public/ porque next/font/local
referencia o arquivo por caminho de modulo e cuida de hash e cache; em
public/ ele seria servido cru e sem essas garantias.

XNarrow Black e a largura escolhida por medicao, nao por gosto: a caixa
alta da Owners e 0,700 em contra 0,859 em da Anton que ela substitui, e
com o fator de 1,227 que compensa isso ela ocupa 103% da largura que a
Anton ocupava. As outras larguras vao de 75% (XXNarrow) a 186% (Regular),
e qualquer uma delas obrigaria a reajustar os clamp do layout.
"""

from pathlib import Path

from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parent.parent

# Fora do repositorio, ver .gitignore. Os nomes trazem um hash do site de
# origem, entao casamos por prefixo em vez de nome inteiro.
ORIGEM = RAIZ / "fotos-site" / "owners-font-family"
# O hifen final nao e enfeite: sem ele o prefixo tambem casa com
# "OwnersTRIALXNarrow-BlackItalic", e a familia traz as duas.
PREFIXO = "OwnersTRIALXNarrow-Black-"

DESTINO = RAIZ / "app" / "fontes" / "owners-xnarrow-black.woff2"


def main() -> None:
    candidatos = sorted(ORIGEM.glob(f"{PREFIXO}*.otf"))
    if not candidatos:
        raise SystemExit(f"nenhum {PREFIXO}*.otf em {ORIGEM}")
    if len(candidatos) > 1:
        raise SystemExit(f"mais de um {PREFIXO}*.otf, ambiguo: {candidatos}")

    origem = candidatos[0]

    fonte = TTFont(origem)
    fonte.flavor = "woff2"
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    fonte.save(DESTINO)

    cmap = set()
    for tabela in TTFont(origem)["cmap"].tables:
        cmap |= set(tabela.cmap)

    print(f"{origem.name} -> {DESTINO.relative_to(RAIZ)}")
    print(f"{DESTINO.stat().st_size} bytes, {len(cmap)} code points no cmap")


if __name__ == "__main__":
    main()

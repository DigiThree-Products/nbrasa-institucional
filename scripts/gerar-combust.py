"""Extrai a Combust do zip de origem e gera o WOFF2 subsetado que o site serve.

Rodar so quando o arquivo de origem mudar:

    python scripts/gerar-combust.py

Precisa de fonttools e brotli:

    pip install fonttools brotli

A Combust e a fonte do FOCO do titulo do heroi, e so dele: ela ja traz as
labaredas dentro do glifo, que e o motivo de ela ter entrado no lugar do
sistema de labaredas desenhadas que existia antes. Todo o resto do display do
site continua na Owners XNarrow Black.

A origem e a versao FREE TRIAL, da TypeFactory. Igual a Owners, a compra da
licenca de webfont e pendencia do cliente e esta registrada no README. O zip
fica em "apresentacao site/", fora do controle de versao.

Subsetamos de proposito. A fonte cheia tem 305 code points e 84 kB em WOFF2,
peso que nao se justifica para UMA palavra: o foco do heroi. O conjunto abaixo
cobre caixa alta acentuada, digitos e pontuacao, que e tudo que o foco pode
precisar, porque o h1 aplica `uppercase`. Se um dia a Combust for usada em
texto corrido, este script precisa mudar junto.

A saida vai para app/fontes/ e nao para public/ porque next/font/local
referencia o arquivo por caminho de modulo e cuida de hash e cache; em
public/ ele seria servido cru e sem essas garantias.
"""

import io
import zipfile
from pathlib import Path

from fontTools.subset import Subsetter, Options
from fontTools.ttLib import TTFont

RAIZ = Path(__file__).resolve().parent.parent

# Fora do repositorio, ver .gitignore.
ORIGEM = RAIZ / "apresentação site" / "combust.zip"
DENTRO_DO_ZIP = "Combust Free Trial.otf"

DESTINO = RAIZ / "app" / "fontes" / "combust.woff2"

# Caixa alta acentuada, digitos e a pontuacao que cabe num titulo. Minusculas
# ficam de fora porque o h1 do heroi aplica `uppercase`: elas nunca chegam a
# ser desenhadas, e cada uma que sobra e peso morto no arquivo servido.
GLIFOS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "ÁÀÂÃÄÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝ"
    "0123456789"
    " .,;:!?'’\"“”-–…&%/()"
)


def main() -> None:
    if not ORIGEM.exists():
        raise SystemExit(f"{ORIGEM} nao encontrado")

    with zipfile.ZipFile(ORIGEM) as z:
        if DENTRO_DO_ZIP not in z.namelist():
            raise SystemExit(f"{DENTRO_DO_ZIP} nao esta em {ORIGEM.name}")
        bruto = z.read(DENTRO_DO_ZIP)

    fonte = TTFont(io.BytesIO(bruto))
    antes = len({cp for t in fonte["cmap"].tables for cp in t.cmap})

    opcoes = Options()
    # `layout_features` vazio tira GSUB/GPOS: o foco e uma palavra em caixa
    # alta, sem ligadura nem alternativa, e as tabelas custam bytes.
    opcoes.layout_features = []
    opcoes.desubroutinize = True
    opcoes.name_IDs = ["*"]
    opcoes.notdef_outline = True

    sub = Subsetter(options=opcoes)
    sub.populate(text=GLIFOS)
    sub.subset(fonte)

    fonte.flavor = "woff2"
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    fonte.save(DESTINO)

    depois = len({cp for t in TTFont(DESTINO)["cmap"].tables for cp in t.cmap})
    print(f"{ORIGEM.name}/{DENTRO_DO_ZIP} -> {DESTINO.relative_to(RAIZ)}")
    print(f"{len(bruto)} bytes de OTF, {antes} code points")
    print(f"{DESTINO.stat().st_size} bytes de WOFF2, {depois} code points")


if __name__ == "__main__":
    main()

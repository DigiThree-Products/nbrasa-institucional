"""Gera as variantes web das fotos dos pratos dos cards do Cardapio.

Rodar so quando as fotos de origem mudarem; a saida fica versionada em
public/, porque sao arquivos pequenos e os originais somam 28 MB (fora do
repo, em "fotos-site/").

    python scripts/gerar-pratos.py

O slot do card e 3:2 deitado (PROPORCAO abaixo), o mesmo `aspect-[3/2]` do
CardDeCategoria e o mesmo que `PROPORCAO` em lib/espiral.ts converte para as
contas da helice. Cinco das seis origens sao RETRATO, entao aqui o corte tira
ALTURA, ao contrario de gerar-paradas.py, que sempre tira largura. Uma delas,
a dos petiscos, e mais deitada que 3:2 e perde largura. Por isso FOCO e
declarado por foto no eixo que sobra, e nao num eixo fixo.

A chave de PRATOS e o `slug` da categoria em lib/conteudo.seed.ts, e e ele que
vira o nome do derivado. O componente monta a URL a partir de
`Categoria.fotoPath`, que guarda esse mesmo nome, e ha teste que falha se um
derivado citado la nao existir em public/.
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "fotos-site"
DESTINO = RAIZ / "public"

# Largura / altura do slot do card, o mesmo aspect-[3/2] do CardDeCategoria.
PROPORCAO = 3 / 2

# slug da categoria -> (arquivo de origem, foco do corte no eixo que sobra).
#
# O foco vai de 0 a 1 no eixo que o corte encurta: nas cinco fotos em retrato
# ele e vertical, 0 encosta no topo e 1 no rodape; na dos petiscos, que e a
# unica mais deitada que 3:2, ele e horizontal.
#
# Os valores nao sao chute, foram escolhidos comparando os cortes lado a lado:
#
# - burgers: a janela guarda pouco mais da metade da altura, e o neon da marca
#   fica ACIMA do lanche. 0.66 e o ponto em que o lanche inteiro cabe e ainda
#   sobra a barriga do neon atras; mais alto corta o pao, mais baixo perde a
#   marca e sobra prato vazio.
# - carnes-nobres: mesma ideia, a tigela ocupa a metade de baixo e a mao que
#   pega a isca entra no quadro por cima. 0.66 mantem a tigela cheia e deixa
#   so a ponta dos dedos, que e o que da escala e movimento a foto.
# - drinks: a taca e alta e ocupa quase toda a altura. 0.50 sacrifica o alecrim
#   no topo e o pe da taca embaixo, que e o corte que qualquer revista faria.
# - sobremesas: o chantili e o assunto e esta no terco de cima, entao o foco
#   sobe para 0.42. Centralizado, a foto viraria taca sem cobertura.
# - espetinhos: a origem e 4:3, quase a proporcao do card, e o corte tira uma
#   fatia fina. Nao ha o que escolher, 0.50.
# - petiscos: e a unica que perde LARGURA, e o prato da marca esta no canto
#   superior direito. 0.55 empurra a janela para a direita e o mantem inteiro.
PRATOS = {
    "burgers": ("burger.jpg", 0.66),
    "espetinhos": ("espetihos.png", 0.50),
    "carnes-nobres": ("carne.jpg", 0.66),
    "petiscos": ("petiscos.png", 0.55),
    "drinks": ("drink.jpg", 0.50),
    "sobremesas": ("sobremesa.png", 0.42),
}

# O card mede no maximo 288px de largura (duas colunas a partir de sm, quatro
# dentro de max-w-[1280px] no lg). 320 cobre 1x com folga e 640 cobre 2x.
LARGURAS = (320, 640)

# Mais alto que em gerar-paradas.py de proposito. La metade do quadro e ceu e
# agua, superficie lisa onde o banding aparece primeiro e detalhe nao se perde.
# Aqui e o contrario: comida em close e textura fina (marca de grelha, farofa,
# gelo, farelo), que e o que some antes num AVIF apertado.
Q_AVIF = 55
Q_WEBP = 78
Q_JPEG = 82


def cortar(imagem: Image.Image, foco: float) -> Image.Image:
    """Corta no aspecto do card, tirando do eixo que sobra em torno de `foco`."""
    largura, altura = imagem.size
    if largura / altura > PROPORCAO:
        # Deitada demais: sobra largura.
        larga = int(altura * PROPORCAO)
        centro = int(foco * largura)
        esquerda = max(0, min(largura - larga, centro - larga // 2))
        return imagem.crop((esquerda, 0, esquerda + larga, altura))
    # Em pe (ou menos deitada que o card): sobra altura.
    alta = int(largura / PROPORCAO)
    centro = int(foco * altura)
    topo = max(0, min(altura - alta, centro - alta // 2))
    return imagem.crop((0, topo, largura, topo + alta))


def main() -> None:
    faltando = [n for n, _ in PRATOS.values() if not (ORIGEM / n).exists()]
    if faltando:
        raise SystemExit(f"origem nao encontrada: {', '.join(faltando)}")

    for slug, (nome, foco) in PRATOS.items():
        # convert("RGB") porque tres origens sao PNG: sem isso o AVIF sai com
        # canal alfa inutil e o JPEG de reserva nem grava.
        with Image.open(ORIGEM / nome) as bruta:
            tamanho_original = bruta.size
            recortada = cortar(bruta.convert("RGB"), foco)

        for largura in LARGURAS:
            altura = round(largura / PROPORCAO)
            quadro = recortada.resize((largura, altura), Image.LANCZOS)
            quadro.save(DESTINO / f"prato-{slug}-{largura}.avif", quality=Q_AVIF)
            quadro.save(DESTINO / f"prato-{slug}-{largura}.webp", quality=Q_WEBP)

        # Um JPEG so, na largura maior: e a ultima reserva, para o navegador
        # que nao le AVIF nem WebP, e nao vale duplicar o par de larguras nele.
        maior = max(LARGURAS)
        final = recortada.resize((maior, round(maior / PROPORCAO)), Image.LANCZOS)
        final.save(DESTINO / f"prato-{slug}-{maior}.jpg", quality=Q_JPEG, optimize=True)

        print(f"{slug}: {nome} {tamanho_original} -> {recortada.size}")


if __name__ == "__main__":
    main()

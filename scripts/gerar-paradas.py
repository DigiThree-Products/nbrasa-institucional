"""Gera as variantes web das fotos das paradas da rota do delivery.

Rodar so quando as fotos de origem mudarem; a saida fica versionada em
public/, porque sao arquivos pequenos e os originais somam 14 MB (fora do
repo, em "apresentacao site/").

    python scripts/gerar-paradas.py

O slot do card e 4/3.4 (PROPORCAO abaixo) e as origens sao mais largas que
isso: tres em 4:3 e duas em 16:9. Ou seja, todo corte tira largura, e das
16:9 ele tira um terco. FOCO_HORIZONTAL e o botao deste script: 0.5 corta
igual dos dois lados, menor puxa o quadro para a esquerda.

O nome do arquivo de origem tem de bater com o `bairro` da parada em
components/sections/Delivery.tsx, e o id vira o nome do derivado. Ha teste
que falha se um derivado citado pelo componente nao existir em public/.
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "apresentação site"
DESTINO = RAIZ / "public"

# Largura / altura do slot do card, o mesmo aspect-[4/3.4] do RotaMascote.
PROPORCAO = 4 / 3.4

# id da parada -> (arquivo de origem, foco horizontal do corte).
#
# O foco so foge de 0.5 onde o assunto nao esta no meio. No Centro ele foge
# bastante: o letreiro "EU (coracao) ANGRA DOS REIS" ocupa a largura inteira
# de uma 16:9, e a janela do card so guarda dois tercos dela, entao alguma
# palavra se perde de qualquer jeito. Comparados 0.30, 0.40, 0.50, 0.60 e
# 0.70 lado a lado, 0.70 e o unico que deixa uma frase inteira em pe: o
# coracao mais "ANGRA DOS REIS", perdendo so o "EU". Os focos menores cortam
# no meio de "ANGRA" e o letreiro vira letra solta.
PARADAS = {
    "centro": ("centro.png", 0.70),
    "anil": ("praia do anil.png", 0.50),
    "grande": ("praia grande.png", 0.50),
    "pontal": ("pontal.png", 0.50),
    "verolme": ("verolme.png", 0.50),
}

# O card mede 158px no mobile, 190px no md e 250px no lg. 320 cobre o mobile
# em tela 2x e 640 cobre o desktop em tela 2x, com folga.
LARGURAS = (320, 640)

# Ceu e agua ocupam metade destas fotos, e e neles que o banding aparece
# primeiro. Mesmos valores da fachada, que tem o mesmo problema.
Q_AVIF = 52
Q_WEBP = 76
Q_JPEG = 80


def cortar(imagem: Image.Image, foco: float) -> Image.Image:
    """Corta no aspecto do card, tirando largura em torno de `foco`."""
    largura, altura = imagem.size
    larga = min(int(altura * PROPORCAO), largura)
    centro = int(foco * largura)
    esquerda = max(0, min(largura - larga, centro - larga // 2))
    return imagem.crop((esquerda, 0, esquerda + larga, altura))


def main() -> None:
    faltando = [n for n, _ in PARADAS.values() if not (ORIGEM / n).exists()]
    if faltando:
        raise SystemExit(f"origem nao encontrada: {', '.join(faltando)}")

    DESTINO.mkdir(exist_ok=True)
    for parada, (nome, foco) in PARADAS.items():
        imagem = Image.open(ORIGEM / nome).convert("RGB")
        cortada = cortar(imagem, foco)
        print(f"{parada}: {imagem.size} -> corte {cortada.size} (foco={foco})")

        for larg in LARGURAS:
            alto = round(larg / PROPORCAO)
            redim = cortada.resize((larg, alto), Image.LANCZOS)
            redim.save(DESTINO / f"parada-{parada}-{larg}.avif", quality=Q_AVIF)
            redim.save(
                DESTINO / f"parada-{parada}-{larg}.webp", quality=Q_WEBP, method=6
            )
            if larg == max(LARGURAS):
                # JPEG so na maior largura: e o fallback do <picture>, servido
                # apenas a navegadores sem AVIF nem WebP.
                redim.save(
                    DESTINO / f"parada-{parada}-{larg}.jpg",
                    "JPEG",
                    quality=Q_JPEG,
                    optimize=True,
                    progressive=True,
                )
            print(f"  {larg}x{alto} gravado")


if __name__ == "__main__":
    main()

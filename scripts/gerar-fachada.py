"""Gera as variantes web da foto da fachada a partir do original.

Rodar so quando a foto de origem mudar; a saida fica versionada em public/,
porque sao cinco arquivos pequenos e o original tem 33 MB (fora do repo).

    python scripts/gerar-fachada.py

O original e retrato 4892x7732 e o slot do heroi e paisagem 4:3.2, entao o
corte e obrigatorio. FOCO_VERTICAL marca onde esta o centro do letreiro
iluminado, medido na imagem: e o elemento que nao pode sair do quadro.
"""

from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # o original excede o limite antibomba do Pillow

RAIZ = Path(__file__).resolve().parent.parent

# Copia local do original. A mesma imagem vive no OneDrive do cliente em
# Clientes/Nbrasa/Demandas/Folder/Material/IMG_3643.png (byte a byte igual).
ORIGEM = RAIZ / "apresentação site" / "IMG_3643.png"
DESTINO = RAIZ / "public"

PROPORCAO = 4 / 3.2  # mesma do slot no Hero: aspect-[4/3.2]
FOCO_VERTICAL = 0.556  # centro do letreiro, em fracao da altura

# 800 cobre o slot no desktop (~511 px CSS) e o mobile em tela comum;
# 1400 cobre o pior caso, que e o mobile em tela 2x.
LARGURAS = (800, 1400)

# Qualidades escolhidas olhando o ceu em 1:1, que e onde o banding aparece
# primeiro nesta foto. Abaixo destes valores ele fica visivel.
Q_AVIF = 52
Q_WEBP = 76
Q_JPEG = 80


def main() -> None:
    if not ORIGEM.exists():
        raise SystemExit(f"original nao encontrado: {ORIGEM}")

    imagem = Image.open(ORIGEM).convert("RGB")
    largura, altura = imagem.size

    alto_corte = min(int(largura / PROPORCAO), altura)
    centro = int(FOCO_VERTICAL * altura)
    topo = max(0, min(altura - alto_corte, centro - alto_corte // 2))
    cortada = imagem.crop((0, topo, largura, topo + alto_corte))
    print(f"original {largura}x{altura} -> corte {cortada.size} (topo={topo})")

    DESTINO.mkdir(exist_ok=True)
    for larg in LARGURAS:
        redim = cortada.resize((larg, int(larg / PROPORCAO)), Image.LANCZOS)
        redim.save(DESTINO / f"fachada-nbrasa-{larg}.avif", quality=Q_AVIF)
        redim.save(DESTINO / f"fachada-nbrasa-{larg}.webp", quality=Q_WEBP, method=6)
        if larg == max(LARGURAS):
            # JPEG so na maior largura: e o fallback do <picture>, servido
            # apenas a navegadores sem AVIF nem WebP.
            redim.save(
                DESTINO / f"fachada-nbrasa-{larg}.jpg",
                "JPEG",
                quality=Q_JPEG,
                optimize=True,
                progressive=True,
            )
        print(f"  {larg}x{redim.size[1]} gravado")


if __name__ == "__main__":
    main()

"""Gera as variantes web da foto de fundo da secao de avaliacoes.

Rodar so quando a foto de origem mudar:

    python scripts/gerar-quem-veio-volta.py

A origem e "quem veio volta.png", em fotos-site/ (fora do repo). O cliente
trocou a foto em 2026-09-10, e a nova chegou com nome diferente da primeira,
que tinha um espaco antes do ponto. Se as duas ainda estiverem lado a lado na
pasta, a boa e apagar a antiga: nada aqui a usa.

**Nao ha corte.** As outras fotos do site entram em janela de proporcao fixa
e o corte e decidido aqui; esta cobre uma secao inteira, cuja proporcao muda
com a janela do visitante, entao quem corta e o `object-cover` do navegador.
O que este script faz e so converter e reduzir.

A origem tem 1122x1402, retrato de 4:5. **1080 e o teto** que este script
grava: ampliar so inventaria pixel e peso, e os 42px que sobram nao pagam uma
largura a mais no <picture>. Numa tela de 1920 o navegador amplia 1,8x, o que
seria visivel numa foto nua e nao e atras do veu de carvao a 78% que a secao
pinta por cima. Se um dia chegar um arquivo bem maior, acrescente a largura em
LARGURAS e o <picture> da secao aproveita sozinho.
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "fotos-site" / "quem veio volta.png"
DESTINO = RAIZ / "public"
BASE = "quem-veio-volta"

# 640 cobre o telefone em tela 2x; 1080 e o teto (origem tem 1122).
LARGURAS = (640, 1080)

# Ceu liso ocupa o terco de cima da foto, e e nele que o banding aparece
# primeiro. Mesmos valores da fachada e das paradas, que tem o mesmo problema.
Q_AVIF = 52
Q_WEBP = 76
Q_JPEG = 80


def main() -> None:
    if not ORIGEM.exists():
        raise SystemExit(f"origem nao encontrada: {ORIGEM}")

    imagem = Image.open(ORIGEM).convert("RGB")
    largura, altura = imagem.size
    print(f"origem: {largura}x{altura}")

    DESTINO.mkdir(exist_ok=True)
    for larg in LARGURAS:
        if larg > largura:
            print(f"  {larg}: pulado, maior que a origem")
            continue
        alto = round(altura * larg / largura)
        redim = imagem.resize((larg, alto), Image.LANCZOS)
        redim.save(DESTINO / f"{BASE}-{larg}.avif", quality=Q_AVIF)
        redim.save(DESTINO / f"{BASE}-{larg}.webp", quality=Q_WEBP, method=6)
        if larg == max(LARGURAS):
            # JPEG so na maior largura: e o fallback do <picture>, servido
            # apenas a navegadores sem AVIF nem WebP.
            redim.save(
                DESTINO / f"{BASE}-{larg}.jpg",
                "JPEG",
                quality=Q_JPEG,
                optimize=True,
                progressive=True,
            )
        print(f"  {larg}x{alto} gravado")


if __name__ == "__main__":
    main()

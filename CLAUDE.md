# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado atual

**Ainda não há código neste repositório.** Até 2026-09-02 ele contém apenas os
ativos de marca do N'Brasa. Não existe build system, gerenciador de pacotes,
test runner nem controle de versão aqui — não perca tempo procurando.

O nome da pasta (`site-nbrasa`) indica que o objetivo é construir o site do
estabelecimento. O material abaixo foi extraído dos ativos e é a fonte de
verdade para conteúdo e identidade visual do site.

## O negócio

**N'Brasa** — bar, choperia e casa de carnes em Angra dos Reis (RJ).
O letreiro da fachada assina `CHOPPERIA | CARNES`.

- **Endereço:** Av. Júlio Maria, 235 — Centro, Angra dos Reis
- **Instagram:** [@nbrasaangra](https://instagram.com/nbrasaangra) (~14,5 mil seguidores)
- **Categorias:** bar com atrações musicais, choperia, burguers, espetos e petiscos

**Horários de funcionamento** (confirmado pelo cliente em 2026-09-02 — vale a
bio do Instagram):

| Dia | Horário |
|---|---|
| Terça a quinta | 14h–22h |
| Sexta e sábado | 16h–03h |
| Domingo | 14h–22h |

O folder impresso (`apresentação - folder - nbrasa.pdf`) traz horários
diferentes (16h–00h / 16h–02h30 / 16h–00h) — está **desatualizado**. Use sempre
a tabela acima; não "corrija" o site com base no folder.

## Identidade visual

Paleta oficial (do moodboard, página 2) — use exatamente estes valores:

| Cor | Hex | RGB |
|---|---|---|
| Carvão (fundo padrão) | `#241e1f` | 36, 30, 31 |
| Vermelho brasa (destaque) | `#cf2434` | 207, 36, 52 |
| Branco | `#ffffff` | 255, 255, 255 |

Tipografia: **Owners** (família principal) e **Hanken Grotesk** (apoio, disponível
no Google Fonts). Owners é comercial (Latinotype) — confirme licença de webfont
antes de embutir; não substitua por outra família sem avisar.

Elementos gráficos recorrentes:

- **Logo:** wordmark manuscrito `n'Brasa` dentro de um anel circular, com chama
  saindo do topo. Existe em branco sobre carvão, preto sobre vermelho e preto
  sobre branco.
- **Mascote:** chama antropomórfica de traço vermelho, com óculos escuros — em
  duas poses (sorrindo; cantando ao microfone). Fonte editável em `mascote.cdr`.
- **Grafismo:** curvas de nível concêntricas (estilo topográfico) em vermelho
  sobre preto; texturas de tecido amassado em vermelho.

## Copy da marca

Assinatura principal: **"O sabor que encontra, o som."**

Slogans e selos já aprovados, reutilizáveis no site:

- `vamos N'brasar?`
- `feel the fire`
- `VAI N'BRASANDO` (selo circular)
- `A fome acende aqui.`
- `Vem sentir a vida acontecer de gole em gole.`
- `Tem decisões que ficam melhores com o copo cheio.`
- `Boa comida, drinks marcantes, chopp gelado e a energia certa para fazer o dia durar mais.`

O verbo inventado "N'brasar" é central na marca — mantenha o apóstrofo e a
grafia exatos em qualquer texto novo.

## Estrutura prevista do site

O moodboard (página 6) define a navegação a partir dos destaques do Instagram:

`Perfil` · `Rede Social` · `Cardápio` · `Clássicos` · `Feedbacks` · `Atrações` · `Como Chegar`

Trate isso como o sitemap de partida.

## Trabalhando com os ativos

Nenhum arquivo aqui é texto. O que funciona nesta máquina:

- **PDFs:** `pdftoppm`/poppler **não** está instalado, mas o Python 3.13 tem
  **PyMuPDF (`fitz`)**, `pypdf`, `pdfminer` e **Pillow**. Use `fitz` para extrair
  texto e rasterizar páginas, depois leia os PNGs gerados.
- **`IMG_3643.png`:** foto da fachada, 4892×7732 px (32 MB) — grande demais para
  leitura direta. Reduza com Pillow antes de abrir.
- **`mascote.cdr`:** binário proprietário do CorelDRAW. Nenhuma ferramenta local
  abre. Peça ao usuário um export em SVG/PNG em vez de tentar parsear.

Grave arquivos intermediários fora do repositório (use o diretório temporário da
sessão), não ao lado dos ativos.

### Inventário

| Arquivo | O que contém |
|---|---|
| `moodboard-nbrasa-2025.pdf` | 6 pág. — manual de marca: logo, paleta, tipografia, grafismos, mascote, adesivos e a estrutura de navegação |
| `apresentação - folder - nbrasa.pdf` | 5 pág. — folder impresso com endereço, horários, fotos de produto e copy |
| `N'brasa adesivos.pdf` | 1 pág. — cartela de adesivos |
| `IMG_3643.png` | Foto da fachada da loja ao entardecer |
| `mascote.cdr` | Arte vetorial editável do mascote |

## Antes de criar o projeto

Nenhuma stack foi escolhida. Confirme framework, linguagem e hospedagem com o
usuário antes de gerar qualquer estrutura. Quando houver código, substitua as
seções "Estado atual" e "Trabalhando com os ativos" por instruções reais de
build, teste e arquitetura — o resto deste arquivo continua válido como
referência de marca e conteúdo.

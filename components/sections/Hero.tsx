import type { CSSProperties } from "react";
import { getConteudo, getHorarios } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { AJUSTES, mascaraChama } from "@/lib/costura";
import { partesDoTitulo } from "@/lib/tituloHero";
import { Botao } from "@/components/ui/Botao";
import { VideoFachada } from "./VideoFachada";

/**
 * Miniatura de 16px da própria foto, embutida como base64.
 *
 * O herói é escuro e a foto é o maior elemento acima da dobra: sem isto,
 * quem entra vê um retângulo vazio até o arquivo chegar. Vale os ~700 bytes
 * no HTML porque eles entram junto com a página, sem uma segunda requisição.
 */
const BORRAO_FACHADA =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAANABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDI0rWWtD5cy+dETnGcMPpW2FhvLcm12htxYxO2GXt+IrjMdTU9q+XYtk4HHOMVopO9yHBNWP/Z";

/**
 * A foto ocupa a coluna direita inteira e sangra até a borda da tela, então o
 * slot mais largo é o de um monitor grande. 1600 cobre isso e o mobile em
 * tela 2x; 900 cobre telas comuns. As variantes vêm de
 * scripts/gerar-fachada.py, que guarda o corte e as qualidades usadas.
 */
const TAMANHOS = "(min-width: 1024px) 60vw, 100vw";
const AVIF = "/fachada-nbrasa-900.avif 900w, /fachada-nbrasa-1600.avif 1600w";
const WEBP = "/fachada-nbrasa-900.webp 900w, /fachada-nbrasa-1600.webp 1600w";

/**
 * Corpo das linhas 1 e 3, que dividem a mesma escala de propósito: a abertura
 * e o fecho são apoio da palavra do meio, não informação concorrente, e dar
 * corpos diferentes a elas criaria uma terceira hierarquia que o desenho não
 * pede. No topo do `clamp` a linha do meio tem 3,47 vezes este corpo, que é a
 * proporção pedida no desenho e o que os três valores preservam ao crescer.
 *
 * O valor em si não está aqui, está em `--corpo-apoio`, declarado na coluna
 * de texto. É que ele governa duas coisas que precisam bater no pixel: o
 * corpo destas linhas e a altura da faixa em que o botão do WhatsApp se
 * encaixa, ao lado do fecho. Repetir o `clamp` nos dois lugares seria pedir
 * para eles saírem de sincronia no primeiro ajuste de escala.
 */
const APOIO = "block text-[length:var(--corpo-apoio)] leading-[1.1] tracking-[-.01em]";

/**
 * O fecho, que é o apoio encostado à direita.
 *
 * O alinhamento sai de `text-right` mais o `w-fit` do `h1`, e não de um
 * recuo calculado. O `w-fit` faz o `h1` encolher até a largura do maior
 * filho, que é sempre a linha do meio: "ACENDE" ocupa 2,24 vezes o próprio
 * corpo e "SUA FOME" ocupa 2,91 vezes o dele, e a razão entre os dois corpos
 * nunca chega perto de 2,91/2,24, nem no piso do `clamp`, que é onde ela é
 * mais apertada (2,55). Então a borda direita do `h1` é a borda direita do
 * "ACENDE", e encostar o fecho nela alinha os dois.
 *
 * Um recuo em `em` não serviria: o afastamento vale
 * `2,24 · corpoDominante - 1,54 · corpoApoio`, e a razão entre os dois corpos
 * muda conforme qual trecho do `clamp` está ativo, 3,48 no `vw` e no teto,
 * 2,55 no piso. Um número só desalinharia em alguma faixa, e as três faixas
 * mudam de lugar a cada ajuste de escala.
 */
const FECHO = APOIO + " text-right";

/**
 * Corpo da linha 2, a palavra dominante.
 *
 * É a única linha em Hanken Grotesk. As outras duas seguem na Owners, que a
 * página 3 do moodboard chama de "Principal", com a Hanken de "Apoio". A
 * inversão aqui é deliberada e veio do cliente.
 *
 * A troca de família obrigou a refazer os três números, e não só a trocar a
 * classe: a Owners XNarrow é condensada e a Hanken não é. Medido no
 * navegador, "ACENDE" ocupa 3,77 vezes o próprio corpo na Hanken 900 contra
 * 2,24 na Owners XNarrow Black, ou seja, 68% mais largo no mesmo corpo. Sem
 * baixar a escala, a palavra estouraria todas as paredes de uma vez.
 *
 * São duas regras, e não uma, porque abaixo e acima do `lg` o título vive em
 * layouts diferentes: empilhado, com a coluna inteira à disposição, e em duas
 * colunas, dividindo a largura com a foto. Uma regra só teria que atender a
 * parede mais dura nas duas faixas, e medido isso custava 26% de corpo entre
 * 620px e 1000px, onde parede nenhuma existe.
 *
 * O `min(11.5vw,19vh)` da regra do `lg` resolve duas paredes que puxam para
 * lados opostos, e nenhuma das duas é onde se procuraria.
 *
 * A parede de largura não é a tela larga: é `1024px`, onde o `lg` entra e a
 * coluna do texto despenca de `100%` para `52%`. Medido ali: o texto começa
 * em 24px e a foto em 512px, então sobram 488px úteis, não os 507px da
 * coluna, que já invade a foto em 20px. Com o fator 3,77 o teto em 1024px é
 * 129px de corpo. Em 1440px, com o contêiner centralizado, sobram 616px e o
 * teto sobe para 163px. Um teto fixo teria que atender o pior caso e
 * desperdiçaria corpo na tela larga, que é onde o herói é mais visto. Os
 * `11.5vw` acompanham essa parede: ela vale `(0,5v - 24) / 3,77`, quase uma
 * reta, e sobra de 5% a 9% de folga.
 *
 * A parede de altura é o botão do WhatsApp, que hoje mora encaixado na
 * terceira linha: tudo que cresce aqui empurra o bloco para baixo. Os `19vh`
 * amarram o título à altura da janela, e são os `32vh` da versão em Owners
 * convertidos pelo mesmo fator, para o comportamento em janela baixa ficar
 * igual ao que já estava medido.
 *
 * O teto de `9.5rem` para em 152px, que dá 573px de palavra, exatamente a
 * largura que a Owners ocupava em `16rem`. A composição não mudou de tamanho,
 * só de desenho.
 */
const DOMINANTE =
  "block font-corpo font-black leading-[.92] tracking-[-.02em] text-brasa " +
  "text-[clamp(4.15rem,16vw,7.75rem)] lg:text-[clamp(4.15rem,min(11.5vw,19vh),9.5rem)]";

/**
 * O título do herói em três linhas, uma palavra por linha, alinhadas à
 * esquerda: a abertura em cima, o foco grande e vermelho no meio, o fecho
 * embaixo. O vermelho fica só no foco; abertura e fecho herdam o carvão.
 *
 * É um `h1` só, com três spans em `block`. Não são três títulos separados
 * nem `<br>`: para leitor de tela e para buscador isto precisa continuar
 * sendo a frase "Sua fome acende aqui.", inteira, num heading só.
 *
 * O `{" "}` no fim das duas primeiras linhas é o que garante isso, e não é
 * enfeite. O JSX descarta o espaço em branco entre expressões irmãs, então
 * sem ele o `textContent` do `h1` sai grudado, "Sua fomeacendeaqui.", que é
 * o que o buscador lê e o que alimenta o nome acessível. Visualmente o
 * espaço não custa nada: ele cai no fim de uma linha de bloco, onde o
 * navegador colapsa espaço à toa. Tem teste de e2e cobrando a frase inteira.
 *
 * Os corpos são `clamp` absolutos, e não múltiplos em `em` do `h1` como
 * antes. Por isso o `h1` não declara mais `font-size` nem `line-height`: com
 * cada span mandando no próprio corpo, o que ficasse lá seria letra morta e
 * enganaria quem fosse ajustar a escala depois.
 *
 * Nenhuma linha carrega `font-weight`. A Owners XNarrow servida tem uma face
 * só, Black, então o peso já é o máximo disponível e pedir mais só
 * convidaria o navegador a engordar o traço por conta.
 *
 * Quem decide qual palavra é qual é `partesDoTitulo`, em lib/tituloHero.ts,
 * porque a regra é testável e este componente não é.
 */
function TituloHero({ texto }: { texto: string }) {
  const { abertura, foco, fecho } = partesDoTitulo(texto);

  return (
    <>
      {abertura && <span className={APOIO}>{abertura}{" "}</span>}
      {foco && <span className={DOMINANTE}>{foco}{" "}</span>}
      {fecho && <span className={FECHO}>{fecho}</span>}
    </>
  );
}

/**
 * Controles da costura, entregues ao CSS como custom properties.
 *
 * Os valores vivem em `AJUSTES` (lib/costura.ts) e a geometria em si é regra
 * de estilo (`.costura-chama`, em app/globals.css). O componente só faz a
 * ponte: assim dá para reajustar a borda mexendo num objeto só, sem abrir
 * nem o CSS nem esta JSX.
 */
const VARIAVEIS = {
  "--costura-mascara": mascaraChama("borda"),
  "--costura-mascara-topo": mascaraChama("topo"),
  "--costura-escala": String(AJUSTES.escala),
  "--costura-altura": AJUSTES.altura,
  "--costura-escala-mobile": String(AJUSTES.mobile.escala),
  "--costura-lado-mobile": AJUSTES.mobile.lado,
  "--costura-altura-mobile": AJUSTES.mobile.altura,
} as CSSProperties;

export async function Hero() {
  const [c, horarios] = await Promise.all([getConteudo(), getHorarios()]);
  const resumo = agruparHorarios(horarios).filter((f) => f.texto !== FECHADO);

  return (
    <section className="relative overflow-hidden" style={VARIAVEIS}>
      {/* `lg:py-4` não é aperto de respiro, é o que segura o CTA acima da
          dobra em notebook baixo, e ele custa zero no caso comum.

          Com `justify-center` dentro de um `min-height`, o padding se anula
          na conta da posição: o topo do conteúdo fica em
          `p + (altura - 2p - conteúdo) / 2`, que é `altura/2 - conteúdo/2`,
          sem `p` nenhum. Medido: em 1440x900 o botão termina em 705px com
          padding de 64, 32 ou 16px, os três. Em janela alta, portanto, este
          valor não move nada, e o respiro que se vê ali vem da
          centralização, não daqui.

          Quando o conteúdo transborda o `min-height`, a centralização deixa
          de valer e o topo passa a ser o próprio padding. É só nesse caso que
          o número aparece, e é exatamente o caso em que faltava espaço: com
          `py-16` o botão terminava em 679px, o que o escondia num notebook
          1366x768, cujo viewport fica em torno de 641px depois da barra do
          navegador. Em `lg:py-4` ele termina em 631px e cabe.

          O mobile fica em `py-16`: lá a foto vem em fluxo logo abaixo do
          texto e o respiro maior é o que separa os dois. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col justify-center px-6 py-16 lg:min-h-[calc(100dvh-74px)] lg:py-4">
        {/* `--corpo-apoio` mora aqui, e não no `APOIO`, porque dois elementos
            precisam do mesmo número: o corpo das linhas 1 e 3 do título e a
            altura da faixa onde o botão se encaixa, logo abaixo. */}
        <div className="[--corpo-apoio:clamp(2.75rem,9.5vw,3.75rem)] lg:[--corpo-apoio:clamp(2.75rem,min(5.75vw,9.2vh),4.6rem)] lg:max-w-[52%]">
          <p className="text-[.72rem] uppercase tracking-[.2em] text-creme-texto">
            Angra dos Reis · Chopperia | Carnes
          </p>
          <h1 className="mt-4 w-fit font-display uppercase">
            <TituloHero texto={c.heroTitulo} />
          </h1>

          {/* O botão sobe para dentro da última linha do título, no vão que o
              fecho deixou ao encostar na direita. A faixa tem exatamente a
              altura dessa linha, `1.1 * --corpo-apoio`, que é o `line-height`
              dela, e o recuo negativo é o mesmo número, então o botão ocupa a
              linha em vez de vir depois dela. O `items-center` o centra na
              faixa, e como os dois valores saem da mesma variável, mexer na
              escala do título continua alinhando os dois sozinho.

              Só a partir de `sm`. Medido: abaixo de uns 450px de viewport o
              vão entre a esquerda do "ACENDE" e o "AQUI." fica menor que o
              próprio botão, então ali ele volta a ser um bloco em fluxo.

              O botão vem antes do subtítulo no DOM, e não só na tela: com
              `order` do flex a ordem de leitura ficaria diferente da ordem
              visual, que é o tipo de descasamento que leitor de tela paga. */}
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-[calc(-1.1*var(--corpo-apoio))] sm:h-[calc(1.1*var(--corpo-apoio))]">
            <Botao href={c.whatsappUrl} variante="escuro">Pedir no WhatsApp</Botao>
          </div>

          <p className="mt-6 max-w-[46ch] text-lg text-creme-texto">{c.heroSubtitulo}</p>

          {/* Grade, e não flex-wrap: as três faixas somam 586px numa coluna de
              641px e só cabem numa linha se o vão encolher, com 7px de folga.
              Bastaria o dono cadastrar "14h às 22h30" no painel para a linha
              estourar e sobrar um dia órfão embaixo. Em duas colunas o bloco
              fica alinhado em qualquer largura e aguenta o texto crescer.

              O @ do Instagram saiu daqui: era a terceira aparição dele na
              página (rodapé e "Onde estamos", esta como link de verdade), não
              era clicável, e era ele que emparelhava rede social com horário
              na mesma linha. */}
          <div className="mt-9 grid gap-x-8 gap-y-2 border-t border-creme-borda pt-6 text-[.78rem] uppercase tracking-[.11em] text-creme-texto sm:grid-cols-2">
            {resumo.map((f) => <span key={f.label}>{f.label} · {f.texto}</span>)}
          </div>
        </div>
      </div>

      {/* A foto sangra até a borda direita e a esquerda dela é recortada pela
          chama da logo. No mobile ela fica em fluxo, abaixo do texto, e a
          costura gira: a chama sobe do topo da foto em direção ao título.
          Depois do texto no DOM de propósito, é a ordem de leitura no
          mobile; no desktop o posicionamento absoluto ignora a ordem. */}
      <div
        className="costura-chama relative aspect-square w-full lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-auto lg:left-[var(--costura-inicio)]"
        style={{ "--costura-inicio": AJUSTES.inicioDaFoto } as CSSProperties}
      >
        <picture>
          <source type="image/avif" srcSet={AVIF} sizes={TAMANHOS} />
          <source type="image/webp" srcSet={WEBP} sizes={TAMANHOS} />
          {/*
            <img> em vez de next/image de propósito. O next/image traz um
            componente de cliente que subiu a primeira carga de 122 kB para
            127 kB, contra um orçamento de 130 kB, caro para uma única foto
            estática. Assim os arquivos saem direto do CDN, sem passar pelo
            otimizador da Vercel, que acrescenta latência na primeira
            requisição justamente do elemento candidato a LCP.
          */}
          <img
            src="/fachada-nbrasa-1600.jpg"
            alt="Fachada do N'Brasa na Av. Júlio Maria ao entardecer, com o letreiro iluminado sobre a entrada"
            width={1600}
            height={1684}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: AJUSTES.recorteDaFoto,
              // o borrão fica no próprio <img>: enquanto o arquivo não chega,
              // é ele que preenche a área já recortada pela chama.
              backgroundImage: `url("${BORRAO_FACHADA}")`,
              backgroundSize: "cover",
              backgroundPosition: AJUSTES.recorteDaFoto,
            }}
          />
        </picture>

        {/* Fica DEPOIS do <picture> no DOM: o vídeo é posicionado absoluto
            por cima da foto, e a foto continua sendo o elemento candidato a
            LCP. Se o vídeo nunca montar, o que se vê é exatamente o herói de
            antes. O recorte é o mesmo da foto para a troca de um pelo outro
            não deslocar o enquadramento. */}
        <VideoFachada
          poster="/fachada-nbrasa-1600.jpg"
          recorte={AJUSTES.recorteDaFoto}
        />
      </div>
    </section>
  );
}

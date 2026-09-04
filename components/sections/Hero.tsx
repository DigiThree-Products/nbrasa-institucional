import type { CSSProperties } from "react";
import { getConteudo, getHorarios } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { AJUSTES, mascaraChama } from "@/lib/costura";
import { partesDoTitulo } from "@/lib/tituloHero";
import { Botao } from "@/components/ui/Botao";

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
 * O título do herói em três corpos: a abertura pequena na primeira linha, o
 * foco grande e vermelho na segunda, e o fecho, o menor dos três, ao lado do
 * foco. O vermelho fica só no foco; o fecho herda o carvão do `h1`, e é por
 * isso que `text-brasa` está no span de dentro e não no bloco da linha.
 *
 * Os tamanhos são múltiplos em `em` do `clamp` que o `h1` já declara, e não
 * valores próprios: assim as três partes continuam crescendo juntas em
 * qualquer largura, com um número só governando a escala do bloco inteiro.
 *
 * Foco e fecho ficam inline no mesmo bloco de propósito. É isso que alinha os
 * dois pela linha de base, de graça, mesmo com um tendo mais que o dobro do
 * corpo do outro; empilhados em blocos seria preciso acertar a base à mão.
 *
 * Quem decide qual palavra é qual é `partesDoTitulo`, em lib/tituloHero.ts,
 * porque a regra é testável e este componente não é.
 */
function TituloHero({ texto }: { texto: string }) {
  const { abertura, foco, fecho } = partesDoTitulo(texto);

  return (
    <>
      {abertura && <span className="block text-[.7em]">{abertura}</span>}
      <span className="block">
        <span className="text-[1.15em] text-brasa">{foco}</span>
        {fecho && <>{" "}<span className="text-[.42em]">{fecho}</span></>}
      </span>
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
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col justify-center px-6 py-16 lg:min-h-[calc(100dvh-74px)]">
        <div className="lg:max-w-[52%]">
          <p className="text-[.72rem] uppercase tracking-[.2em] text-creme-texto">
            Angra dos Reis · Chopperia | Carnes
          </p>
          <h1 className="mt-4 text-balance font-display text-[clamp(3.2rem,9.2vw,7.6rem)] uppercase leading-[.86]">
            <TituloHero texto={c.heroTitulo} />
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-creme-texto">{c.heroSubtitulo}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Botao href={c.whatsappUrl}>Pedir no WhatsApp</Botao>
          </div>

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
      </div>
    </section>
  );
}

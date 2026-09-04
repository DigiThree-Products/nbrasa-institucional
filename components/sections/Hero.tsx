import type { CSSProperties } from "react";
import { getConteudo, getHorarios } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
import { AJUSTES, mascaraChama } from "@/lib/costura";
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
 * Quebra `heroTitulo` em duas linhas com a última palavra destacada em
 * `text-brasa`, a apresentação exata do mockup ("A fome" / "acende
 * aqui."), mas dirigida pelas palavras do dado, não hardcoded na JSX.
 * Assim o painel de admin continua podendo trocar o texto do herói: a
 * última palavra sempre ganha o destaque, e o resto se distribui em duas
 * linhas de tamanho parecido, reproduzindo a quebra atual para o texto de
 * hoje sem prender o componente a um título de 4 palavras específico.
 */
function TituloHero({ texto }: { texto: string }) {
  const palavras = texto.trim().split(/\s+/);
  const destaque = palavras.at(-1) ?? "";
  const resto = palavras.slice(0, -1);
  const meio = Math.ceil(resto.length / 2);
  const linha1 = resto.slice(0, meio).join(" ");
  const linha2 = resto.slice(meio).join(" ");

  return (
    <>
      {linha1}
      {linha1 && <br />}
      {linha2 && `${linha2} `}
      <span className="text-brasa">{destaque}</span>
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
          <p className="text-[.72rem] uppercase tracking-[.2em] text-cinza">
            Angra dos Reis · Chopperia | Carnes
          </p>
          <h1 className="mt-4 text-balance font-display text-[clamp(3.2rem,9.2vw,7.6rem)] uppercase leading-[.86]">
            <TituloHero texto={c.heroTitulo} />
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg text-cinza">{c.heroSubtitulo}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Botao href={c.whatsappUrl}>Pedir no WhatsApp</Botao>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 border-t border-fumaca pt-6 text-[.78rem] uppercase tracking-[.11em] text-cinza">
            {resumo.map((f) => <span key={f.label}>{f.label} · {f.texto}</span>)}
            <span>{c.instagram}</span>
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

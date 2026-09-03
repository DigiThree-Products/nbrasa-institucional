import { getConteudo, getHorarios } from "@/lib/conteudo";
import { agruparHorarios, FECHADO } from "@/lib/horarios";
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
 * Duas larguras cobrem todos os casos: no desktop o slot fica em ~500 px CSS
 * (medido: 511 px num viewport de 1440), e no mobile ocupa a largura
 * toda. 1400 px atende o pior caso, que é o mobile em tela 2x.
 */
const TAMANHOS = "(min-width: 1024px) 36vw, 100vw";
const AVIF = "/fachada-nbrasa-800.avif 800w, /fachada-nbrasa-1400.avif 1400w";
const WEBP = "/fachada-nbrasa-800.webp 800w, /fachada-nbrasa-1400.webp 1400w";

/**
 * Quebra `heroTitulo` em duas linhas com a última palavra destacada em
 * `text-brasa` — a apresentação exata do mockup ("A fome" / "acende
 * aqui.") — mas dirigida pelas palavras do dado, não hardcoded na JSX.
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

export async function Hero() {
  const [c, horarios] = await Promise.all([getConteudo(), getHorarios()]);
  const resumo = agruparHorarios(horarios).filter((f) => f.texto !== FECHADO);

  return (
    <section className="flex min-h-[calc(100dvh-74px)] items-center">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div>
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

        {/* Recorte 4:3.2 centrado no letreiro, feito no arquivo — o original é
            retrato 4892x7732 e serviria 6x mais pixels do que o slot ocupa.
            O borrão vai como background do contêiner, então a área nunca
            aparece vazia enquanto a foto carrega. */}
        <div
          className="relative aspect-[4/3.2] rotate-2 overflow-hidden rounded-[26px] border-[3px] border-fumaca bg-fumaca bg-cover bg-center shadow-[0_30px_70px_rgba(0,0,0,.55)]"
          style={{ backgroundImage: `url("${BORRAO_FACHADA}")` }}
        >
          <picture>
            <source type="image/avif" srcSet={AVIF} sizes={TAMANHOS} />
            <source type="image/webp" srcSet={WEBP} sizes={TAMANHOS} />
            {/*
              <img> em vez de next/image de propósito. O next/image traz um
              componente de cliente que subiu a primeira carga de 122 kB para
              127 kB, contra um orçamento de 130 kB — caro para uma única foto
              estática. Assim os arquivos saem direto do CDN, sem passar pelo
              otimizador da Vercel, que acrescenta latência na primeira
              requisição justamente do elemento candidato a LCP.
              As variantes de public/ vêm de scripts/gerar-fachada.py, que
              guarda o ponto de corte e as qualidades usadas.
            */}
            <img
              src="/fachada-nbrasa-1400.jpg"
              alt="Fachada do N'Brasa na Av. Júlio Maria ao entardecer, com o letreiro iluminado sobre a entrada"
              width={1400}
              height={1120}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        </div>
      </div>
      </div>
    </section>
  );
}

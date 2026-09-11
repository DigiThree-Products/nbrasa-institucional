import { getConteudo, getHorarios, getProgramacao } from "@/lib/conteudo";
import { diasAbertos, horarioDosDias } from "@/lib/horarios";
import { D_SILHUETA } from "@/lib/marca";
import { atrasoNaChama } from "@/lib/brasa";
import { Reveal } from "@/components/motion/Reveal";
import { AcendeEmBrasa } from "@/components/motion/AcendeEmBrasa";

/**
 * viewBox da silhueta (100×116) com 3 unidades de folga de cada lado.
 *
 * A folga existe porque aqui a chama é **contornada**, não preenchida: um
 * traço centrado na borda derrama metade da sua espessura para fora do path,
 * e no viewBox cru essa metade sairia cortada no bico e nos flancos.
 */
const VIEWBOX_CHAMA = "-3 -3 106 122";

/**
 * Espessura do contorno, em unidades do viewBox. Escala junto com o card, que
 * é o que se quer: chama menor, traço mais fino, na mesma proporção.
 */
const TRACO_DA_CHAMA = 2.4;

/**
 * Caixa de texto dentro da barriga da chama, em porcentagem do quadro.
 *
 * A barriga é uma elipse de centro (50, 74) e semieixos 44 e 39 no viewBox
 * cru, e estes números são um retângulo que cabe dentro dela com folga. Mexer
 * na silhueta ou na folga do viewBox obriga a remedir: o texto não avisa
 * quando encosta na curva, ele só fica feio.
 */
const CAIXA_DO_TEXTO = "inset-x-[15%] top-[45%] bottom-[7%]";

export async function HorariosProgramacao() {
  const [c, horarios, prog] = await Promise.all([
    getConteudo(), getHorarios(), getProgramacao(),
  ]);
  const abertos = diasAbertos(horarios);

  return (
    <section id="programacao" className="flex min-h-dvh items-center">
      {/*
       * `w-full` não é enfeite: a `section` é `flex`, então este div é item de
       * flex e sem largura declarada ele encolhe até o conteúdo, em vez de
       * chegar nos 1280. Com os cards limitados a 300px cada, a fileira de
       * quatro parava em 820px e as chamas saíam 100px mais estreitas do que
       * deviam. Estava latente desde antes: a grade de duas colunas era larga
       * o bastante para o defeito não aparecer.
       */}
      <div className="mx-auto w-full max-w-[1280px] px-6 py-20">
        {/*
         * Um título só para a seção, desde 2026-09-10, a pedido do cliente:
         * ela abria com dois `h2` lado a lado e eles competiam. Quem sobrou é
         * o do banco, `horariosTitulo`, porque assim o painel de admin
         * continua podendo trocar a frase e o teste da Owners cobre o texto
         * sozinho, por ele vir do seed.
         *
         * A quebra de linha é do navegador, não há `<br>` aqui. A frase vem
         * do banco e pode mudar de comprimento sem que ninguém volte na JSX;
         * `text-balance` reparte as linhas quando ela não couber numa só, o
         * que acontece da faixa de telefone para baixo.
         */}
        {/*
         * O display da seção acende como brasa que vira letra, desde
         * 2026-09-11: o texto nasce brasa fosca, entra em chamas e assenta na
         * cor de repouso. O cliente escolheu o gesto vendo, num mockup.
         *
         * **Ele substituiu a queima, e por custo medido.** A queima subia uma
         * linha de fogo por dentro de cada glifo, letra a letra, e rolando por
         * esta seção media 62,4 ms por quadro contra 16,7 ms do trecho de
         * controle na Delivery, com 91% dos quadros acima de 20 ms. O custo é
         * linear no número de elementos animados, então o gesto novo é de
         * BLOCO: um elemento por texto. A tabela inteira está em
         * `lib/brasa.ts`.
         *
         * A divisão de papéis é a de sempre: **fogo só no display**, que é o
         * título da seção e os quatro títulos de evento. Subtítulo, rótulos de
         * dia e horas vão no `Reveal`, porque em corpo de 11px o gesto de fogo
         * lê como sujeira. O contorno da chama de cada card continua no
         * `Reveal` com `saida`, e entra antes do texto que vai dentro dela.
         */}
        <AcendeEmBrasa>
          <h2 className="text-balance font-display text-[clamp(2.82rem,6.87vw,5.4rem)] uppercase leading-[.86]">
            {c.horariosTitulo}
          </h2>
        </AcendeEmBrasa>

        {/*
         * O subtítulo diz quais dias a casa abre, e é o que dá lugar à
         * segunda-feira desde que a lista de horários saiu daqui: ela é o
         * único dia fechado e não tem card de programação nenhum.
         *
         * Os dias saem de `diasAbertos`, e não de texto escrito aqui, porque
         * a frase afirma um fato que mora no banco: escrita à mão, ela
         * passaria a mentir no dia em que o dono abrisse na segunda pelo
         * painel. Sem nenhum dia aberto a função devolve vazio e o parágrafo
         * inteiro some, em vez de sobrar um "Abrimos de" solto.
         *
         * Fonte de corpo, não display: "terça" e "sábado" têm acento e a
         * Owners trial não desenha acento nenhum.
         */}
        {abertos !== "" && (
          /* O `Reveal` é um `div`, então ele embrulha o parágrafo em vez de
             morar dentro dele: `p` não pode conter `div`, e o navegador
             fecharia o parágrafo sozinho no meio da frase. É o mesmo arranjo
             que o subtítulo das avaliações já usa. */
          <Reveal saida delay={0.09}>
            <p className="mt-4 text-[clamp(1rem,2.1vw,1.32rem)] text-creme-texto">
              {`Abrimos de ${abertos}.`}
            </p>
          </Reveal>
        )}

        {/*
         * Os cards são a chama contornada, a pedido do cliente em 2026-09-10,
         * a partir de uma referência de "contorno de fogo" alternando
         * vermelho e preto.
         *
         * A forma é `D_SILHUETA`, a mesma que recorta a foto do herói e que
         * faz a beirada da reserva do Cardápio. **Não** é a marca:
         * `D_CHAMA_OFICIAL` são três pinceladas separadas, que contornadas
         * virariam fitas soltas e não teriam barriga onde pôr texto. O
         * comentário de `lib/marca.ts` explica por que as duas não se
         * misturam.
         *
         * O vermelho e o preto alternam pela posição no array, então quem
         * reordenar a programação no painel troca as cores junto. É de
         * propósito: o que importa é alternar, não qual evento é vermelho.
         *
         * Uma linha por vez no telefone, duas em tablet e as quatro numa
         * fileira só a partir de 1024. A chama é bem mais alta que larga, e
         * duas colunas de chama em tela estreita deixariam o título menor que
         * o mínimo legível dentro da barriga.
         */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {prog.map((p, i) => {
            const hora = horarioDosDias(horarios, p.dias);
            const vermelho = i % 2 === 0;

            /*
             * Cascata: o contorno da chama entra, e os três degraus de texto
             * acendem atrás dele.
             *
             * A conta mora em `lib/brasa.ts` porque este atraso SOMA com a
             * duração do gesto, e é o total que tem orçamento. Ele já começou
             * em 0,18 s, tempo morto que ninguém pediu, e o pior caso da
             * seção é a hora da quarta chama. `brasa.test.ts` cobra os dois.
             */
            const atraso = (degrau: number) => atrasoNaChama(i, degrau);

            return (
              /*
               * `container-type: inline-size` é o que faz o texto encolher
               * junto com a chama: as medidas abaixo estão em `cqw`, que é
               * porcentagem da largura DESTE card, e não da janela. Sem
               * ele o `cqw` cai na janela e o texto de um card de 232px em
               * 1024 sai do mesmo tamanho que o de um card de 300px.
               *
               * Escrito em `style` porque é medida, e não decisão de
               * design: o mesmo motivo pelo qual a perspectiva da espiral
               * do Cardápio mora no componente.
               */
              <article
                key={p.id}
                className="relative mx-auto w-full max-w-[300px]"
                style={{ containerType: "inline-size" }}
              >
                {/* O `Reveal` embrulha só o SVG, e não o card inteiro: se
                    embrulhasse tudo, a opacidade dele multiplicaria a das
                    letras e o acender sairia lavado. */}
                <Reveal saida delay={atraso(0)}>
                  <svg
                    viewBox={VIEWBOX_CHAMA}
                    aria-hidden="true"
                    className={`block h-auto w-full ${vermelho ? "text-brasa" : "text-carvao"}`}
                  >
                    <path
                      d={D_SILHUETA}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={TRACO_DA_CHAMA}
                      strokeLinejoin="round"
                    />
                  </svg>
                </Reveal>

                <div className={`absolute ${CAIXA_DO_TEXTO} flex flex-col items-center justify-center gap-[2.2cqw] text-center`}>
                  {/* Rótulo e horário em brasa-escura no card vermelho:
                      `brasa` puro reprova AA em texto pequeno, e é a mesma
                      troca que todo rótulo pequeno do site já faz. */}
                  <Reveal
                    saida
                    className={`text-[clamp(.62rem,4cqw,.82rem)] font-extrabold uppercase leading-tight tracking-[.14em] ${vermelho ? "text-brasa-escura" : "text-creme-texto"}`}
                    delay={atraso(1)}
                  >
                    {p.diasLabel}
                  </Reveal>
                  {/*
                   * A cor de repouso mora no ELEMENTO ANIMADO, e não no `h3`.
                   * O gesto anima `color`, e filho com classe de cor própria
                   * não herda: com `text-carvao` no `h3`, o título assentaria
                   * na cor errada e nada lançaria.
                   */}
                  <AcendeEmBrasa className="text-carvao" delay={atraso(2)}>
                    <h3 className="font-display text-[clamp(1rem,8.6cqw,1.7rem)] uppercase leading-[1.02]">
                      {p.titulo}
                    </h3>
                  </AcendeEmBrasa>
                  {hora !== null && (
                    <Reveal
                      saida
                      className={`text-[clamp(.85rem,6.2cqw,1.25rem)] font-extrabold tabular-nums ${vermelho ? "text-brasa-escura" : "text-creme-texto"}`}
                      delay={atraso(3)}
                    >
                      {hora}
                    </Reveal>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

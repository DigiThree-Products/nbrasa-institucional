import { describe, it, expect } from "vitest";
import { montarSchemaRestaurant } from "@/components/seo/DadosEstruturados";
import { conteudoSeed, horariosSeed } from "@/lib/conteudo.seed";

const schema = montarSchemaRestaurant(conteudoSeed, horariosSeed) as any;

describe("montarSchemaRestaurant", () => {
  it("declara o tipo Restaurant", () => {
    expect(schema["@type"]).toBe("Restaurant");
  });

  it("inclui o endereço completo", () => {
    expect(schema.address).toMatchObject({
      streetAddress: "Av. Júlio Maria, 235 — Centro",
      postalCode: "23900-504",
      addressCountry: "BR",
    });
  });

  it("omite os dias fechados do horário", () => {
    const dias = schema.openingHoursSpecification.flatMap((s: any) => s.dayOfWeek);
    expect(dias).not.toContain("Monday");
  });

  it("omite um dia marcado fechado mesmo com horário preenchido", () => {
    const diaFechadoComHorario = [
      { diaSemana: 3, abre: "14:00", fecha: "22:00", fechado: true, ordem: 1 },
    ];
    const schemaFixture = montarSchemaRestaurant(conteudoSeed, diaFechadoComHorario) as any;
    expect(schemaFixture.openingHoursSpecification).toHaveLength(0);
  });

  it("declara sábado abrindo 16:00 e fechando 03:00", () => {
    const sab = schema.openingHoursSpecification
      .find((s: any) => s.dayOfWeek.includes("Saturday"));
    expect(sab).toMatchObject({ opens: "16:00", closes: "03:00" });
  });
});

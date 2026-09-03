import type { Conteudo, Horario } from "./conteudo.tipos";

const DIAS_SCHEMA = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Monta o schema.org/Restaurant a partir do conteúdo e dos horários. Lógica
 *  pura, sem JSX — mora em lib/ para que o teste unitário não precise
 *  importar um módulo de componente só para alcançá-la. */
export function montarSchemaRestaurant(c: Conteudo, horarios: Horario[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "N'Brasa Angra",
    servesCuisine: ["Hambúrguer", "Churrasco", "Petiscos"],
    priceRange: "$$",
    telephone: `+55${c.telefone.replace(/\D/g, "")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: c.endereco,
      addressLocality: "Angra dos Reis",
      addressRegion: "RJ",
      postalCode: c.cep,
      addressCountry: "BR",
    },
    openingHoursSpecification: horarios
      .filter((h) => !h.fechado && h.abre && h.fecha)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [DIAS_SCHEMA[h.diaSemana]],
        opens: h.abre,
        closes: h.fecha,
      })),
  };
}

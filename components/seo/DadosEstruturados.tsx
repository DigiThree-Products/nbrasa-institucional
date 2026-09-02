import { getConteudo, getHorarios } from "@/lib/conteudo";
import type { Conteudo, Horario } from "@/lib/conteudo.tipos";

const DIAS_SCHEMA = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

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

export async function DadosEstruturados() {
  const [c, horarios] = await Promise.all([getConteudo(), getHorarios()]);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(montarSchemaRestaurant(c, horarios)),
      }}
    />
  );
}

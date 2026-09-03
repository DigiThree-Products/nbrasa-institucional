import { getConteudo, getHorarios } from "@/lib/conteudo";
import { montarSchemaRestaurant } from "@/lib/schemaRestaurant";

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

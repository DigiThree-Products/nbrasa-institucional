import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { TAGS } from "@/lib/conteudo";

const VALIDAS = new Set<string>(Object.values(TAGS));

export async function POST(req: Request) {
  const segredo = process.env.REVALIDATE_SECRET;
  if (!segredo) {
    return NextResponse.json({ erro: "REVALIDATE_SECRET não configurado" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const { tag } = await req.json().catch(() => ({ tag: undefined }));
  if (typeof tag !== "string" || !VALIDAS.has(tag)) {
    return NextResponse.json(
      { erro: `tag inválida; use uma de: ${[...VALIDAS].join(", ")}` },
      { status: 400 },
    );
  }
  revalidateTag(tag);
  return NextResponse.json({ revalidado: tag });
}

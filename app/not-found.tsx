import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
      <h1 className="font-display text-5xl uppercase">Página não encontrada</h1>
      <p className="mt-4 text-creme-texto">O link que você abriu não existe por aqui.</p>
      <Link href="/"
            className="mt-8 inline-block rounded-full bg-brasa px-6 py-3 font-bold uppercase tracking-widest text-branco">
        Voltar para a home
      </Link>
    </main>
  );
}

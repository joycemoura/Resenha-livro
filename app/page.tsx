import { notFound, redirect } from "next/navigation";
import { listReadings } from "@/lib/catalogo";
import caderno from "@/caderno.json";
import { examplePages } from "./example-pages";
import { OpenBook } from "./open-book";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

export default async function Home({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const requested = query.leitura;

  if (requested !== undefined && (typeof requested !== "string" || requested.length > 100)) {
    notFound();
  }

  if (requested === undefined) {
    const filters = new URLSearchParams();

    for (const key of ["busca", "genero", "ano", "nota"]) {
      if (typeof query[key] === "string" && query[key]) {
        filters.set(key, query[key]);
      }
    }

    if (filters.size) redirect(`/indice?${filters}`);
  }

  const readings = await listReadings();
  const entries = readings.length ? readings : examplePages;
  const position = requested ? entries.findIndex(({ id }) => id === requested) : 0;

  if (position < 0) notFound();

  const sheet = typeof query.folha === "string" ? Number(query.folha) : 1;
  const part = Number.isSafeInteger(sheet) && sheet > 0 ? sheet - 1 : 0;

  return (
    <OpenBook
      title={caderno.titulo}
      readings={entries}
      position={position}
      part={part}
      examples={!readings.length}
    />
  );
}
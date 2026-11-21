import type { Metadata } from "next";
import { listReadings } from "@/lib/catalogo";
import caderno from "@/caderno.json";
import { examplePages } from "@/app/example-pages";
import { IndexBook, type Filters } from "./index-book";

export const metadata: Metadata = { title: "Índice" };
export const dynamic = "force-dynamic";

export default async function IndexPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const [readings, filters] = await Promise.all([listReadings(), searchParams]);
  const entries = (readings.length ? readings : examplePages).map(({ id, title, author, genre, finishedOn, rating, folio }) => ({ id, title, author, genre, finishedOn, rating, folio }));
  return <IndexBook entries={entries} initial={filters} author={caderno.autora} examples={!readings.length} />;
}

"use client";

import { useEffect, useState } from "react";
import { BookTabs } from "@/app/book-navigation";
import { ratingValues } from "@/app/rating-stars";
import { readingHref, searchKey, type IndexEntry } from "@/lib/readings";

export type Filters = { busca?: string; genero?: string; ano?: string; nota?: string };
const blank = { busca: "", genero: "", ano: "", nota: "" };

export function IndexBook({ entries, initial, author, examples }: {
  entries: IndexEntry[];
  initial: Filters;
  author: string;
  examples: boolean;
}) {
  const genreOptions = [...new Map(entries.filter(({ genre }) => genre).map(
    ({ genre }) => [searchKey(genre), genre] as const,
  )).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const years = [...new Set(entries.filter(({ finishedOn }) => finishedOn).map(({ finishedOn }) => finishedOn.slice(0, 4)))].sort().reverse();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [filters, setFilters] = useState<Required<Filters>>({
    busca: typeof initial.busca === "string" ? initial.busca.slice(0, 160) : "",
    genero: genreOptions.find(([key]) => key === initial.genero)?.[0] ?? "",
    ano: years.find((year) => year === initial.ano) ?? "",
    nota: typeof initial.nota === "string" && /^[1-5]$/.test(initial.nota) ? initial.nota : "",
  });
  const [showFilters, setShowFilters] = useState(Boolean(filters.genero || filters.ano || filters.nota));

  const query = searchKey(filters.busca).trim().split(/\s+/).filter(Boolean);
  const filtered = entries.filter(({ title, author, genre, finishedOn, rating }) =>
    query.every((term) => searchKey(`${title} ${author}`).includes(term)) &&
    (!filters.genero || searchKey(genre) === filters.genero) &&
    (!filters.ano || finishedOn.startsWith(filters.ano + "-")) &&
    (!filters.nota || String(rating) === filters.nota),
  );
  const active = Object.values(filters).some(Boolean);
  const optionCount = [filters.genero, filters.ano, filters.nota].filter(Boolean).length;

  function update(next: Required<Filters>) {
    setFilters(next);
    const url = new URL(window.location.href);
    for (const [name, value] of Object.entries(next)) {
      if (value.trim()) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className="book-shell index-shell">
      <BookTabs active="index" />
      <section className="single-paper editor-page index-page" aria-labelledby="reading-index">
        <p className="leaf-running-head"><span>{examples ? "Resenhas de exemplo" : "Resenhas literárias"}</span><span className="index-author">{author}</span></p>
        <h1 id="reading-index">Índice</h1>
        {entries.length > 0 ? (
          <>
            <form className="filter-form" role="search" method="get" action="/indice" onSubmit={(event) => event.preventDefault()}>
              <div className="search-row">
                <label className="field index-search">
                  <span className="visually-hidden">Buscar por título ou autor</span>
                  <span className="search-mark" aria-hidden="true" />
                  <input type="search" name="busca" readOnly={!ready} maxLength={160}
                    placeholder="Buscar por título ou autor" value={filters.busca}
                    onChange={(event) => update({ ...filters, busca: event.target.value })} />
                </label>
                <button type="button" className="filter-toggle" aria-expanded={showFilters} aria-controls="index-filters" onClick={() => setShowFilters(!showFilters)}>
                  Filtros{optionCount > 0 ? ` (${optionCount})` : ""}
                </button>
              </div>
              <div id="index-filters" className="filter-options" hidden={!showFilters}>
                <label className="field"><span>Gênero</span>
                  <select name="genero" value={filters.genero} onChange={(event) => update({ ...filters, genero: event.target.value })}>
                    <option value="">Todos</option>
                    {genreOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                  </select>
                </label>
                <label className="field"><span>Ano de leitura</span>
                  <select name="ano" value={filters.ano} onChange={(event) => update({ ...filters, ano: event.target.value })}>
                    <option value="">Todos</option>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
                <label className="field"><span>Avaliação</span>
                  <select name="nota" value={filters.nota} onChange={(event) => update({ ...filters, nota: event.target.value })}>
                    <option value="">Todas</option>
                    {ratingValues.map((rating) => <option key={rating} value={rating}>{rating} de 5</option>)}
                  </select>
                </label>
              </div>
              {active && <button type="button" className="text-button clear-filters" onClick={() => update(blank)}>Limpar busca e filtros</button>}
            </form>
            <div className="toc-header">
              <p aria-live="polite">{filtered.length} {filtered.length === 1 ? "resenha" : "resenhas"}</p>
            </div>
            {filtered.length ? (
              <ol className="toc" aria-labelledby="reading-index">
                {filtered.map((entry) => (
                  <li key={entry.id}>
                    <a href={readingHref(entry.id)}>
                      <span className="toc-entry"><strong>{entry.title}</strong><small>{entry.author}</small></span>
                    </a>
                  </li>
                ))}
              </ol>
            ) : <p className="index-empty">Nenhuma resenha corresponde à busca.</p>}
          </>
        ) : (
          <div className="index-empty">
            <p>Nenhuma resenha cadastrada.</p>
          </div>
        )}
      </section>
    </div>
  );
}

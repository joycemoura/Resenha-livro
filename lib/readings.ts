export type IndexEntry = {
  id: string;
  title: string;
  author: string;
  genre: string;
  finishedOn: string;
  rating: number | null;
  folio: number;
};

export type BookPage = IndexEntry & {
  review: string;
  notes: string;
  cover: string;
  frases?: string[];
  example?: "moss" | "wine" | "wood" | "teal";
};

export function searchKey(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

export function validReadingId(id: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id) && id.length <= 100;
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

export function readingHref(id: string, part = 0) {
  const href = `/?leitura=${encodeURIComponent(id)}`;
  return part > 0 ? `${href}&folha=${part + 1}` : href;
}

export function pageNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumIntegerDigits: 2, useGrouping: false }).format(value);
}

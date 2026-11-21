import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { parse } from "yaml";
import { validDate, validReadingId, type BookPage } from "./readings";

const directory = join(process.cwd(), "resenhas");
const coversDirectory = join(process.cwd(), "public", "capas", "enviadas");

type ReviewHeader = {
  titulo?: unknown;
  autor?: unknown;
  genero?: unknown;
  data?: unknown;
  nota?: unknown;
  capa?: unknown;
  frases?: unknown;
  id?: unknown;
};

function parseReview(filename: string, input: string): BookPage {
  function invalid(message: string): never {
    throw new Error(`resenhas/${filename}: ${message}`);
  }

  const fileId = filename.slice(0, -3);
  if (!validReadingId(fileId)) {
    invalid("Use letras minúsculas, números e hífens no nome do arquivo.");
  }

  const match = input.replace(/^\uFEFF/u, "").match(
    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/u,
  );
  if (!match) {
    return invalid("Delimite os dados do livro com duas linhas contendo três hífens.");
  }

  const header = parse(match[1], { maxAliasCount: 0 }) as ReviewHeader | null;
  if (!header || typeof header !== "object" || Array.isArray(header)) {
    return invalid("Preencha os dados do livro.");
  }

  function text(value: unknown, field: string, required = false) {
    if (value == null && !required) return "";
    if (typeof value !== "string" || (required && !value.trim())) {
      return invalid(`Confira o campo ${field}.`);
    }
    return value.trim();
  }

  const title = text(header.titulo, "titulo", true);
  const author = text(header.autor, "autor", true);
  const genre = text(header.genero, "genero");
  const finishedOn = text(header.data, "data");

  if (finishedOn && !validDate(finishedOn)) {
    invalid("Use uma data válida no formato AAAA-MM-DD.");
  }

  const rating = header.nota ?? null;
  if (
    rating !== null &&
    (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    return invalid("A nota deve ser um número inteiro de 1 a 5.");
  }

  const cover = text(header.capa, "capa");
  if (cover && !/^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp)$/iu.test(cover)) {
    invalid("Informe o nome de um arquivo JPG, PNG ou WebP da pasta public/capas.");
  }

  const phraseList = header.frases ?? [];
  if (!Array.isArray(phraseList)) {
    return invalid("Escreva as frases em uma lista.");
  }
  const frases = phraseList.map((phrase) => text(phrase, "frases")).filter(Boolean);

  const id = text(header.id, "id") || fileId;
  if (!validReadingId(id)) invalid("O id deve usar letras minúsculas, números e hífens.");

  const review = match[2].trim();
  if (!review) invalid("Escreva o texto da resenha abaixo dos dados do livro.");

  return { id, title, author, genre, finishedOn, rating, cover, review, frases, notes: "", folio: 0 };
}

async function readPhrases(fileId: string) {
  const input = await readFile(join(directory, "frases", `${fileId}.txt`), "utf8").catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return "";
      throw error;
    },
  );
  return input.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

async function findUploadedCover(fileId: string) {
  const name = `${fileId}.webp`;
  const file = await stat(join(coversDirectory, name)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  return file?.isFile() && file.size > 0 ? `enviadas/${name}` : "";
}

export const listReadings = cache(async () => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );

  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
  const readings = await Promise.all(files.map(async ({ name }) => {
    const reading = parseReview(name, await readFile(join(directory, name), "utf8"));
    const fileId = name.slice(0, -3);
    const [cover, savedPhrases] = await Promise.all([
      findUploadedCover(fileId),
      readPhrases(fileId),
    ]);
    const reviewPhrases = reading.frases ?? [];
    const frases = [
      ...reviewPhrases,
      ...savedPhrases.filter((phrase) => !reviewPhrases.includes(phrase)),
    ];
    return { ...reading, cover: cover || reading.cover, frases };
  }));

  readings.sort((a, b) =>
    b.finishedOn.localeCompare(a.finishedOn) ||
    a.title.localeCompare(b.title, "pt-BR") ||
    a.id.localeCompare(b.id),
  );

  const ids = new Set<string>();
  return readings.map((reading, index) => {
    if (ids.has(reading.id)) throw new Error(`Identificador repetido em resenhas: ${reading.id}`);
    ids.add(reading.id);
    return { ...reading, folio: index + 1 };
  });
});
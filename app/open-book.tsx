"use client";

import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";
import { dateLabel, pageNumber, readingHref, type BookPage } from "@/lib/readings";
import { BookTabs } from "./book-navigation";
import { RatingStars } from "./rating-stars";

type Layout = {
  starts: number[];
  count: number;
  columns: number;
  pitch: number;
};

function measureLayout(flow: HTMLElement): Layout | undefined {
  const bounds = flow.getBoundingClientRect();
  if (!bounds.width) return;

  const style = getComputedStyle(flow);
  const columns = Number(style.columnCount);
  const pitch = (bounds.width + parseFloat(style.columnGap)) / columns;
  const leafAt = (rect: DOMRect) => Math.round((rect.left - bounds.left) / pitch);

  // Cada retângulo representa o trecho de uma resenha em uma folha.
  const fragments = Array.from(flow.children, (review) =>
    Array.from(review.getClientRects()).filter((rect) => rect.height > 0),
  );

  const starts = fragments.map((rects, index) =>
    rects.length ? leafAt(rects[0]) : index,
  );
  const last = fragments.at(-1)?.at(-1);

  return {
    starts,
    count: last ? leafAt(last) + 1 : starts.length,
    columns,
    pitch,
  };
}

export function OpenBook({ readings, position, part, title, examples }: {
  readings: BookPage[];
  position: number;
  part: number;
  title: string;
  examples: boolean;
}) {
  const router = useRouter();
  const book = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const flow = useRef<HTMLDivElement>(null);
  const previous = useRef<string | undefined>(undefined);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [layout, setLayout] = useState<Layout>();

  useLayoutEffect(() => {
    const element = flow.current;
    if (!element) return;

    function measure() {
      if (!element) return;

      const next = measureLayout(element);
      if (!next) return;

      setLayout((current) =>
        current?.count === next.count &&
        current.columns === next.columns &&
        current.pitch === next.pitch &&
        next.starts.every((start, index) => current.starts[index] === start)
          ? current
          : next,
      );
    }

    let frame = 0;

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    measure();

    const observer = new ResizeObserver(schedule);
    observer.observe(element);

    const fonts = document.fonts;
    let disposed = false;

    void fonts.ready.then(() => {
      if (!disposed) schedule();
    });

    fonts.addEventListener("loadingdone", schedule);

    return () => {
      disposed = true;
      observer.disconnect();
      fonts.removeEventListener("loadingdone", schedule);
      cancelAnimationFrame(frame);
    };
  }, [readings]);

  const measured = layout?.starts.length === readings.length ? layout : undefined;
  const starts = measured?.starts ?? readings.map(({ folio }) => folio - 1);
  const total = measured?.count ?? readings.length;
  const columns = measured?.columns ?? 2;
  const reviewStart = starts[position];
  const reviewEnd = starts[position + 1] ?? total;
  const current = reviewStart + Math.min(part, Math.max(0, reviewEnd - reviewStart - 1));
  const first = current - current % columns;
  const last = Math.min(first + columns, total) - 1;

  function getLeaf(index: number) {
    const readingIndex = starts.findLastIndex((start) => start <= index);

    return {
      reading: readings[readingIndex],
      continued: index > starts[readingIndex],
      folio: index + 1,
    };
  }

  function leafHref(index: number) {
    if (index < 0 || index >= total) return;

    const readingIndex = starts.findLastIndex((start) => start <= index);
    return readingHref(readings[readingIndex].id, index - starts[readingIndex]);
  }

  const left = getLeaf(first);
  const right = first + 1 < total ? getLeaf(first + 1) : undefined;
  const prevHref = leafHref(first - columns);
  const nextHref = leafHref(first + columns);
  const range = first === last
    ? pageNumber(first + 1)
    : `${pageNumber(first + 1)}–${pageNumber(last + 1)}`;

  useLayoutEffect(() => {
    const area = windowRef.current;
    if (!area || !flow.current || !measured) return;

    const viewport = area.getBoundingClientRect();

    for (const anchor of flow.current.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const visible = Array.from(anchor.getClientRects()).some((rect) =>
        rect.left < viewport.right && rect.right > viewport.left &&
        rect.top < viewport.bottom && rect.bottom > viewport.top,
      );

      if (visible) anchor.removeAttribute("tabindex");
      else anchor.tabIndex = -1;
    }

    const location = `${position}:${part}`;
    const changed = previous.current !== undefined && previous.current !== location;
    previous.current = location;

    if (!changed) return;

    if (book.current && book.current.getBoundingClientRect().top < 0) {
      book.current.scrollIntoView({ block: "start", behavior: "instant" });
    }

    if (
      document.documentElement.dataset.reduceMotion !== "true" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const animation = area.animate(
        [{ opacity: 0.6 }, { opacity: 1 }],
        { duration: 220, easing: "ease-out" },
      );

      return () => animation.cancel();
    }
  }, [first, measured, part, position, readings]);

  const move = useCallback((href?: string) => {
    if (href) router.push(href, { scroll: false });
  }, [router]);

  function follow(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    event.preventDefault();
    move(href);
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || event.defaultPrevented) return;

      if (
        event.target instanceof HTMLElement &&
        event.target.closest("a, button, input, select, textarea, [contenteditable]")
      ) return;

      const href = event.key === "ArrowLeft"
        ? prevHref
        : event.key === "ArrowRight" ? nextHref : undefined;

      if (!href) return;

      event.preventDefault();
      move(href);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move, prevHref, nextHref]);

  function beginSwipe(event: TouchEvent<HTMLElement>) {
    swipeStart.current = null;

    if (columns !== 1 || event.touches.length !== 1) return;
    if (event.target instanceof Element && event.target.closest("a, button")) return;

    const { clientX: x, clientY: y } = event.touches[0];
    swipeStart.current = { x, y };
  }

  function endSwipe(event: TouchEvent<HTMLElement>) {
    const origin = swipeStart.current;
    swipeStart.current = null;

    if (!origin || !event.changedTouches.length) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;

    if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      move(dx < 0 ? nextHref : prevHref);
    }
  }

  return (
    <>
      <header className="section-heading">
        <h1 id="book-title">{title}</h1>
        {examples && <p className="collection-note">Resenhas de exemplo</p>}
      </header>

      <div className="book-shell reader-shell">
        <BookTabs active="book" />

        <section
          ref={book}
          className="book-spread reader-book"
          aria-labelledby="book-title"
          onTouchStart={beginSwipe}
          onTouchEnd={endSwipe}
          onTouchCancel={() => { swipeStart.current = null; }}
        >
          <span className="binding-ribbon" aria-hidden="true" />
          <PaperLeaf side="left" page={left} />
          <PaperLeaf side="right" page={right} />

          <div className="reading-window" ref={windowRef}>
            <div
              className="reading-flow"
              ref={flow}
              style={{ transform: `translateX(${-first * (measured?.pitch ?? 0)}px)` }}
            >
              {readings.map((reading) => (
                <Review reading={reading} key={reading.id} />
              ))}
            </div>
          </div>

          {prevHref && (
            <a
              href={prevHref}
              onClick={(event) => follow(event, prevHref)}
              tabIndex={-1}
              className="leaf-corner previous-corner"
              aria-label="Folhear para trás"
            />
          )}

          {nextHref && (
            <a
              href={nextHref}
              onClick={(event) => follow(event, nextHref)}
              tabIndex={-1}
              className="leaf-corner next-corner"
              aria-label="Folhear para a frente"
            />
          )}
        </section>
      </div>

      <nav className="page-nav" aria-label="Virar páginas">
        {prevHref ? (
          <a href={prevHref} onClick={(event) => follow(event, prevHref)} rel="prev">
            Página anterior
          </a>
        ) : (
          <span className="disabled-page">Página anterior</span>
        )}

        <span className="page-position" role="status">
          <span className="visually-hidden">{first === last ? "Página " : "Páginas "}</span>
          {range} / {pageNumber(total)}
        </span>

        {nextHref ? (
          <a href={nextHref} onClick={(event) => follow(event, nextHref)} rel="next">
            Próxima página
          </a>
        ) : (
          <span className="disabled-page">Próxima página</span>
        )}
      </nav>
    </>
  );
}

function PaperLeaf({ side, page }: {
  side: "left" | "right";
  page?: { reading: BookPage; continued: boolean; folio: number };
}) {
  return (
    <div className={`leaf ${side}-leaf`} aria-hidden="true">
      {page && (
        <>
          <p className="leaf-running-head">
            <span>
              {page.continued ? "Continuação" : page.reading.example ? "Resenha de exemplo" : "Resenha"}
            </span>
            <span className="leaf-tag">
              {page.continued ? page.reading.title : page.reading.genre}
            </span>
          </p>

          <div className="leaf-footer">
            <span className="folio">{pageNumber(page.folio)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function Review({ reading }: { reading: BookPage }) {
  const headingId = `titulo-${reading.id}`;

  return (
    <article className="review" aria-labelledby={headingId}>
      <header className="review-heading">
        <BookCover page={reading} />
        <div>
          <h2 id={headingId}>{reading.title}</h2>
          <p className="reading-author">{reading.author}</p>
          <RatingStars value={reading.rating} />

          {reading.finishedOn && (
            <time className="reading-date" dateTime={reading.finishedOn}>
              {dateLabel(reading.finishedOn)}
            </time>
          )}
        </div>
      </header>

      <div className="review-copy">
        <Markdown skipHtml disallowedElements={["img"]}>
          {reading.review}
        </Markdown>

        <section className="book-phrases">
          <h3>Frases do livro</h3>
          {reading.frases?.length ? (
            reading.frases.map((phrase, index) => (
              <blockquote key={index}>{phrase}</blockquote>
            ))
          ) : (
            <div className="book-phrases-empty" aria-hidden="true" />
          )}
        </section>

        {reading.notes && (
          <section className="notes">
            <h3>Anotações</h3>
            <p>{reading.notes}</p>
          </section>
        )}
      </div>
    </article>
  );
}

function BookCover({ page }: { page: BookPage }) {
  const [brokenCover, setBrokenCover] = useState("");

  if (page.cover && brokenCover !== page.cover) {
    const path = page.cover.split("/").map(encodeURIComponent).join("/");

    return (
      <img
        className="book-thumbnail uploaded-cover"
        src={`/capas/${path}`}
        alt={`Capa de ${page.title}`}
        loading="lazy"
        onError={() => setBrokenCover(page.cover)}
      />
    );
  }

  if (page.example) {
    return (
      <div className="book-thumbnail sample-cover" data-tone={page.example} aria-hidden="true">
        <span>{page.author}</span>
        <span>{page.title}</span>
        <span className="cover-rule" />
      </div>
    );
  }

  return (
    <div className="book-thumbnail cover-placeholder">
      <span className="book-mark" aria-hidden="true" />
      Sem capa
    </div>
  );
}
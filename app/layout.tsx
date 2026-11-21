import type { Metadata } from "next";
import { journalBrand } from "./book-navigation";
import caderno from "@/caderno.json";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: journalBrand, template: `%s · ${journalBrand}` },
  description: "Resenhas literárias de joyceeeira.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-reduce-motion={caderno.reduzirMovimento ? "true" : undefined}>
      <body>
        <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
        <header className="masthead">
          <nav className="toolbar frame" aria-label="Navegação principal">
            <a href="/" className="toolbar-brand" aria-label={`${journalBrand}, início`}>
              <span className="book-mark" aria-hidden="true" />
              {journalBrand}
            </a>
            <form className="toolbar-search" role="search" action="/indice" method="get">
              <label htmlFor="library-search" className="visually-hidden">Buscar por título ou autor</label>
              <input id="library-search" type="search" name="busca" maxLength={160} placeholder="Buscar livro ou autor" />
              <button type="submit" aria-label="Buscar no índice"><span className="search-mark" aria-hidden="true" /></button>
            </form>
          </nav>
        </header>
        <main className="frame stage" id="conteudo">{children}</main>
      </body>
    </html>
  );
}

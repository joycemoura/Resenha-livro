export const journalBrand = "joyceeeira";

export function BookTabs({ active }: { active: "book" | "index" }) {
  return (
    <nav className="book-tabs" aria-label="Navegação do livro">
      {active === "book" ? (
        <a href="/indice"><span aria-hidden="true" className="index-mark" />Índice</a>
      ) : (
        <a href="/"><span aria-hidden="true" className="book-mark" />Livro</a>
      )}
    </nav>
  );
}

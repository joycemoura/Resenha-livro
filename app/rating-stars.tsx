export const ratingValues = [1, 2, 3, 4, 5];

export function RatingStars({ value }: { value: number | null }) {
  const label = value ? `Avaliação de ${value} de 5 estrelas` : "Sem avaliação";

  return (
    <span className="rating-display" role="img" aria-label={label}>
      <span className="rating-glyphs" aria-hidden="true">
        {ratingValues.map((star) => <span className="star-glyph" data-filled={star <= (value ?? 0) || undefined} key={star} />)}
      </span>
      <span className="rating-value" aria-hidden="true">{value ? `${value}/5` : "Sem avaliação"}</span>
    </span>
  );
}

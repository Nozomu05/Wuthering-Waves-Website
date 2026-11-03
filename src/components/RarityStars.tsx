export function RarityStars({ rarity }: { rarity: number }) {
  return (
    <span className="text-sm tracking-tight text-amber-400" aria-label={`${rarity} star`}>
      {"★".repeat(rarity)}
      <span className="text-border">{"★".repeat(Math.max(0, 5 - rarity))}</span>
    </span>
  );
}

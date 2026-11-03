"use client";

import { useMemo, useState } from "react";
import { EntityCard } from "./EntityCard";

export interface SearchableEntityItem {
  id: string;
  name: string;
  href: string;
  rarity: number;
  imageSrc: string | null;
  secondaryImageSrc?: string | null;
  accentColor?: string;
  meta: React.ReactNode;
}

export function SearchableEntityGrid({
  items,
  placeholder,
}: {
  items: SearchableEntityItem[];
  placeholder: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
      />
      <div className="mt-4 text-sm text-muted">
        {filtered.length} of {items.length}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {filtered.map((item) => (
          <EntityCard
            key={item.id}
            href={item.href}
            name={item.name}
            rarity={item.rarity}
            imageSrc={item.imageSrc}
            secondaryImageSrc={item.secondaryImageSrc}
            accentColor={item.accentColor}
            meta={item.meta}
          />
        ))}
      </div>
    </div>
  );
}

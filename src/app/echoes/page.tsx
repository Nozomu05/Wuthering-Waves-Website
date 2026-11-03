import type { Metadata } from "next";
import { getAllEchoesDeduped } from "@/lib/db/queries";
import { SearchableEntityGrid } from "@/components/SearchableEntityGrid";
import { getImagePath } from "@/lib/images";

export const metadata: Metadata = { title: "Echoes" };

export default async function EchoesPage() {
  const echoes = await getAllEchoesDeduped();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Echoes</h1>
      <p className="mt-1 text-sm text-muted">{echoes.length} echoes.</p>
      <div className="mt-6">
        <SearchableEntityGrid
          placeholder="Search echoes..."
          items={echoes.map((e) => ({
            id: e.id,
            name: e.name,
            href: `/echoes/${e.slug}`,
            rarity: e.rarity,
            imageSrc: getImagePath("echoes", e.slug),
            meta: <span>Cost {Number(e.cost)}</span>,
          }))}
        />
      </div>
    </div>
  );
}

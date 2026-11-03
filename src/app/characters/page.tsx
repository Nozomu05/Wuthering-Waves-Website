import type { Metadata } from "next";
import { getAllCharacters } from "@/lib/db/queries";
import { ElementBadge } from "@/components/ElementBadge";
import { SearchableEntityGrid } from "@/components/SearchableEntityGrid";
import { getImagePath } from "@/lib/images";
import { ELEMENT_COLOR, WEAPON_TYPE_LABEL } from "@/lib/wuwa-visuals";

export const metadata: Metadata = { title: "Characters" };

export default async function CharactersPage() {
  const characters = await getAllCharacters();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Characters</h1>
      <p className="mt-1 text-sm text-muted">{characters.length} playable Resonators.</p>
      <div className="mt-6">
        <SearchableEntityGrid
          placeholder="Search characters..."
          items={characters.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/characters/${c.slug}`,
            rarity: c.rarity,
            imageSrc: getImagePath("characters", c.slug),
            secondaryImageSrc: c.secondaryIconUrl
              ? getImagePath("characters", `${c.slug}-secondary`)
              : null,
            accentColor: ELEMENT_COLOR[c.attribute],
            meta: (
              <>
                <ElementBadge attribute={c.attribute} />
                <span>{WEAPON_TYPE_LABEL[c.weaponType] ?? c.weaponType}</span>
              </>
            ),
          }))}
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { getAllWeapons } from "@/lib/db/queries";
import { SearchableEntityGrid } from "@/components/SearchableEntityGrid";
import { getImagePath } from "@/lib/images";
import { WEAPON_TYPE_LABEL } from "@/lib/wuwa-visuals";

export const metadata: Metadata = { title: "Weapons" };

export default async function WeaponsPage() {
  const weapons = await getAllWeapons();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Weapons</h1>
      <p className="mt-1 text-sm text-muted">{weapons.length} weapons.</p>
      <div className="mt-6">
        <SearchableEntityGrid
          placeholder="Search weapons..."
          items={weapons.map((w) => ({
            id: w.id,
            name: w.name,
            href: `/weapons/${w.slug}`,
            rarity: w.rarity,
            imageSrc: getImagePath("weapons", w.slug),
            meta: (
              <>
                <span>{WEAPON_TYPE_LABEL[w.weaponType] ?? w.weaponType}</span>
                <span>·</span>
                <span>{w.mainStat}</span>
              </>
            ),
          }))}
        />
      </div>
    </div>
  );
}

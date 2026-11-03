import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWeaponBySlug } from "@/lib/db/queries";
import { MaterialChip } from "@/components/MaterialChip";
import { RarityStars } from "@/components/RarityStars";
import { SectionTabs } from "@/components/SectionTabs";
import { getImagePath } from "@/lib/images";
import { WEAPON_TYPE_LABEL } from "@/lib/wuwa-visuals";

export async function generateMetadata({
  params,
}: PageProps<"/weapons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWeaponBySlug(slug);
  return { title: data?.weapon.name ?? "Weapon" };
}

export default async function WeaponDetailPage({ params }: PageProps<"/weapons/[slug]">) {
  const { slug } = await params;
  const data = await getWeaponBySlug(slug);
  if (!data) notFound();

  const { weapon, maxLevelStats, totalMaterials } = data;
  const passiveScaling = weapon.passiveScaling as Record<string, string>;
  const ranks = Object.keys(passiveScaling).sort((a, b) => Number(a) - Number(b));
  const imageSrc = getImagePath("weapons", weapon.slug);

  const passiveTab = (
    <div>
      <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="col-span-3 grid grid-cols-3 gap-2 border-b border-border px-4 py-2 text-xs text-muted">
          <span>Stat</span>
          <span className="text-right">Lv. 1</span>
          <span className="text-right">Lv. 90 (max rank)</span>
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2 px-4 py-3 text-sm">
          <span className="text-muted">ATK</span>
          <span className="text-right">{Number(weapon.baseAtk).toFixed(0)}</span>
          <span className="text-right font-medium text-accent">
            {maxLevelStats.baseAtk != null ? maxLevelStats.baseAtk.toFixed(0) : "—"}
          </span>
        </div>
        <div className="col-span-3 grid grid-cols-3 gap-2 px-4 py-3 text-sm">
          <span className="text-muted">{weapon.mainStat}</span>
          <span className="text-right">{(Number(weapon.mainStatValue) / 100).toFixed(1)}%</span>
          <span className="text-right font-medium text-accent">
            {maxLevelStats.mainStatValue != null
              ? `${(maxLevelStats.mainStatValue / 100).toFixed(1)}%`
              : "—"}
          </span>
        </div>
      </div>

      {ranks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Passive: Refinement Ranks</h2>
          <div className="mt-4 space-y-3">
            {ranks.map((rank) => (
              <div key={rank} className="rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="font-medium text-accent">Rank {rank}</div>
                <p className="mt-1 text-muted">{passiveScaling[rank]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const materialsTab = (
    <div>
      <h3 className="text-sm font-medium text-muted">Total to max ascension (lv. 1 to 90)</h3>
      <div className="mt-3 flex flex-wrap gap-3">
        {totalMaterials.map((t) => (
          <MaterialChip
            key={t.material.id}
            slug={t.material.slug}
            name={t.material.name}
            quantity={t.quantity}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-5">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface p-3">
          {imageSrc ? (
            <Image src={imageSrc} alt={weapon.name} fill className="object-contain p-3" />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted">
              {weapon.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{weapon.name}</h1>
          <div className="mt-1 text-sm text-muted">
            {WEAPON_TYPE_LABEL[weapon.weaponType] ?? weapon.weaponType}
          </div>
          <div className="mt-1">
            <RarityStars rarity={weapon.rarity} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SectionTabs
          tabs={[
            { id: "passive", label: "Passive", content: passiveTab },
            { id: "materials", label: "Leveling Materials", content: materialsTab },
          ]}
        />
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCharacterBySlug,
  getRecommendedEchoesForCharacter,
  getWeaponsByType,
} from "@/lib/db/queries";
import { ElementBadge } from "@/components/ElementBadge";
import { MaterialChip } from "@/components/MaterialChip";
import { RarityStars } from "@/components/RarityStars";
import { SectionTabs } from "@/components/SectionTabs";
import { SkillMultiplierTable } from "@/components/SkillMultiplierTable";
import { critValue } from "@/lib/calc/critValue";
import { generateEchoCostLayouts } from "@/lib/calc/echoLayouts";
import { getImagePath } from "@/lib/images";
import { ELEMENT_COLOR, ELEMENT_LABEL, SKILL_TYPE_LABEL, WEAPON_TYPE_LABEL } from "@/lib/wuwa-visuals";

interface SkillMove {
  label: string;
  valuesByLevel: string[];
}

export async function generateMetadata({
  params,
}: PageProps<"/characters/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCharacterBySlug(slug);
  return { title: data?.character.name ?? "Character" };
}

export default async function CharacterDetailPage({
  params,
}: PageProps<"/characters/[slug]">) {
  const { slug } = await params;
  const data = await getCharacterBySlug(slug);
  if (!data) notFound();

  const { character, skills, resonanceChain, totalMaterials } = data;
  const [rankedWeapons, echoRecs] = await Promise.all([
    getWeaponsByType(character.weaponType),
    getRecommendedEchoesForCharacter(character.id, character.attribute),
  ]);
  const accent = ELEMENT_COLOR[character.attribute] ?? ELEMENT_COLOR.none;
  const imageSrc = getImagePath("characters", character.slug);
  const secondaryImageSrc = character.secondaryIconUrl
    ? getImagePath("characters", `${character.slug}-secondary`)
    : null;

  const skillsTab = (
    <div className="space-y-3">
      {skills.map((skill) => {
        const table = skill.multiplierTable as {
          maxLevel: number;
          moves: SkillMove[];
        };
        const skillIconSrc = getImagePath("skills", skill.id);
        return (
          <div key={skill.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-surface-hover">
                  {skillIconSrc && (
                    <Image
                      src={skillIconSrc}
                      alt={skill.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="font-medium">{skill.name}</span>
              </div>
              <span className="text-xs text-muted">
                {SKILL_TYPE_LABEL[skill.skillType] ?? skill.skillType}
              </span>
            </div>
            {skill.description && (
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{skill.description}</p>
            )}
            {table?.moves?.length > 0 && <SkillMultiplierTable moves={table.moves} />}
          </div>
        );
      })}
    </div>
  );

  const resonanceChainTab = (
    <div className="space-y-3">
      {resonanceChain.map((node) => {
        const nodeIconSrc = getImagePath("resonance-chain", node.id);
        return (
          <div key={node.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div
                className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-hover"
                style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }}
              >
                {nodeIconSrc ? (
                  <Image
                    src={nodeIconSrc}
                    alt={node.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium" style={{ color: accent }}>
                    {node.tier}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-black"
                  style={{ backgroundColor: accent }}
                >
                  {node.tier}
                </span>
                <span className="font-medium whitespace-pre-line">{node.name}</span>
              </div>
            </div>
            {node.description && <p className="mt-2 text-sm text-muted">{node.description}</p>}
          </div>
        );
      })}
    </div>
  );

  const sortedWeapons = [...rankedWeapons].sort((a, b) => {
    const aRec = a.weapon.id === character.recommendedWeaponId ? 1 : 0;
    const bRec = b.weapon.id === character.recommendedWeaponId ? 1 : 0;
    return bRec - aRec;
  });

  const weaponTab = (
    <div>
      <p className="text-xs text-muted">
        {character.recommendedWeaponId
          ? "Top row is Kuro's own in-game recommendation for this character (usually their signature weapon), sourced from the game's own data — not computed. "
          : ""}
        The rest are ranked by scaled (lv. 90) base ATK — the one stat that always matters
        regardless of playstyle. This is stat output, not a simulated rotation/DPS ranking.
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Weapon</th>
              <th className="px-3 py-2 text-right font-medium">ATK</th>
              <th className="px-3 py-2 text-right font-medium">Secondary</th>
              <th className="px-3 py-2 text-right font-medium">CV</th>
            </tr>
          </thead>
          <tbody>
            {sortedWeapons.map(({ weapon, maxLevelStats }, i) => {
              const isCrit = weapon.mainStat === "Crit. Rate" || weapon.mainStat === "Crit. DMG";
              const secondaryPercent =
                maxLevelStats.mainStatValue != null ? maxLevelStats.mainStatValue / 100 : null;
              const cv =
                isCrit && secondaryPercent != null
                  ? critValue(
                      weapon.mainStat === "Crit. Rate" ? secondaryPercent : 0,
                      weapon.mainStat === "Crit. DMG" ? secondaryPercent : 0,
                    )
                  : null;
              const weaponIconSrc = getImagePath("weapons", weapon.slug);
              return (
                <tr
                  key={weapon.id}
                  className={i % 2 === 1 ? "bg-surface-hover/50" : undefined}
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/weapons/${weapon.slug}`}
                      className="flex items-center gap-2 hover:text-accent"
                    >
                      <div className="relative size-7 shrink-0 overflow-hidden rounded bg-surface-hover">
                        {weaponIconSrc && (
                          <Image
                            src={weaponIconSrc}
                            alt={weapon.name}
                            fill
                            sizes="28px"
                            className="object-contain"
                          />
                        )}
                      </div>
                      <span className="truncate">{weapon.name}</span>
                      {weapon.id === character.recommendedWeaponId && (
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                          Kuro&rsquo;s Pick
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {maxLevelStats.baseAtk != null ? maxLevelStats.baseAtk.toFixed(0) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {secondaryPercent != null
                      ? `${weapon.mainStat} ${secondaryPercent.toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-accent">
                    {cv != null ? cv.toFixed(1) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const layouts = generateEchoCostLayouts();

  const sourceBadge =
    echoRecs.curatedSource === "manual"
      ? { label: "Curated Pick", className: "bg-accent/15 text-accent" }
      : echoRecs.curatedSource === "automated_cross_checked"
        ? { label: "Sourced Pick", className: "bg-surface-hover text-muted" }
        : echoRecs.curatedSource === "automated_scored"
          ? { label: "Computed Pick", className: "bg-surface-hover text-muted" }
          : null;

  const echoesTab = (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-medium text-muted">
          {character.name}&rsquo;s element ({ELEMENT_LABEL[character.attribute] ?? character.attribute}) matches
          these sets
        </h3>
        {echoRecs.curatedSetId && echoRecs.curatedSource === "manual" && (
          <p className="mt-1 text-xs text-muted">
            Top pick is a curated in-slot-in-game pick, not computed from element text alone.
          </p>
        )}
        {echoRecs.curatedSetId && echoRecs.curatedSource === "automated_cross_checked" && (
          <p className="mt-1 text-xs text-muted">
            Top pick was named explicitly by a real community build guide — not a human-confirmed
            pick, but a sourced one.
          </p>
        )}
        {echoRecs.curatedSetId && echoRecs.curatedSource === "automated_scored" && (
          <p className="mt-1 text-xs text-muted">
            Top pick is computed from the real DMG/Crit numbers in each set&rsquo;s own effect text —
            no build guide was found to cross-check it against, and it doesn&rsquo;t account for
            real proc uptime.
          </p>
        )}
        <div className="mt-3 space-y-3">
          {echoRecs.recommendedSets.map((set) => {
            const setIconSrc = getImagePath("sonata-sets", set.id);
            return (
              <div
                key={set.id}
                className="flex gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm"
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded bg-surface-hover">
                  {setIconSrc && (
                    <Image
                      src={setIconSrc}
                      alt={set.name}
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{set.name}</div>
                    {(set.id === echoRecs.curatedSetId || set.id === echoRecs.curatedSecondarySetId) &&
                      sourceBadge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${sourceBadge.className}`}
                        >
                          {sourceBadge.label}
                        </span>
                      )}
                    {set.id === echoRecs.curatedSetId && echoRecs.curatedPieceCount && (
                      <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {echoRecs.curatedPieceCount}-piece
                      </span>
                    )}
                    {set.id === echoRecs.curatedSecondarySetId && echoRecs.curatedSecondaryPieceCount && (
                      <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {echoRecs.curatedSecondaryPieceCount}-piece
                      </span>
                    )}
                  </div>
                  {set.onePieceEffect && (
                    <div className="mt-1 text-muted">1-pc: {set.onePieceEffect}</div>
                  )}
                  {set.twoPieceEffect && (
                    <div className="mt-1 text-muted">2-pc: {set.twoPieceEffect}</div>
                  )}
                  {set.threePieceEffect && (
                    <div className="mt-1 text-muted">3-pc: {set.threePieceEffect}</div>
                  )}
                  {set.fivePieceEffect && (
                    <div className="mt-1 text-muted">5-pc: {set.fivePieceEffect}</div>
                  )}
                </div>
              </div>
            );
          })}
          {echoRecs.recommendedSets.length === 0 && (
            <p className="text-sm text-muted">No set&rsquo;s own text names this element.</p>
          )}
        </div>
      </section>

      {echoRecs.curatedMainEcho && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted">
            Recommended main-slot echo
            {sourceBadge && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${sourceBadge.className}`}>
                {sourceBadge.label}
              </span>
            )}
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {(() => {
              const echo = echoRecs.curatedMainEcho!;
              const echoIconSrc = getImagePath("echoes", echo.slug);
              return (
                <Link
                  href={`/echoes/${echo.slug}`}
                  className="flex w-64 items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 p-2 text-sm hover:border-accent"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-surface-hover">
                    {echoIconSrc && (
                      <Image
                        src={echoIconSrc}
                        alt={echo.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate">{echo.name}</div>
                    {echoRecs.curatedMainStat && (
                      <div className="text-xs text-muted">Main stat: {echoRecs.curatedMainStat}</div>
                    )}
                  </div>
                </Link>
              );
            })()}
          </div>
        </section>
      )}

      {echoRecs.mainSlotCandidates.length > 0 && !echoRecs.curatedMainEcho && (
        <section>
          <h3 className="text-sm font-medium text-muted">
            Main-slot candidates (their own skill text names this element)
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {echoRecs.mainSlotCandidates.map((echo) => {
              const echoIconSrc = getImagePath("echoes", echo.slug);
              return (
                <Link
                  key={echo.id}
                  href={`/echoes/${echo.slug}`}
                  className="flex w-56 items-center gap-2 rounded-lg border border-border bg-surface p-2 text-sm hover:border-accent"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-surface-hover">
                    {echoIconSrc && (
                      <Image
                        src={echoIconSrc}
                        alt={echo.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="truncate">{echo.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-muted">
          {echoRecs.curatedLayout && echoRecs.curatedLayout.length > 0
            ? "Recommended cost layout"
            : "Common cost layouts (5 slots, ≤12 cost)"}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {echoRecs.curatedLayout && echoRecs.curatedLayout.length > 0
            ? "The specific slot layout to run for this build."
            : "Every valid combination near the cost budget — not a ranking. Which is actually best depends on the specific echoes/rolls you own."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {echoRecs.curatedLayout && echoRecs.curatedLayout.length > 0 ? (
            <span className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-1.5 text-sm">
              {echoRecs.curatedLayout.join("-")}{" "}
              <span className="text-muted">
                ({echoRecs.curatedLayout.reduce((a, b) => a + b, 0)} cost)
              </span>
            </span>
          ) : (
            layouts.map((layout) => (
              <span
                key={layout.join("-")}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
              >
                {layout.join("-")}{" "}
                <span className="text-muted">
                  ({layout.reduce((a, b) => a + b, 0)} cost)
                </span>
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const materialsTab = (
    <div>
      <h3 className="text-sm font-medium text-muted">
        Total to max ascension and every leveled skill
      </h3>
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
    <div>
      <div
        className="relative overflow-hidden border-b border-border"
        style={{
          backgroundImage: `radial-gradient(ellipse at top right, ${accent}22, transparent 60%)`,
        }}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-10 sm:flex-row">
          <div
            className="relative size-36 shrink-0 overflow-hidden rounded-2xl border-2 sm:size-44"
            style={{ borderColor: accent }}
          >
            {imageSrc && secondaryImageSrc ? (
              <div className="flex size-full">
                <div className="relative h-full w-1/2 overflow-hidden">
                  <Image src={imageSrc} alt={character.name} fill className="object-cover" />
                </div>
                <div className="relative h-full w-1/2 overflow-hidden border-l border-black/30">
                  <Image
                    src={secondaryImageSrc}
                    alt={character.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ) : imageSrc ? (
              <Image src={imageSrc} alt={character.name} fill className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-surface-hover text-4xl font-semibold text-muted">
                {character.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-semibold tracking-tight">{character.name}</h1>
            <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
              <ElementBadge attribute={character.attribute} />
              <span className="text-sm text-muted">
                {WEAPON_TYPE_LABEL[character.weaponType] ?? character.weaponType}
              </span>
            </div>
            <div className="mt-2 flex justify-center sm:justify-start">
              <RarityStars rarity={character.rarity} />
            </div>
            {character.description && (
              <p className="mt-3 max-w-xl whitespace-pre-line text-sm text-muted">
                {character.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <SectionTabs
        tabs={[
          { id: "skills", label: "Skills", content: skillsTab },
          { id: "resonance-chain", label: "Resonance Chain", content: resonanceChainTab },
          { id: "weapon", label: "Best Weapon", content: weaponTab },
          { id: "echoes", label: "Best Echoes", content: echoesTab },
          { id: "materials", label: "Leveling Materials", content: materialsTab },
        ]}
      />
    </div>
  );
}

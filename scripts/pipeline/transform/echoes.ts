import { loadCache } from "../lib/cache";
import { interpolate, resolveText, slugify, stripRichText } from "../lib/text";
import type {
  RawPhantomFetter,
  RawPhantomFetterGroup,
  RawPhantomItem,
  RawPhantomRarity,
  RawPhantomSkill,
} from "../lib/types";
import type { echoSonataSets, echoes, sonataSets } from "@/lib/db/schema";
import { parseEchoIdentity } from "@/lib/echoVariants";
import { getPlayableCharacterNames } from "./characters";

type EchoRow = typeof echoes.$inferInsert;
type SonataSetRow = typeof sonataSets.$inferInsert;
type EchoSonataSetRow = typeof echoSonataSets.$inferInsert;

export interface TransformedEchoData {
  echoes: EchoRow[];
  sonataSets: SonataSetRow[];
  echoSonataSets: EchoSonataSetRow[];
}

function fetterEffectText(fetter: RawPhantomFetter | undefined): string | null {
  if (!fetter) return null;
  const template = resolveText(fetter.EffectDescription);
  if (!template) return null;
  return stripRichText(interpolate(template, fetter.EffectDescriptionParam ?? []));
}

export function transformEchoes(): TransformedEchoData {
  const phantomItems = loadCache<RawPhantomItem[]>("PhantomItem.json");
  const rarities = loadCache<RawPhantomRarity[]>("PhantomRarity.json");
  const fetterGroups = loadCache<RawPhantomFetterGroup[]>("PhantomFetterGroup.json");
  const fetters = loadCache<RawPhantomFetter[]>("PhantomFetter.json");
  const phantomSkills = loadCache<RawPhantomSkill[]>("PhantomSkill.json");

  const costByRarity = new Map(rarities.map((r) => [r.Rare, r.Cost]));
  const fetterById = new Map(fetters.map((f) => [f.Id, f]));
  const phantomSkillById = new Map(phantomSkills.map((s) => [s.PhantomSkillId, s]));
  const characterNames = getPlayableCharacterNames();

  const sonataSetRows: SonataSetRow[] = fetterGroups.map((g) => {
    const byThreshold = new Map(g.FetterMap.map((m) => [m.Key, m.Value]));
    const effectAt = (threshold: number) => fetterEffectText(fetterById.get(byThreshold.get(threshold)!));
    return {
      id: String(g.Id),
      name: resolveText(g.FetterGroupName) ?? g.FetterGroupName,
      onePieceEffect: effectAt(1),
      twoPieceEffect: effectAt(2),
      threePieceEffect: effectAt(3),
      fivePieceEffect: effectAt(5),
      iconUrl: g.FetterElementPath ?? null,
    };
  });

  const knownSetIds = new Set(sonataSetRows.map((s) => s.id));

  const echoRows: EchoRow[] = [];
  const echoSonataSetRows: EchoSonataSetRow[] = [];
  const usedSlugs = new Set<string>();
  const seenEchoIds = new Set<string>();

  const sortedItems = phantomItems
    .filter((p) => p.ShowInBag)
    .sort((a, b) => b.QualityId - a.QualityId);

  for (const item of sortedItems) {
    const id = String(item.ItemId);
    if (seenEchoIds.has(id)) continue;
    seenEchoIds.add(id);

    const name = resolveText(item.MonsterName) ?? `Echo ${item.ItemId}`;
    if (characterNames.has(name)) continue;
    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${item.ItemId}`;
    usedSlugs.add(slug);

    const cost = costByRarity.get(item.Rarity) ?? null;
    if (cost === null) continue;

    const phantomSkill = phantomSkillById.get(item.SkillId);
    let skillDescription: string | null = null;
    if (phantomSkill) {
      const template = resolveText(phantomSkill.DescriptionEx);
      const tierParams =
        phantomSkill.LevelDescStrArray?.[Math.min(item.QualityId, phantomSkill.LevelDescStrArray.length) - 1]
          ?.ArrayString ?? [];
      skillDescription = template
        ? stripRichText(interpolate(template, tierParams))
        : null;
    }

    echoRows.push({
      id,
      slug,
      name,
      cost: String(cost),
      rarity: item.QualityId,
      skillDescription,
      iconUrl: item.Icon,
    });

    const setIds = new Set(
      (item.FetterGroup ?? []).map(String).filter((setId) => knownSetIds.has(setId)),
    );
    for (const setId of setIds) {
      echoSonataSetRows.push({ echoId: id, sonataSetId: setId });
    }
  }

  const normalSetIdsByIdentity = new Map<string, Set<string>>();
  for (const row of echoRows) {
    const { identityName, skin } = parseEchoIdentity(row.name);
    if (skin !== "normal") continue;
    const setIds = normalSetIdsByIdentity.get(identityName) ?? new Set<string>();
    for (const link of echoSonataSetRows) {
      if (link.echoId === row.id) setIds.add(link.sonataSetId);
    }
    normalSetIdsByIdentity.set(identityName, setIds);
  }

  const finalEchoSonataSetRows = echoSonataSetRows.filter((link) => {
    const row = echoRows.find((r) => r.id === link.echoId);
    return row ? parseEchoIdentity(row.name).skin !== "phantom" : true;
  });
  for (const row of echoRows) {
    const { identityName, skin } = parseEchoIdentity(row.name);
    if (skin !== "phantom") continue;
    const inheritedSetIds = normalSetIdsByIdentity.get(identityName);
    if (!inheritedSetIds) continue;
    for (const setId of inheritedSetIds) {
      finalEchoSonataSetRows.push({ echoId: row.id, sonataSetId: setId });
    }
  }

  return { echoes: echoRows, sonataSets: sonataSetRows, echoSonataSets: finalEchoSonataSetRows };
}

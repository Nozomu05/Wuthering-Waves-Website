import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  characterEchoSetRecommendations,
  characterMaterialCosts,
  characterResonanceChain,
  characterSkillMaterialCosts,
  characterSkills,
  characters,
  echoSonataSets,
  echoes,
  growthCurves,
  materials,
  sonataSets,
  weaponMaterialCosts,
  weapons,
} from "./schema";
import { applyCurve } from "@/lib/calc/scaling";
import { parseEchoIdentity, type EchoSkin } from "@/lib/echoVariants";
import { ELEMENT_LABEL } from "@/lib/wuwa-visuals";

const MAX_LEVEL = 90;
const MAX_BREACH = 6;

export const getAllCharacters = cache(async () => {
  return db.query.characters.findMany({
    orderBy: [desc(characters.rarity), asc(characters.name)],
  });
});

export const getCharacterBySlug = cache(async (slug: string) => {
  const character = await db.query.characters.findFirst({
    where: eq(characters.slug, slug),
  });
  if (!character) return null;

  const [skills, resonanceChain, materialCosts] = await Promise.all([
    db.query.characterSkills.findMany({
      where: eq(characterSkills.characterId, character.id),
    }),
    db.query.characterResonanceChain.findMany({
      where: eq(characterResonanceChain.characterId, character.id),
      orderBy: [asc(characterResonanceChain.tier)],
    }),
    db
      .select({
        phase: characterMaterialCosts.phase,
        quantity: characterMaterialCosts.quantity,
        material: materials,
      })
      .from(characterMaterialCosts)
      .innerJoin(materials, eq(materials.id, characterMaterialCosts.materialId))
      .where(eq(characterMaterialCosts.characterId, character.id)),
  ]);

  const skillOrder = [
    "normal_attack",
    "resonance_skill",
    "forte_circuit",
    "resonance_liberation",
    "intro_skill",
    "outro_skill",
    "inherent_skill",
    "tune_break",
  ];
  skills.sort((a, b) => skillOrder.indexOf(a.skillType) - skillOrder.indexOf(b.skillType));

  const skillIds = skills.map((s) => s.id);
  const skillMaterialCosts = skillIds.length
    ? await db
        .select({
          skillId: characterSkillMaterialCosts.skillId,
          level: characterSkillMaterialCosts.level,
          quantity: characterSkillMaterialCosts.quantity,
          material: materials,
        })
        .from(characterSkillMaterialCosts)
        .innerJoin(materials, eq(materials.id, characterSkillMaterialCosts.materialId))
        .where(inArray(characterSkillMaterialCosts.skillId, skillIds))
    : [];

  const totalsByMaterial = new Map<
    string,
    { material: (typeof materialCosts)[number]["material"]; quantity: number }
  >();
  for (const { material, quantity } of materialCosts) {
    const running = totalsByMaterial.get(material.id);
    totalsByMaterial.set(material.id, { material, quantity: (running?.quantity ?? 0) + quantity });
  }
  for (const { material, quantity } of skillMaterialCosts) {
    const running = totalsByMaterial.get(material.id);
    totalsByMaterial.set(material.id, { material, quantity: (running?.quantity ?? 0) + quantity });
  }
  const totalMaterials = [...totalsByMaterial.values()].sort(
    (a, b) =>
      (b.material.rarity ?? 0) - (a.material.rarity ?? 0) ||
      a.material.name.localeCompare(b.material.name),
  );

  return { character, skills, resonanceChain, materialCosts, skillMaterialCosts, totalMaterials };
});

export const getAllWeapons = cache(async () => {
  return db.query.weapons.findMany({
    orderBy: [desc(weapons.rarity), asc(weapons.name)],
  });
});

async function getWeaponMaxLevelStats(weapon: typeof weapons.$inferSelect) {
  const curveAt = async (curveId: number) =>
    db.query.growthCurves.findFirst({
      where: and(
        eq(growthCurves.curveId, curveId),
        eq(growthCurves.level, MAX_LEVEL),
        eq(growthCurves.breachLevel, MAX_BREACH),
      ),
    });

  const [firstCurve, secondCurve] = await Promise.all([
    curveAt(weapon.firstCurveId),
    curveAt(weapon.secondCurveId),
  ]);

  return {
    baseAtk: firstCurve ? applyCurve(Number(weapon.baseAtk), firstCurve.curveValue) : null,
    mainStatValue: secondCurve
      ? applyCurve(Number(weapon.mainStatValue), secondCurve.curveValue)
      : null,
  };
}

export const getWeaponsByType = cache(async (weaponType: string) => {
  const typeWeapons = await db.query.weapons.findMany({
    where: eq(weapons.weaponType, weaponType),
  });
  const withStats = await Promise.all(
    typeWeapons.map(async (weapon) => ({
      weapon,
      maxLevelStats: await getWeaponMaxLevelStats(weapon),
    })),
  );
  return withStats.sort(
    (a, b) => (b.maxLevelStats.baseAtk ?? 0) - (a.maxLevelStats.baseAtk ?? 0),
  );
});

export const getWeaponBySlug = cache(async (slug: string) => {
  const weapon = await db.query.weapons.findFirst({ where: eq(weapons.slug, slug) });
  if (!weapon) return null;

  const maxLevelStats = await getWeaponMaxLevelStats(weapon);

  const materialCosts = await db
    .select({
      material: materials,
      quantity: weaponMaterialCosts.quantity,
    })
    .from(weaponMaterialCosts)
    .innerJoin(materials, eq(materials.id, weaponMaterialCosts.materialId))
    .where(eq(weaponMaterialCosts.weaponId, weapon.id));

  const totalsByMaterial = new Map<
    string,
    { material: (typeof materialCosts)[number]["material"]; quantity: number }
  >();
  for (const { material, quantity } of materialCosts) {
    const running = totalsByMaterial.get(material.id);
    totalsByMaterial.set(material.id, { material, quantity: (running?.quantity ?? 0) + quantity });
  }
  const totalMaterials = [...totalsByMaterial.values()].sort(
    (a, b) =>
      (b.material.rarity ?? 0) - (a.material.rarity ?? 0) ||
      a.material.name.localeCompare(b.material.name),
  );

  return { weapon, maxLevelStats, totalMaterials };
});

export const getAllEchoesDeduped = cache(async () => {
  const all = await db.query.echoes.findMany({
    orderBy: [desc(echoes.rarity)],
  });
  const byIdentity = new Map<string, (typeof all)[number]>();
  for (const echo of [...all].sort((a, b) => {
    const skinDiff =
      (parseEchoIdentity(a.name).skin === "phantom" ? 1 : 0) -
      (parseEchoIdentity(b.name).skin === "phantom" ? 1 : 0);
    return skinDiff !== 0 ? skinDiff : b.rarity - a.rarity;
  })) {
    const { identityName } = parseEchoIdentity(echo.name);
    if (!byIdentity.has(identityName)) byIdentity.set(identityName, echo);
  }
  return [...byIdentity.values()].sort(
    (a, b) => Number(b.cost) - Number(a.cost) || a.name.localeCompare(b.name),
  );
});

export const getEchoBySlug = cache(async (slug: string) => {
  const echo = await db.query.echoes.findFirst({ where: eq(echoes.slug, slug) });
  if (!echo) return null;

  const sets = await db
    .select({ set: sonataSets })
    .from(echoSonataSets)
    .innerJoin(sonataSets, eq(sonataSets.id, echoSonataSets.sonataSetId))
    .where(eq(echoSonataSets.echoId, echo.id));

  const { identityName } = parseEchoIdentity(echo.name);
  const allEchoes = await db.query.echoes.findMany({ orderBy: [desc(echoes.rarity)] });
  const skinsSeen = new Map<EchoSkin, { slug: string; skin: EchoSkin }>();
  for (const candidate of allEchoes) {
    const parsed = parseEchoIdentity(candidate.name);
    if (parsed.identityName !== identityName) continue;
    if (!skinsSeen.has(parsed.skin)) {
      skinsSeen.set(parsed.skin, { slug: candidate.slug, skin: parsed.skin });
    }
  }
  const skinRank = (skin: EchoSkin) => (skin === "phantom" ? 1 : 0);
  const variants = [...skinsSeen.values()].sort((a, b) => skinRank(a.skin) - skinRank(b.skin));

  return { echo, sets: sets.map((s) => s.set), variants };
});

export const getRecommendedEchoesForCharacter = cache(
  async (characterId: string, attribute: string) => {
    const elementLabel = ELEMENT_LABEL[attribute];
    const allSets = await db.query.sonataSets.findMany();

    const curatedRec = await db.query.characterEchoSetRecommendations.findFirst({
      where: eq(characterEchoSetRecommendations.characterId, characterId),
    });
    const curatedSetId = curatedRec?.sonataSetId ?? null;

    const matchesElement = (set: (typeof allSets)[number]) =>
      !!elementLabel &&
      ((set.onePieceEffect ?? "").includes(elementLabel) ||
        (set.twoPieceEffect ?? "").includes(elementLabel) ||
        (set.threePieceEffect ?? "").includes(elementLabel) ||
        (set.fivePieceEffect ?? "").includes(elementLabel));

    const elementMatched = allSets.filter(matchesElement);
    const curatedSet = curatedSetId ? (allSets.find((s) => s.id === curatedSetId) ?? null) : null;
    const curatedSecondarySetId = curatedRec?.secondarySonataSetId ?? null;
    const curatedSecondarySet = curatedSecondarySetId
      ? (allSets.find((s) => s.id === curatedSecondarySetId) ?? null)
      : null;
    const rankedSets = curatedSet
      ? [
          curatedSet,
          ...(curatedSecondarySet ? [curatedSecondarySet] : []),
          ...elementMatched.filter((s) => s.id !== curatedSet.id && s.id !== curatedSecondarySetId),
        ]
      : elementMatched;
    const recommendedSets = rankedSets.slice(0, 2);

    const recommendedSetIds = new Set(recommendedSets.map((s) => s.id));
    const echoLinksInRecommendedSets = recommendedSetIds.size
      ? await db.query.echoSonataSets.findMany({
          where: inArray(echoSonataSets.sonataSetId, [...recommendedSetIds]),
        })
      : [];
    const echoIdsInRecommendedSets = new Set(echoLinksInRecommendedSets.map((l) => l.echoId));

    const allEchoes = await db.query.echoes.findMany({ orderBy: [desc(echoes.rarity)] });
    const seenIdentity = new Set<string>();
    const mainSlotCandidates: (typeof allEchoes)[number][] = [];
    for (const echo of allEchoes) {
      if (Number(echo.cost) !== 4) continue;
      if (!echoIdsInRecommendedSets.has(echo.id)) continue;
      if (!(echo.skillDescription ?? "").includes(elementLabel ?? "\0")) continue;
      const { identityName, skin } = parseEchoIdentity(echo.name);
      if (skin !== "normal" || seenIdentity.has(identityName)) continue;
      seenIdentity.add(identityName);
      mainSlotCandidates.push(echo);
    }

    const curatedMainEcho = curatedRec?.mainEchoId
      ? await db.query.echoes.findFirst({ where: eq(echoes.id, curatedRec.mainEchoId) })
      : null;

    return {
      recommendedSets,
      mainSlotCandidates,
      curatedSetId,
      curatedPieceCount: curatedRec?.pieceCount ?? null,
      curatedLayout: (curatedRec?.layout as number[] | null) ?? null,
      curatedMainEcho,
      curatedMainStat: curatedRec?.mainStat ?? null,
      curatedSecondarySetId,
      curatedSecondaryPieceCount: curatedRec?.secondaryPieceCount ?? null,
      curatedSource: curatedRec?.source ?? null,
    };
  },
);

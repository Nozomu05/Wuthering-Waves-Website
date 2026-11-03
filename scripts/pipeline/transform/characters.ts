import { loadCache } from "../lib/cache";
import { ELEMENT_BY_ID, SKILL_TYPE_BY_ID, WEAPON_TYPE_BY_ID } from "../lib/enums";
import type { createMaterialRegistry } from "../lib/materialRegistry";
import { interpolate, resolveText, slugify, stripRichText } from "../lib/text";
import type {
  RawResonantChain,
  RawRoleBreach,
  RawRoleDevProject,
  RawRoleInfo,
  RawSkill,
  RawSkillDescription,
  RawSkillLevel,
} from "../lib/types";
import type {
  characterMaterialCosts,
  characterResonanceChain,
  characterSkillMaterialCosts,
  characterSkills,
  characters,
} from "@/lib/db/schema";

type CharacterRow = typeof characters.$inferInsert;
type SkillRow = typeof characterSkills.$inferInsert;
type ResonanceChainRow = typeof characterResonanceChain.$inferInsert;
type MaterialCostRow = typeof characterMaterialCosts.$inferInsert;
type SkillMaterialCostRow = typeof characterSkillMaterialCosts.$inferInsert;

export interface TransformedCharacterData {
  characters: CharacterRow[];
  skills: SkillRow[];
  resonanceChain: ResonanceChainRow[];
  materialCosts: MaterialCostRow[];
  skillMaterialCosts: SkillMaterialCostRow[];
}

function isPlayableCharacter(role: RawRoleInfo): boolean {
  return role.RoleType === 1 && role.IsTrial === false;
}

function isKitSharingDuplicate(role: RawRoleInfo): boolean {
  return role.SkillId !== role.Id;
}

export function getPlayableCharacterNames(): Set<string> {
  const roles = loadCache<RawRoleInfo[]>("RoleInfo.json");
  return new Set(
    roles.filter(isPlayableCharacter).map((r) => resolveText(r.Name) ?? String(r.Id)),
  );
}

function uniqueSlug(name: string, role: RawRoleInfo, usedSlugs: Set<string>): string {
  const base = slugify(name);
  if (!usedSlugs.has(base)) {
    usedSlugs.add(base);
    return base;
  }
  const genderSuffix = role.RoleBody?.startsWith("Female") ? "f" : "m";
  const disambiguated = `${base}-${genderSuffix}`;
  usedSlugs.add(disambiguated);
  return disambiguated;
}

export function transformCharacters(
  materialRegistry: ReturnType<typeof createMaterialRegistry>,
): TransformedCharacterData {
  const roles = loadCache<RawRoleInfo[]>("RoleInfo.json");
  const skills = loadCache<RawSkill[]>("Skill.json");
  const skillDescriptions = loadCache<RawSkillDescription[]>("SkillDescription.json");
  const resonantChains = loadCache<RawResonantChain[]>("ResonantChain.json");
  const roleBreaches = loadCache<RawRoleBreach[]>("RoleBreach.json");
  const skillLevels = loadCache<RawSkillLevel[]>("SkillLevel.json");
  const roleDevProjects = loadCache<RawRoleDevProject[]>("RoleDevProject.json");
  const recommendedWeaponByRoleId = new Map(
    roleDevProjects.map((p) => [p.RoleId, p.RecommandWeapon?.[0] ?? null]),
  );

  const { registerMaterial } = materialRegistry;

  const playableRoles = roles.filter(isPlayableCharacter);
  const primaryRoles = playableRoles.filter((r) => !isKitSharingDuplicate(r));
  const duplicateRoles = playableRoles.filter(isKitSharingDuplicate);

  const secondaryIconByPrimaryId = new Map<number, string>();
  for (const dup of duplicateRoles) {
    if (dup.RoleHeadIconCircle) secondaryIconByPrimaryId.set(dup.SkillId, dup.RoleHeadIconCircle);
  }

  const usedSlugs = new Set<string>();

  const characterRows: CharacterRow[] = [];
  const skillRows: SkillRow[] = [];
  const resonanceChainRows: ResonanceChainRow[] = [];
  const materialCostRows: MaterialCostRow[] = [];
  const skillMaterialCostRows: SkillMaterialCostRow[] = [];

  for (const role of primaryRoles) {
    const name = resolveText(role.Name) ?? `Unknown ${role.Id}`;
    const slug = uniqueSlug(name, role, usedSlugs);
    const description = resolveText(role.Introduction);

    characterRows.push({
      id: String(role.Id),
      slug,
      name,
      rarity: role.QualityId === 5 ? 5 : 4,
      weaponType: WEAPON_TYPE_BY_ID[role.WeaponType] ?? "unknown",
      attribute: ELEMENT_BY_ID[role.ElementId] ?? "none",
      iconUrl: role.RoleHeadIconCircle ?? null,
      secondaryIconUrl: secondaryIconByPrimaryId.get(role.Id) ?? null,
      recommendedWeaponId: (() => {
        const id = recommendedWeaponByRoleId.get(role.Id);
        return id ? String(id) : null;
      })(),
      splashArtUrl: role.RolePortrait ?? null,
      description: description ? stripRichText(description) : null,
    });

    for (const skill of skills.filter((s) => s.SkillGroupId === role.SkillId)) {
      const skillName = resolveText(skill.SkillName) ?? skill.SkillName;
      const rawDescribe = resolveText(skill.SkillDescribe);
      const filledDescribe =
        rawDescribe && skill.SkillDetailNum
          ? interpolate(rawDescribe, skill.SkillDetailNum)
          : rawDescribe;

      const moves = skillDescriptions
        .filter((sd) => sd.SkillLevelGroupId === skill.SkillLevelGroupId)
        .sort((a, b) => a.Order - b.Order)
        .map((sd) => ({
          label: resolveText(sd.AttributeName) ?? sd.AttributeName,
          valuesByLevel: sd.SkillDetailNum?.[0]?.ArrayString ?? [],
        }))
        .filter((m) => /dmg|damage/i.test(m.label))
        .filter((m) => m.valuesByLevel.some((v) => v.includes("%")));

      skillRows.push({
        id: String(skill.Id),
        characterId: String(role.Id),
        skillType: SKILL_TYPE_BY_ID[skill.SkillType] ?? "unknown",
        name: skillName,
        description: filledDescribe ? stripRichText(filledDescribe) : null,
        multiplierTable: { maxLevel: skill.MaxSkillLevel, moves },
        iconUrl: skill.Icon ?? null,
      });

      for (const levelRow of skillLevels.filter(
        (sl) => sl.SkillLevelGroupId === skill.SkillLevelGroupId,
      )) {
        for (const { Key: itemId, Value: quantity } of levelRow.Consume ?? []) {
          const materialId = registerMaterial(itemId);
          if (!materialId) continue;
          skillMaterialCostRows.push({
            skillId: String(skill.Id),
            materialId,
            level: levelRow.SkillId,
            quantity,
          });
        }
      }
    }

    for (const node of resonantChains.filter((c) => c.GroupId === role.ResonantChainGroupId)) {
      const nodeName = resolveText(node.NodeName) ?? node.NodeName;
      const rawDescription = resolveText(node.AttributesDescription) ?? "";
      const params = node.AttributesDescriptionParams ?? [];
      const filledDescription = stripRichText(interpolate(rawDescription, params));

      resonanceChainRows.push({
        id: String(node.Id),
        characterId: String(role.Id),
        tier: node.GroupIndex,
        name: nodeName,
        description: filledDescription,
        effectValue: { params },
        iconUrl: node.NodeIcon ?? null,
      });
    }

    for (const breach of roleBreaches.filter((b) => b.BreachGroupId === role.BreachId)) {
      for (const { Key: itemId, Value: quantity } of breach.BreachConsume ?? []) {
        const materialId = registerMaterial(itemId);
        if (!materialId) continue;

        materialCostRows.push({
          characterId: String(role.Id),
          materialId,
          phase: breach.BreachLevel,
          quantity,
        });
      }
    }
  }

  return {
    characters: characterRows,
    skills: skillRows,
    resonanceChain: resonanceChainRows,
    materialCosts: materialCostRows,
    skillMaterialCosts: skillMaterialCostRows,
  };
}

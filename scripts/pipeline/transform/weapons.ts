import { loadCache } from "../lib/cache";
import { WEAPON_TYPE_BY_ID } from "../lib/enums";
import type { createMaterialRegistry } from "../lib/materialRegistry";
import { statName } from "../lib/propertyIndex";
import { interpolate, resolveText, slugify, stripRichText } from "../lib/text";
import type { RawWeaponBreach, RawWeaponConf, RawWeaponPropertyGrowth } from "../lib/types";
import type { growthCurves, weaponMaterialCosts, weapons } from "@/lib/db/schema";

type WeaponRow = typeof weapons.$inferInsert;
type GrowthCurveRow = typeof growthCurves.$inferInsert;
type WeaponMaterialCostRow = typeof weaponMaterialCosts.$inferInsert;

export interface TransformedWeaponData {
  weapons: WeaponRow[];
  growthCurves: GrowthCurveRow[];
  materialCosts: WeaponMaterialCostRow[];
}

const SHELL_CREDIT_ITEM_ID = 2;

export function transformWeapons(
  materialRegistry: ReturnType<typeof createMaterialRegistry>,
): TransformedWeaponData {
  const weaponConfs = loadCache<RawWeaponConf[]>("WeaponConf.json");
  const growth = loadCache<RawWeaponPropertyGrowth[]>("WeaponPropertyGrowth.json");
  const weaponBreaches = loadCache<RawWeaponBreach[]>("WeaponBreach.json");
  const { registerMaterial } = materialRegistry;

  const usedSlugs = new Set<string>();
  const weaponRows: WeaponRow[] = [];
  const materialCostRows: WeaponMaterialCostRow[] = [];

  const PLACEHOLDER_NAME = /^[A-Za-z]+#\w+$/;

  for (const w of weaponConfs) {
    const name = resolveText(w.WeaponName) ?? `Weapon ${w.ItemId}`;
    if (PLACEHOLDER_NAME.test(name)) continue;
    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${w.ItemId}`;
    usedSlugs.add(slug);

    const rawDesc = resolveText(w.Desc);
    const passiveScaling: Record<string, string> = {};
    if (rawDesc && w.DescParams) {
      const ranks = w.DescParams[0]?.ArrayString.length ?? 0;
      for (let rank = 0; rank < ranks; rank++) {
        const values = w.DescParams.map((p) => p.ArrayString[rank] ?? "");
        passiveScaling[String(rank + 1)] = stripRichText(interpolate(rawDesc, values));
      }
    }

    const mainStatValue = w.SecondPropId.IsRatio
      ? w.SecondPropId.Value * 10000
      : w.SecondPropId.Value;

    weaponRows.push({
      id: String(w.ItemId),
      slug,
      name,
      weaponType: WEAPON_TYPE_BY_ID[w.WeaponType] ?? "unknown",
      rarity: w.QualityId,
      baseAtk: String(w.FirstPropId.Value),
      firstCurveId: w.FirstCurve,
      mainStat: statName(w.SecondPropId.Id),
      mainStatValue: String(mainStatValue),
      secondCurveId: w.SecondCurve,
      passiveDescription: passiveScaling["1"] ?? (rawDesc ? stripRichText(rawDesc) : null),
      passiveScaling,
      iconUrl: w.Icon,
    });

    for (const breach of weaponBreaches.filter((b) => b.BreachId === w.BreachId)) {
      for (const { Key: itemId, Value: quantity } of breach.Consume ?? []) {
        const materialId = registerMaterial(itemId);
        if (!materialId) continue;
        materialCostRows.push({ weaponId: String(w.ItemId), materialId, phase: breach.Level, quantity });
      }
      if (breach.GoldConsume > 0) {
        const materialId = registerMaterial(SHELL_CREDIT_ITEM_ID);
        if (materialId) {
          materialCostRows.push({
            weaponId: String(w.ItemId),
            materialId,
            phase: breach.Level,
            quantity: breach.GoldConsume,
          });
        }
      }
    }
  }

  const growthCurveRows: GrowthCurveRow[] = growth.map((g) => ({
    curveId: g.CurveId,
    level: g.Level,
    breachLevel: g.BreachLevel,
    curveValue: g.CurveValue,
  }));

  return { weapons: weaponRows, growthCurves: growthCurveRows, materialCosts: materialCostRows };
}

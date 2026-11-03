import { resolveText, slugify } from "./text";
import type { RawItemInfo } from "./types";
import type { materials } from "@/lib/db/schema";

type MaterialRow = typeof materials.$inferInsert;

export function createMaterialRegistry(items: RawItemInfo[]) {
  const itemById = new Map(items.map((i) => [i.Id, i]));
  const seen = new Set<string>();
  const rows: MaterialRow[] = [];

  function registerMaterial(itemId: number): string | null {
    const item = itemById.get(itemId);
    if (!item) return null;
    const materialId = String(itemId);
    if (!seen.has(materialId)) {
      seen.add(materialId);
      const itemName = resolveText(item.Name) ?? item.Name;
      rows.push({
        id: materialId,
        slug: slugify(itemName),
        name: itemName,
        materialType: itemId === 2 ? "currency" : "leveling",
        rarity: item.QualityId,
        iconUrl: item.Icon,
      });
    }
    return materialId;
  }

  return { registerMaterial, materials: rows };
}

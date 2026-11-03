import { loadCache } from "./cache";
import { resolveText } from "./text";

interface RawPropertyIndex {
  Id: number;
  Key: string;
  Name: string;
}

let byId: Map<number, RawPropertyIndex> | null = null;

function getIndex(): Map<number, RawPropertyIndex> {
  if (!byId) {
    const rows = loadCache<RawPropertyIndex[]>("PropertyIndex.json");
    byId = new Map(rows.map((r) => [r.Id, r]));
  }
  return byId;
}

const AMBIGUOUS_PERCENT_VARIANTS: Record<number, string> = {
  10007: "ATK %",
};

export function statName(propertyId: number): string {
  if (propertyId in AMBIGUOUS_PERCENT_VARIANTS) return AMBIGUOUS_PERCENT_VARIANTS[propertyId];
  const entry = getIndex().get(propertyId);
  if (!entry) return `Property${propertyId}`;
  return resolveText(entry.Name) ?? entry.Key;
}

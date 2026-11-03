const WINDOW = 30;

function percentagesNear(text: string, keyword: RegExp): { index: number; value: number }[] {
  const results: { index: number; value: number }[] = [];
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)%/g)) {
    const start = Math.max(0, m.index - WINDOW);
    const end = Math.min(text.length, m.index + m[0].length + WINDOW);
    if (keyword.test(text.slice(start, end))) results.push({ index: m.index, value: parseFloat(m[1]) });
  }
  return results;
}

const CRIT_RATE_KW = /Crit\.?\s*Rate/i;
const CRIT_DMG_KW = /Crit\.?\s*DMG/i;
const DMG_KW = /DMG/i;
const ATK_KW = /\bATK\b/i;

export interface BonusBreakdown {
  dmgBonus: number;
  critRate: number;
  critDmg: number;
}

export function extractBonusBreakdown(text: string | null | undefined): BonusBreakdown {
  if (!text) return { dmgBonus: 0, critRate: 0, critDmg: 0 };

  const critRateHits = percentagesNear(text, CRIT_RATE_KW);
  const critDmgHits = percentagesNear(text, CRIT_DMG_KW);
  const claimedIndices = new Set([...critRateHits, ...critDmgHits].map((h) => h.index));

  const dmgHits = percentagesNear(text, DMG_KW).filter((h) => !claimedIndices.has(h.index));
  const atkHits = percentagesNear(text, ATK_KW).filter(
    (h) => !claimedIndices.has(h.index) && !dmgHits.some((d) => d.index === h.index),
  );

  const sum = (hits: { value: number }[]) => hits.reduce((acc, h) => acc + h.value, 0) / 100;
  return {
    dmgBonus: sum(dmgHits) + sum(atkHits),
    critRate: sum(critRateHits),
    critDmg: sum(critDmgHits),
  };
}

export function scoreEffectText(text: string | null | undefined): number {
  const { dmgBonus, critRate, critDmg } = extractBonusBreakdown(text);
  return (dmgBonus + critRate * 2 + critDmg) * 100;
}

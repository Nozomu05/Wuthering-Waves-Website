const BASE_CRIT_RATE = 0.05;
const BASE_CRIT_DMG = 1.5;

export interface DamageInputs {
  atk: number;
  skillMultiplier: number;
  dmgBonus: number;
  critRate?: number;
  critDmg?: number;
  attackerLevel: number;
  targetDef: number;
  defIgnore?: number;
  targetRes: number;
}

export function defMultiplier(attackerLevel: number, targetDef: number, defIgnore = 0): number {
  const levelTerm = 800 + 8 * attackerLevel;
  return levelTerm / (levelTerm + targetDef * (1 - defIgnore));
}

export function resMultiplier(targetRes: number): number {
  if (targetRes < 0) return 1 - targetRes / 2;
  if (targetRes < 0.8) return 1 - targetRes;
  return 1 / (1 + 5 * targetRes);
}

export function critMultiplier(critRate = BASE_CRIT_RATE, critDmg = BASE_CRIT_DMG): number {
  const clampedRate = Math.min(Math.max(critRate, 0), 1);
  return 1 + clampedRate * (critDmg - 1);
}

export function calculateDamage(inputs: DamageInputs): number {
  const {
    atk,
    skillMultiplier,
    dmgBonus,
    critRate,
    critDmg,
    attackerLevel,
    targetDef,
    defIgnore,
    targetRes,
  } = inputs;

  return (
    atk *
    skillMultiplier *
    (1 + dmgBonus) *
    critMultiplier(critRate, critDmg) *
    defMultiplier(attackerLevel, targetDef, defIgnore) *
    resMultiplier(targetRes)
  );
}

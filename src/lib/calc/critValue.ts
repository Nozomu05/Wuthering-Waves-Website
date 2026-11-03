export function critValue(critRatePercent: number, critDmgPercent: number): number {
  return critRatePercent * 2 + critDmgPercent;
}

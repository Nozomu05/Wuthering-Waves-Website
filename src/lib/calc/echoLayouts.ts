const ECHO_COSTS = [4, 3, 1] as const;
const SLOT_COUNT = 5;
const TOTAL_BUDGET = 12;

export function generateEchoCostLayouts(minTotal = 10): number[][] {
  const results: number[][] = [];

  function build(combo: number[]) {
    if (combo.length === SLOT_COUNT) {
      const total = combo.reduce((a, b) => a + b, 0);
      if (total >= minTotal && total <= TOTAL_BUDGET) results.push([...combo]);
      return;
    }
    for (const cost of ECHO_COSTS) {
      if (combo.length > 0 && cost > combo[combo.length - 1]) continue;
      combo.push(cost);
      build(combo);
      combo.pop();
    }
  }

  build([]);
  return results.sort((a, b) => b.reduce((x, y) => x + y, 0) - a.reduce((x, y) => x + y, 0));
}

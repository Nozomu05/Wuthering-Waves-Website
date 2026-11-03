const TERM = /^(\d+(?:\.\d+)?)%(?:\*(\d+))?$/;

export function parseMultiplier(value: string): number {
  let total = 0;
  for (const term of value.split("+")) {
    const m = TERM.exec(term.trim());
    if (!m) continue;
    const pct = parseFloat(m[1]);
    const count = m[2] ? parseInt(m[2], 10) : 1;
    total += pct * count;
  }
  return total / 100;
}

export type EchoSkin = "normal" | "phantom";

const PHANTOM_PREFIX = "Phantom: ";

function normalizeForMatch(name: string): string {
  return name
    .replace(/\s*[-:]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function parseEchoIdentity(name: string): { identityName: string; skin: EchoSkin } {
  const isPhantom = name.startsWith(PHANTOM_PREFIX);
  const withoutPrefix = isPhantom ? name.slice(PHANTOM_PREFIX.length) : name;
  return { identityName: normalizeForMatch(withoutPrefix), skin: isPhantom ? "phantom" : "normal" };
}

export const SKIN_LABEL: Record<EchoSkin, string> = {
  normal: "Normal",
  phantom: "Phantom",
};

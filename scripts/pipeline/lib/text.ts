import { loadCache } from "./cache";

let textMap: Record<string, string> | null = null;

function getTextMap(): Record<string, string> {
  if (!textMap) {
    textMap = loadCache<Record<string, string>>("MultiText.json");
  }
  return textMap;
}

export function resolveText(label: string | null | undefined): string | null {
  if (!label) return null;
  return getTextMap()[label] ?? label;
}

export function interpolate(template: string, values: (string | number)[]): string {
  return values.reduce<string>(
    (acc, value, i) => acc.replaceAll(`{${i}}`, String(value)),
    template,
  );
}

export function stripRichText(input: string): string {
  return input
    .replace(/\{Cus:Ipt,[^}]*?PC=([^\s}]+)[^}]*\}/g, "$1")
    .replace(/(\d+)(\s*)\{Cus:Sap,S=([^\s}]+)\s+P=([^\s}]+)[^}]*\}/g, (_, num, space, singular, plural) =>
      `${num}${space}${num === "1" ? singular : plural}`,
    )
    .replace(/\{Cus:[^}]*\}/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[':]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

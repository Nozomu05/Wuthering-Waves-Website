import "server-only";
import { readdirSync } from "node:fs";
import path from "node:path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");

const CATEGORIES = [
  "characters",
  "weapons",
  "echoes",
  "materials",
  "skills",
  "resonance-chain",
  "sonata-sets",
] as const;
type ImageCategory = (typeof CATEGORIES)[number];

function buildSlugIndex(subdir: string): Map<string, string> {
  const dir = path.join(IMAGES_DIR, subdir);
  const index = new Map<string, string>();
  let files: string[] = [];
  try {
    files = readdirSync(dir);
  } catch {
    return index;
  }
  for (const file of files) {
    index.set(path.basename(file, path.extname(file)), file);
  }
  return index;
}

let prodIndexes: Record<ImageCategory, Map<string, string>> | null = null;

function getIndexes(): Record<ImageCategory, Map<string, string>> {
  if (process.env.NODE_ENV !== "production") {
    return Object.fromEntries(CATEGORIES.map((c) => [c, buildSlugIndex(c)])) as Record<
      ImageCategory,
      Map<string, string>
    >;
  }
  if (!prodIndexes) {
    prodIndexes = Object.fromEntries(CATEGORIES.map((c) => [c, buildSlugIndex(c)])) as Record<
      ImageCategory,
      Map<string, string>
    >;
  }
  return prodIndexes;
}

export function getImagePath(category: ImageCategory, slug: string): string | null {
  const file = getIndexes()[category].get(slug);
  return file ? `/images/${category}/${file}` : null;
}

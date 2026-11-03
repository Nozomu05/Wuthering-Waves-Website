import "./lib/load-env";

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

const PUBLIC_DIR = path.join(__dirname, "..", "..", "public", "images");

function assetPathToUrl(rawIconPath: string): string {
  const packagePath = rawIconPath.split(".")[0];
  return `https://api.encore.moe/resource/Data${packagePath}.webp`;
}

async function downloadOne(iconUrl: string, destPath: string): Promise<boolean> {
  const res = await fetch(assetPathToUrl(iconUrl));
  if (!res.ok) return false;
  const buffer = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, buffer);
  return true;
}

async function downloadAll(
  label: string,
  items: { slug: string; iconUrl: string | null }[],
  outSubdir: string,
) {
  let matched = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const item of items) {
    if (!item.iconUrl) continue;
    const destPath = path.join(PUBLIC_DIR, outSubdir, `${item.slug}.webp`);
    if (existsSync(destPath)) {
      skipped++;
      continue;
    }
    const ok = await downloadOne(item.iconUrl, destPath);
    if (ok) matched++;
    else failed.push(item.slug);
  }

  console.log(
    `${label}: ${matched} downloaded, ${skipped} already on disk, ${failed.length} failed` +
      (failed.length ? ` (${failed.slice(0, 10).join(", ")})` : ""),
  );
}

async function main() {
  const allCharacters = await db.query.characters.findMany();
  const allWeapons = await db.query.weapons.findMany();
  const allEchoes = await db.query.echoes.findMany();
  const allMaterials = await db.query.materials.findMany();
  const allSkills = await db.query.characterSkills.findMany();
  const allResonanceChain = await db.query.characterResonanceChain.findMany();
  const allSonataSets = await db.query.sonataSets.findMany();

  await downloadAll("Characters", allCharacters, "characters");
  await downloadAll(
    "Character secondary portraits",
    allCharacters
      .filter((c) => c.secondaryIconUrl)
      .map((c) => ({ slug: `${c.slug}-secondary`, iconUrl: c.secondaryIconUrl })),
    "characters",
  );
  await downloadAll("Weapons", allWeapons, "weapons");
  await downloadAll("Echoes", allEchoes, "echoes");
  await downloadAll("Materials", allMaterials, "materials");
  await downloadAll(
    "Skills",
    allSkills.map((s) => ({ slug: s.id, iconUrl: s.iconUrl })),
    "skills",
  );
  await downloadAll(
    "Resonance chain",
    allResonanceChain.map((n) => ({ slug: n.id, iconUrl: n.iconUrl })),
    "resonance-chain",
  );
  await downloadAll(
    "Sonata sets",
    allSonataSets.map((s) => ({ slug: s.id, iconUrl: s.iconUrl })),
    "sonata-sets",
  );

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

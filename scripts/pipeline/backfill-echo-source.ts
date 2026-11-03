import "./lib/load-env";

import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterEchoSetRecommendations } from "@/lib/db/schema";
import { ECHO_SET_RECOMMENDATIONS } from "./curated/echoSetRecommendations";

async function main() {
  const logPaths = process.argv.slice(2);
  if (logPaths.length === 0) throw new Error("Usage: backfill-echo-source.ts <log files...>");

  const allCharacters = await db.query.characters.findMany();
  const namesByLength = [...allCharacters].sort((a, b) => b.name.length - a.name.length);

  const sourceByCharacterId = new Map<string, string>();

  for (const path of logPaths) {
    const text = readFileSync(path, "utf-8");
    for (const line of text.split("\n")) {
      const match = /^\s*\[\d+\/\d+\]\s+(.+)$/.exec(line);
      if (!match) continue;
      const rest = match[1];
      const character = namesByLength.find((c) => rest.startsWith(`${c.name}:`));
      if (!character) continue;
      if (rest.includes("[cross-checked:")) {
        sourceByCharacterId.set(character.id, "automated_cross_checked");
      } else if (rest.includes("[kit-only]")) {
        sourceByCharacterId.set(character.id, "automated_kit_only");
      }
    }
  }

  console.log(`Reconstructed source for ${sourceByCharacterId.size} characters from logs.`);

  let updated = 0;
  for (const [characterId, source] of sourceByCharacterId) {
    await db
      .update(characterEchoSetRecommendations)
      .set({ source })
      .where(eq(characterEchoSetRecommendations.characterId, characterId));
    updated++;
  }
  console.log(`Updated ${updated} automated rows.`);

  const manualCharacterIds = allCharacters
    .filter((c) => c.slug in ECHO_SET_RECOMMENDATIONS)
    .map((c) => c.id);
  for (const characterId of manualCharacterIds) {
    await db
      .update(characterEchoSetRecommendations)
      .set({ source: "manual" })
      .where(eq(characterEchoSetRecommendations.characterId, characterId));
  }
  console.log(`Set ${manualCharacterIds.length} manual rows to source="manual".`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

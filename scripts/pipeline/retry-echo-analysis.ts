import "./lib/load-env";

import { db } from "@/lib/db";
import { characterEchoSetRecommendations } from "@/lib/db/schema";
import { buildManualRows } from "./curate/buildManualRows";
import { ECHO_SET_RECOMMENDATIONS } from "./curated/echoSetRecommendations";
import { runAutomatedEchoAnalysis } from "./curate/runEchoAnalysis";

async function main() {
  const allCharacters = await db.query.characters.findMany();
  const allSkills = await db.query.characterSkills.findMany();
  const allSonataSets = await db.query.sonataSets.findMany();
  const allEchoes = await db.query.echoes.findMany();
  const allEchoSonataSetLinks = await db.query.echoSonataSets.findMany();
  const existing = await db.query.characterEchoSetRecommendations.findMany();
  const alreadyCurated = new Set(existing.map((r) => r.characterId));

  const newManualRows = buildManualRows(allCharacters, allSonataSets, allEchoes).filter(
    (row) => !alreadyCurated.has(row.characterId),
  );
  if (newManualRows.length > 0) {
    console.log(`Inserting ${newManualRows.length} new hand-curated row(s)...`);
    for (const row of newManualRows) {
      await db.insert(characterEchoSetRecommendations).values(row);
      alreadyCurated.add(row.characterId);
    }
  }

  const skipSlugs = new Set([
    ...Object.keys(ECHO_SET_RECOMMENDATIONS),
    ...allCharacters.filter((c) => alreadyCurated.has(c.id)).map((c) => c.slug),
  ]);

  console.log(
    `${allCharacters.length - skipSlugs.size} characters still missing a curated echo build ` +
      `out of ${allCharacters.length} total.`,
  );

  await runAutomatedEchoAnalysis(
    allCharacters,
    allSkills,
    allSonataSets,
    allEchoes,
    allEchoSonataSetLinks,
    skipSlugs,
    async (row) => {
      await db.insert(characterEchoSetRecommendations).values(row);
    },
  );

  console.log("Retry pass complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

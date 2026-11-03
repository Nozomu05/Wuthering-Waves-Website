import "./lib/load-env";

import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterEchoSetRecommendations } from "@/lib/db/schema";

async function main() {
  const rows = await db.query.characterEchoSetRecommendations.findMany({
    where: isNotNull(characterEchoSetRecommendations.mainEchoId),
  });
  const links = await db.query.echoSonataSets.findMany();
  const setIdsByEcho = new Map<string, Set<string>>();
  for (const link of links) {
    if (!setIdsByEcho.has(link.echoId)) setIdsByEcho.set(link.echoId, new Set());
    setIdsByEcho.get(link.echoId)!.add(link.sonataSetId);
  }

  let cleared = 0;
  for (const row of rows) {
    const echoSetIds = setIdsByEcho.get(row.mainEchoId!) ?? new Set();
    const validSetIds = [row.sonataSetId, row.secondarySonataSetId].filter((id): id is string => !!id);
    const belongs = validSetIds.some((id) => echoSetIds.has(id));
    if (!belongs) {
      await db
        .update(characterEchoSetRecommendations)
        .set({ mainEchoId: null })
        .where(eq(characterEchoSetRecommendations.characterId, row.characterId));
      console.log(`  Cleared mismatched mainEchoId for character ${row.characterId}`);
      cleared++;
    }
  }

  console.log(`Checked ${rows.length} rows, cleared ${cleared} mismatched main-echo picks.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { ECHO_SET_RECOMMENDATIONS } from "../curated/echoSetRecommendations";
import type { EchoRecommendationRow } from "./runEchoAnalysis";

interface CharacterInput {
  id: string;
  slug: string;
}

interface SonataSetInput {
  id: string;
  name: string;
}

interface EchoInput {
  id: string;
  slug: string;
}

export function buildManualRows(
  charactersList: CharacterInput[],
  sonataSetsList: SonataSetInput[],
  echoesList: EchoInput[],
): EchoRecommendationRow[] {
  const characterIdBySlug = new Map(charactersList.map((c) => [c.slug, c.id]));
  const sonataSetIdByName = new Map(sonataSetsList.map((s) => [s.name, s.id]));
  const echoIdBySlug = new Map(echoesList.map((e) => [e.slug, e.id]));

  return Object.entries(ECHO_SET_RECOMMENDATIONS).map(([slug, rec]) => {
    const characterId = characterIdBySlug.get(slug);
    const sonataSetId = sonataSetIdByName.get(rec.sonataSet);
    if (!characterId) throw new Error(`Unknown character slug in curated picks: "${slug}"`);
    if (!sonataSetId) throw new Error(`Unknown sonata set name in curated picks: "${rec.sonataSet}"`);
    const mainEchoId = rec.mainEcho ? echoIdBySlug.get(rec.mainEcho) : undefined;
    if (rec.mainEcho && !mainEchoId)
      throw new Error(`Unknown echo slug in curated picks: "${rec.mainEcho}"`);
    const secondarySonataSetId = rec.secondarySet ? sonataSetIdByName.get(rec.secondarySet) : undefined;
    if (rec.secondarySet && !secondarySonataSetId)
      throw new Error(`Unknown secondary sonata set name in curated picks: "${rec.secondarySet}"`);

    return {
      characterId,
      sonataSetId,
      pieceCount: rec.pieceCount ?? null,
      layout: rec.layout ?? null,
      mainEchoId: mainEchoId ?? null,
      mainStat: rec.mainStat ?? null,
      secondarySonataSetId: secondarySonataSetId ?? null,
      secondaryPieceCount: rec.secondaryPieceCount ?? null,
      source: "manual",
    };
  });
}

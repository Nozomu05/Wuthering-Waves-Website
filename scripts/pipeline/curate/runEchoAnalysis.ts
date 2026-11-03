import { parseEchoIdentity } from "@/lib/echoVariants";
import { ELEMENT_LABEL } from "@/lib/wuwa-visuals";
import { generateEchoCostLayouts } from "@/lib/calc/echoLayouts";
import { predictSonataSetFromKit } from "./predictFromKit";
import { scoreEffectText } from "./scoreSonataSet";

interface CharacterInput {
  id: string;
  slug: string;
  name: string;
  attribute: string;
}

interface SkillInput {
  characterId: string;
  skillType: string;
  description?: string | null;
  multiplierTable?: unknown;
}

interface SonataSetInput {
  id: string;
  name: string;
  onePieceEffect?: string | null;
  twoPieceEffect?: string | null;
  threePieceEffect?: string | null;
  fivePieceEffect?: string | null;
}

interface EchoInput {
  id: string;
  name: string;
  cost: string | number;
  skillDescription?: string | null;
}

interface EchoSonataSetLink {
  echoId: string;
  sonataSetId: string;
}

export interface EchoRecommendationRow {
  [key: string]: unknown;
  characterId: string;
  sonataSetId: string;
  pieceCount: number | null;
  layout: number[] | null;
  mainEchoId: string | null;
  mainStat: string | null;
  secondarySonataSetId?: string | null;
  secondaryPieceCount?: number | null;
  source: string;
}

function memberEchoesOf(
  setId: string,
  echoesList: EchoInput[],
  echoById: Map<string, EchoInput>,
  links: EchoSonataSetLink[],
): EchoInput[] {
  const memberIds = new Set(links.filter((l) => l.sonataSetId === setId).map((l) => l.echoId));
  const seenIdentity = new Set<string>();
  const members: EchoInput[] = [];
  for (const echoId of memberIds) {
    const echo = echoById.get(echoId);
    if (!echo || Number(echo.cost) !== 4) continue;
    const { identityName, skin } = parseEchoIdentity(echo.name);
    if (skin !== "normal" || seenIdentity.has(identityName)) continue;
    seenIdentity.add(identityName);
    members.push(echo);
  }
  return members;
}

function bestMainEcho(members: EchoInput[]): EchoInput | null {
  let best: { echo: EchoInput; score: number } | null = null;
  for (const echo of members) {
    const score = scoreEffectText(echo.skillDescription);
    if (score > 0 && (!best || score > best.score)) best = { echo, score };
  }
  return best?.echo ?? null;
}

function describeSet(set: SonataSetInput): { text: string; highestTier: 1 | 2 | 3 | 5 } | null {
  const parts: string[] = [];
  if (set.onePieceEffect) parts.push(`1-piece: ${set.onePieceEffect}`);
  if (set.twoPieceEffect) parts.push(`2-piece: ${set.twoPieceEffect}`);
  if (set.threePieceEffect) parts.push(`3-piece: ${set.threePieceEffect}`);
  if (set.fivePieceEffect) parts.push(`5-piece: ${set.fivePieceEffect}`);
  if (parts.length === 0) return null;
  const highestTier = set.fivePieceEffect ? 5 : set.threePieceEffect ? 3 : set.twoPieceEffect ? 2 : 1;
  return { text: parts.join(" "), highestTier };
}

export async function runAutomatedEchoAnalysis(
  charactersList: CharacterInput[],
  skills: SkillInput[],
  sonataSets: SonataSetInput[],
  echoesList: EchoInput[],
  echoSonataSetLinks: EchoSonataSetLink[],
  skipSlugs: Set<string>,
  onRow: (row: EchoRecommendationRow) => Promise<void>,
): Promise<void> {
  const targets = charactersList.filter((c) => !skipSlugs.has(c.slug));
  const echoById = new Map(echoesList.map((e) => [e.id, e]));
  const defaultLayout = generateEchoCostLayouts()[0];

  const candidateSets = sonataSets
    .map((set) => {
      const described = describeSet(set);
      return described ? { set, ...described } : null;
    })
    .filter((c): c is { set: SonataSetInput; text: string; highestTier: 1 | 2 | 3 | 5 } => c !== null);

  console.log(
    `Running automated echo-build analysis for ${targets.length} characters ` +
      `(${charactersList.length - targets.length} skipped — already hand-curated)...`,
  );

  let done = 0;
  for (const character of targets) {
    done++;
    const elementLabel = ELEMENT_LABEL[character.attribute];
    const characterSkills = skills.filter((s) => s.characterId === character.id);
    const kitText = characterSkills.map((s) => s.description ?? "").join(" ");

    const prediction = await predictSonataSetFromKit(
      character.name,
      elementLabel,
      kitText,
      candidateSets.map(({ set, text }) => ({ name: set.name, text })),
    );

    if (!prediction) {
      console.log(`  [${done}/${targets.length}] ${character.name}: LLM prediction failed, skipped`);
      continue;
    }

    const primary = candidateSets.find((c) => c.set.name === prediction.primarySet)!;
    const secondary =
      prediction.secondarySet && primary.highestTier !== 5
        ? (candidateSets.find((c) => c.set.name === prediction.secondarySet) ?? null)
        : null;

    const primaryMembers = memberEchoesOf(primary.set.id, echoesList, echoById, echoSonataSetLinks);
    const secondaryMembers = secondary
      ? memberEchoesOf(secondary.set.id, echoesList, echoById, echoSonataSetLinks)
      : [];
    const mainEcho = bestMainEcho(primaryMembers.length ? primaryMembers : secondaryMembers);

    console.log(
      `  [${done}/${targets.length}] ${character.name} (${prediction.role}): ${primary.set.name} (${primary.highestTier}pc)` +
        (secondary ? ` + ${secondary.set.name} (2pc)` : "") +
        ` — ${prediction.reasoning}`,
    );

    await onRow({
      characterId: character.id,
      sonataSetId: primary.set.id,
      pieceCount: primary.highestTier,
      secondarySonataSetId: secondary?.set.id ?? null,
      secondaryPieceCount: secondary ? 2 : null,
      layout: defaultLayout,
      mainEchoId: mainEcho?.id ?? null,
      mainStat: prediction.role === "support" ? "Energy Regen" : elementLabel ? `${elementLabel} DMG` : null,
      source: "automated_llm",
    });
  }
}

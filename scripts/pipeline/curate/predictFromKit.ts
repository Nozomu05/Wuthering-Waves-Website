const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const MODEL = process.env.REASONING_MODEL ?? "qwen2.5:14b-instruct";

export interface KitCandidateSet {
  name: string;
  text: string;
}

export interface KitPrediction {
  role: "dps" | "sub_dps" | "support";
  reasoning: string;
  primarySet: string;
  secondarySet: string | null;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    role: { type: "string", enum: ["dps", "sub_dps", "support"] },
    reasoning: { type: "string" },
    primarySet: { type: "string" },
    secondarySet: { type: ["string", "null"] },
  },
  required: ["role", "reasoning", "primarySet", "secondarySet"],
};

function buildPrompt(
  characterName: string,
  elementLabel: string | null,
  kitText: string,
  sets: KitCandidateSet[],
): string {
  const setsText = sets.map((s) => `- ${s.name}: ${s.text}`).join("\n");

  return `You are an expert Wuthering Waves theorycrafter choosing the best Echo Sonata set for a character, based only on reading their kit — the same way real players do: figure out what the kit's damage/utility actually scales off and which specific mechanics it repeatedly triggers, then match that to the set whose own bonus text pays off exactly that trigger.

Character: ${characterName}${elementLabel ? ` (${elementLabel})` : ""}

Full kit text (every skill, verbatim):
"""
${kitText}
"""

Every real Sonata set and its real effect text (pick ONLY from this list, using the exact name):
${setsText}

Instructions:
- First decide the character's real combat role from the kit: "dps" (their own hits are the main damage source), "sub_dps" (deals real damage but isn't the main carry), or "support" (their own damage barely matters — healing, shielding the team, reducing damage taken, or enabling teammates is the real value, even if some of their skills technically deal damage numbers).
- A support character usually wants a set that helps the TEAM or scales off something other than their own ATK/Crit (Energy Regen, Healing Bonus, a team-wide buff, a buff for the next/incoming Resonator) — a set that only buffs their own ATK/Crit DMG is close to wasted on them.
- A dps/sub_dps character usually wants a set whose own DMG/Crit bonus they can actually trigger — match the set's trigger condition to a mechanic the kit text actually describes (e.g. gaining Shields, inflicting a specific Negative Status effect, Energy Regen scaling, Coordinated Attack, Echo Skill usage, casting their Outro Skill).
- Only pick a set whose trigger condition is something THIS character's kit can actually do — don't pick a set just because its numbers look big, and don't pick a set gated on an element or Negative Status this character doesn't have.
- Some sets only have a 1-piece, 2-piece, or 3-piece effect (no 5-piece tier at all) — if your primary pick is one of those, also name a real second set (secondarySet) so all 5 echo slots have a real purpose; otherwise leave secondarySet null. Never pick two of these partial-tier sets together.

Respond with ONLY valid JSON: {"role": "dps"|"sub_dps"|"support", "reasoning": "<1-2 sentences citing the specific kit mechanic that justifies the pick>", "primarySet": "<exact name from the list above>", "secondarySet": "<exact name from the list above, or null>"}`;
}

export async function predictSonataSetFromKit(
  characterName: string,
  elementLabel: string | null,
  kitText: string,
  sets: KitCandidateSet[],
): Promise<KitPrediction | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: buildPrompt(characterName, elementLabel, kitText, sets) }],
        format: RESPONSE_SCHEMA,
        stream: false,
        options: { temperature: 0.2 },
      }),
    });
    if (!res.ok) {
      console.warn(`  (predictSonataSetFromKit: Ollama returned ${res.status})`);
      return null;
    }
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      role?: string;
      reasoning?: string;
      primarySet?: string;
      secondarySet?: string | null;
    };
    const role =
      parsed.role === "dps" || parsed.role === "sub_dps" || parsed.role === "support" ? parsed.role : null;
    const primaryMatch = sets.find((s) => s.name.toLowerCase() === (parsed.primarySet ?? "").toLowerCase());
    if (!role || !primaryMatch) return null;

    const secondaryMatch = parsed.secondarySet
      ? (sets.find((s) => s.name.toLowerCase() === parsed.secondarySet?.toLowerCase()) ?? null)
      : null;

    return {
      role,
      reasoning: parsed.reasoning ?? "",
      primarySet: primaryMatch.name,
      secondarySet: secondaryMatch?.name ?? null,
    };
  } catch (err) {
    console.warn(`  (predictSonataSetFromKit: ${err instanceof Error ? err.message : String(err)})`);
    return null;
  }
}

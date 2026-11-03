import "./lib/load-env";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  characterEchoSetRecommendations,
  characterMaterialCosts,
  characterResonanceChain,
  characterSkillMaterialCosts,
  characterSkills,
  characters,
  echoSonataSets,
  echoes,
  growthCurves,
  materials,
  sonataSets,
  weaponMaterialCosts,
  weapons,
} from "@/lib/db/schema";
import { ECHO_SET_RECOMMENDATIONS } from "./curated/echoSetRecommendations";
import { buildManualRows } from "./curate/buildManualRows";
import { runAutomatedEchoAnalysis } from "./curate/runEchoAnalysis";
import { loadCache } from "./lib/cache";
import { createMaterialRegistry } from "./lib/materialRegistry";
import type { RawItemInfo } from "./lib/types";
import { transformCharacters } from "./transform/characters";
import { transformEchoes } from "./transform/echoes";
import { transformWeapons } from "./transform/weapons";

async function truncateContentTables() {
  await db.execute(sql`
    truncate table
      characters, character_skills, character_resonance_chain,
      materials, character_material_costs, character_skill_material_costs,
      weapons, growth_curves, weapon_material_costs,
      echoes, sonata_sets, echo_sonata_sets, character_echo_set_recommendations
    restart identity cascade
  `);
}

async function insertAll<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
) {
  if (rows.length === 0) return;
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(table).values(rows.slice(i, i + BATCH_SIZE));
  }
}

async function main() {
  const materialRegistry = createMaterialRegistry(loadCache<RawItemInfo[]>("ItemInfo.json"));

  const data = transformCharacters(materialRegistry);
  const weaponData = transformWeapons(materialRegistry);
  const echoData = transformEchoes();

  console.log(
    `Transformed ${data.characters.length} characters, ${data.skills.length} skills, ` +
      `${data.resonanceChain.length} resonance chain nodes, ` +
      `${data.materialCosts.length} material costs, ${data.skillMaterialCosts.length} skill material costs.`,
  );
  console.log(
    `Transformed ${weaponData.weapons.length} weapons, ${weaponData.growthCurves.length} growth curve rows, ` +
      `${weaponData.materialCosts.length} weapon material costs.`,
  );
  console.log(
    `Transformed ${echoData.echoes.length} echoes, ${echoData.sonataSets.length} sonata sets, ` +
      `${echoData.echoSonataSets.length} echo-set links.`,
  );
  console.log(`Discovered ${materialRegistry.materials.length} distinct materials.`);

  await truncateContentTables();

  await insertAll(characters, data.characters);
  await insertAll(materials, materialRegistry.materials);
  await insertAll(characterSkills, data.skills);
  await insertAll(characterResonanceChain, data.resonanceChain);
  await insertAll(characterMaterialCosts, data.materialCosts);
  await insertAll(characterSkillMaterialCosts, data.skillMaterialCosts);

  await insertAll(growthCurves, weaponData.growthCurves);
  await insertAll(weapons, weaponData.weapons);
  await insertAll(weaponMaterialCosts, weaponData.materialCosts);

  await insertAll(sonataSets, echoData.sonataSets);
  await insertAll(echoes, echoData.echoes);
  await insertAll(echoSonataSets, echoData.echoSonataSets);

  const manualRows = buildManualRows(data.characters, echoData.sonataSets, echoData.echoes);

  await insertAll(characterEchoSetRecommendations, manualRows);

  await runAutomatedEchoAnalysis(
    data.characters,
    data.skills,
    echoData.sonataSets,
    echoData.echoes,
    echoData.echoSonataSets,
    new Set(Object.keys(ECHO_SET_RECOMMENDATIONS)),
    async (row) => {
      await db.insert(characterEchoSetRecommendations).values(row);
    },
  );

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

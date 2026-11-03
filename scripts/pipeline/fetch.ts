import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const RAW_BASE = "https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/3.5";
const CACHE_DIR = path.join(__dirname, "cache");

const CONFIG_DB_FILES: Record<string, string> = {
  RoleInfo: "BinData/role/roleinfo.json",
  Skill: "BinData/skill/skill.json",
  SkillLevel: "BinData/skill/skilllevel.json",
  SkillType: "BinData/skill/skilltype.json",
  SkillDescription: "BinData/skill/skilldescription.json",
  Damage: "BinData/damage/damage.json",
  ResonantChain: "BinData/resonate_chain/resonantchain.json",
  RoleBreach: "BinData/role_level/rolebreach.json",
  RoleLevelConsume: "BinData/role_level/rolelevelconsume.json",
  RoleDevProject: "BinData/RoleDev/roledevproject.json",
  WeaponConf: "BinData/weapon/weaponconf.json",
  WeaponBreach: "BinData/weapon/weaponbreach.json",
  WeaponPropertyGrowth: "BinData/property/weaponpropertygrowth.json",
  ElementInfo: "BinData/element_info/elementinfo.json",
  PropertyIndex: "BinData/property/propertyindex.json",
  ItemInfo: "BinData/item/iteminfo.json",
  PhantomItem: "BinData/phantom/phantomitem.json",
  PhantomFetterGroup: "BinData/phantom/phantomfettergroup.json",
  PhantomFetter: "BinData/phantom/phantomfetter.json",
  PhantomGrowth: "BinData/phantom/phantomgrowth.json",
  PhantomSkill: "BinData/phantom/phantomskill.json",
};

const MULTI_TEXT_PATH = "Textmaps/en/multi_text/MultiText.json";

async function fetchJson(relativePath: string): Promise<unknown> {
  const url = `${RAW_BASE}/${relativePath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function writeCache(destName: string, data: unknown) {
  const destPath = path.join(CACHE_DIR, destName);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, JSON.stringify(data));
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  for (const [destName, relativePath] of Object.entries(CONFIG_DB_FILES)) {
    const data = await fetchJson(relativePath);
    await writeCache(`${destName}.json`, data);
    console.log(`cached ${destName}.json (${Array.isArray(data) ? data.length : "?"} entries)`);
  }

  const multiTextRows = (await fetchJson(MULTI_TEXT_PATH)) as { Id: string; Content: string }[];
  const multiTextFlat: Record<string, string> = {};
  for (const row of multiTextRows) multiTextFlat[row.Id] = row.Content;
  await writeCache("MultiText.json", multiTextFlat);
  console.log(`cached MultiText.json (${multiTextRows.length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

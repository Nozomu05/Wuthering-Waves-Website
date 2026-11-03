import {
  pgTable,
  text,
  smallint,
  integer,
  numeric,
  date,
  jsonb,
  timestamp,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";

export const characters = pgTable("characters", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  rarity: smallint("rarity").notNull(),
  weaponType: text("weapon_type").notNull(),
  attribute: text("attribute").notNull(),
  recommendedWeaponId: text("recommended_weapon_id"),
  releaseDate: date("release_date"),
  iconUrl: text("icon_url"),
  secondaryIconUrl: text("secondary_icon_url"),
  splashArtUrl: text("splash_art_url"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characterSkills = pgTable("character_skills", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  skillType: text("skill_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  multiplierTable: jsonb("multiplier_table").notNull().default({}),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const characterResonanceChain = pgTable(
  "character_resonance_chain",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    tier: smallint("tier").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    effectValue: jsonb("effect_value").notNull().default({}),
    iconUrl: text("icon_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.characterId, t.tier)],
);

export const growthCurves = pgTable(
  "growth_curves",
  {
    curveId: integer("curve_id").notNull(),
    level: smallint("level").notNull(),
    breachLevel: smallint("breach_level").notNull(),
    curveValue: integer("curve_value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.curveId, t.level, t.breachLevel] })],
);

export const weapons = pgTable("weapons", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  weaponType: text("weapon_type").notNull(),
  rarity: smallint("rarity").notNull(),
  baseAtk: numeric("base_atk").notNull(),
  firstCurveId: integer("first_curve_id").notNull(),
  mainStat: text("main_stat").notNull(),
  mainStatValue: numeric("main_stat_value").notNull(),
  secondCurveId: integer("second_curve_id").notNull(),
  passiveName: text("passive_name"),
  passiveDescription: text("passive_description"),
  passiveScaling: jsonb("passive_scaling").notNull().default({}),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sonataSets = pgTable("sonata_sets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  onePieceEffect: text("one_piece_effect"),
  twoPieceEffect: text("two_piece_effect"),
  threePieceEffect: text("three_piece_effect"),
  fivePieceEffect: text("five_piece_effect"),
  iconUrl: text("icon_url"),
});

export const echoes = pgTable("echoes", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  cost: numeric("cost").notNull(),
  rarity: smallint("rarity").notNull(),
  skillDescription: text("skill_description"),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const echoSonataSets = pgTable(
  "echo_sonata_sets",
  {
    echoId: text("echo_id")
      .notNull()
      .references(() => echoes.id, { onDelete: "cascade" }),
    sonataSetId: text("sonata_set_id")
      .notNull()
      .references(() => sonataSets.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.echoId, t.sonataSetId] })],
);

export const characterEchoSetRecommendations = pgTable("character_echo_set_recommendations", {
  characterId: text("character_id")
    .primaryKey()
    .references(() => characters.id, { onDelete: "cascade" }),
  sonataSetId: text("sonata_set_id")
    .notNull()
    .references(() => sonataSets.id, { onDelete: "cascade" }),
  pieceCount: smallint("piece_count"),
  layout: jsonb("layout"),
  mainEchoId: text("main_echo_id").references(() => echoes.id, { onDelete: "set null" }),
  mainStat: text("main_stat"),
  secondarySonataSetId: text("secondary_sonata_set_id").references(() => sonataSets.id, {
    onDelete: "set null",
  }),
  secondaryPieceCount: smallint("secondary_piece_count"),
  source: text("source").notNull().default("automated_scored"),
});

export const materials = pgTable("materials", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  materialType: text("material_type").notNull(),
  rarity: smallint("rarity"),
  iconUrl: text("icon_url"),
});

export const characterMaterialCosts = pgTable(
  "character_material_costs",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    materialId: text("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    phase: smallint("phase").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.materialId, t.phase] })],
);

export const characterSkillMaterialCosts = pgTable(
  "character_skill_material_costs",
  {
    skillId: text("skill_id")
      .notNull()
      .references(() => characterSkills.id, { onDelete: "cascade" }),
    materialId: text("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    level: smallint("level").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.skillId, t.materialId, t.level] })],
);

export const weaponMaterialCosts = pgTable(
  "weapon_material_costs",
  {
    weaponId: text("weapon_id")
      .notNull()
      .references(() => weapons.id, { onDelete: "cascade" }),
    materialId: text("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    phase: smallint("phase").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.weaponId, t.materialId, t.phase] })],
);

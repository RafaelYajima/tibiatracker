import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Tabela `characters` — bonecos da conta do usuário.
 * Dados (level/vocation/world) são preenchidos via TibiaData API
 * e representam um snapshot (podem ser atualizados a qualquer hora).
 */
export const characters = pgTable(
  "characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: text("name").notNull().unique(),
    world: text("world"),
    vocation: text("vocation"),
    level: integer("level").notNull().default(0),
  },
  (t) => [index("characters_name_idx").on(t.name)],
);

/**
 * Tabela `hunts` — uma linha por sessão de hunt/boss rotation.
 * O `balance` já vem calculado pelo Hunt Analyser (loot - supplies).
 * `character_id` vincula o ganho ao boneco (null = sem vínculo).
 */
export const hunts = pgTable(
  "hunts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    characterId: uuid("character_id").references(() => characters.id, { onDelete: "set null" }),
    duration: text("duration").notNull(),
    loot: integer("loot").notNull().default(0),
    supplies: integer("supplies").notNull().default(0),
    balance: integer("balance").notNull().default(0),
    xpGain: integer("xp_gain").notNull().default(0),
    xpPerHour: integer("xp_per_hour").notNull().default(0),
    rawText: text("raw_text"),
  },
  (t) => [
    index("hunts_created_at_idx").on(t.createdAt),
    index("hunts_character_id_idx").on(t.characterId),
  ],
);

/**
 * Tabela `hunt_items` — itens dropados/usados em cada hunt.
 * Se a hunt for deletada, os itens caem junto (cascade).
 */
export const huntItems = pgTable(
  "hunt_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    huntId: uuid("hunt_id")
      .notNull()
      .references(() => hunts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    qty: integer("qty").notNull().default(0),
  },
  (t) => [
    index("hunt_items_hunt_id_idx").on(t.huntId),
    index("hunt_items_name_idx").on(t.name),
  ],
);

export type CharacterRow = typeof characters.$inferSelect;
export type NewCharacterRow = typeof characters.$inferInsert;
export type HuntRow = typeof hunts.$inferSelect;
export type NewHuntRow = typeof hunts.$inferInsert;
export type HuntItemRow = typeof huntItems.$inferSelect;
export type NewHuntItemRow = typeof huntItems.$inferInsert;

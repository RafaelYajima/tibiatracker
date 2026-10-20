import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Usuários do TibiaTracker.
 * Cada conta enxerga apenas seus personagens e hunts.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

/**
 * Sessões persistidas no banco.
 * O cookie guarda o token bruto; no banco salvamos apenas o SHA-256 dele.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_at_idx").on(t.expiresAt)],
);

/**
 * Tabela `characters` — bonecos de um usuário.
 * Dados (level/vocation/world) são preenchidos via TibiaData API e representam um snapshot.
 */
export const characters = pgTable(
  "characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    world: text("world"),
    vocation: text("vocation"),
    level: integer("level").notNull().default(0),
  },
  (t) => [index("characters_user_id_idx").on(t.userId), index("characters_name_idx").on(t.name)],
);

/**
 * Tabela `hunts` — uma linha por sessão de hunt/boss rotation.
 * `user_id` isola os dados por conta; `character_id` vincula ao boneco.
 */
export const hunts = pgTable(
  "hunts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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
    index("hunts_user_id_idx").on(t.userId),
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
  (t) => [index("hunt_items_hunt_id_idx").on(t.huntId), index("hunt_items_name_idx").on(t.name)],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
export type CharacterRow = typeof characters.$inferSelect;
export type NewCharacterRow = typeof characters.$inferInsert;
export type HuntRow = typeof hunts.$inferSelect;
export type NewHuntRow = typeof hunts.$inferInsert;
export type HuntItemRow = typeof huntItems.$inferSelect;
export type NewHuntItemRow = typeof huntItems.$inferInsert;

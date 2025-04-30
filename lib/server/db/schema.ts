import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations, type InferSelectModel } from "drizzle-orm"
import { type EndlessSettings } from "@/lib/common/constants"

export const userTable = pgTable("userTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  googleId: text("google_id").unique(),
  name: text("name"),
  pictureURL: text("picture_url"),
  isAnonymous: boolean("is_anonymous").default(true),
  endlessSettings: jsonb("endless_settings").$type<EndlessSettings>(),
  endlessLevelCount: integer("endless_level_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .references(() => userTable.id)
    .notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
})

export const expeditions = pgTable("expeditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => userTable.id),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  seed: text("seed").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const expertLevels = pgTable("expert_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => userTable.id),
  expeditionId: uuid("expedition_id").references(() => expeditions.id),
  levelNumber: integer("level_number").notNull(),
  levelData: text("level_data").array().notNull(), // Boxoban format array
  completed: boolean("completed").default(false),
  steps: integer("steps"),
  timeMs: integer("time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
})

export const endlessLevels = pgTable("endless_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => userTable.id),
  levelData: text("level_data").array().notNull(),
  setting: jsonb("endless_settings").$type<EndlessSettings>(),
  isCompleted: boolean("is_completed").default(false),
  steps: integer("steps"),
  timeMs: integer("time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at").defaultNow(),
})

// Relations
export const userRelations = relations(userTable, ({ many }) => ({
  expeditions: many(expeditions),
  expertLevels: many(expertLevels),
  endlessLevels: many(endlessLevels),
}))

export const expeditionsRelations = relations(expeditions, ({ one, many }) => ({
  user: one(userTable, {
    fields: [expeditions.userId],
    references: [userTable.id],
  }),
  levels: many(expertLevels),
}))

export const expertLevelsRelations = relations(expertLevels, ({ one }) => ({
  user: one(userTable, {
    fields: [expertLevels.userId],
    references: [userTable.id],
  }),
  expedition: one(expeditions, {
    fields: [expertLevels.expeditionId],
    references: [expeditions.id],
  }),
}))

export const endlessLevelsRelations = relations(endlessLevels, ({ one }) => ({
  user: one(userTable, {
    fields: [endlessLevels.userId],
    references: [userTable.id],
  }),
}))

export type User = InferSelectModel<typeof userTable>
export type Session = InferSelectModel<typeof sessionTable>
export type EndlessLevel = InferSelectModel<typeof endlessLevels>

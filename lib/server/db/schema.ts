import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  uuid,
  jsonb,
  unique,
} from "drizzle-orm/pg-core"
import { relations, type InferSelectModel } from "drizzle-orm"
import { type EndlessSettings } from "@/lib/common/constants"

export const userTable = pgTable("userTable", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  googleId: text("google_id").unique(),
  name: text("name"),
  pictureURL: text("picture_url"),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at").defaultNow(),
})

export const endlessUserData = pgTable("endless_user_data", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .references(() => userTable.id)
    .notNull()
    .unique(),
  settings: jsonb("settings").$type<EndlessSettings>(),
  levelCount: integer("level_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  customWidth: integer("custom_width"),
  customHeight: integer("custom_height"),
  customBoxes: integer("custom_boxes"),
  customMinWalls: integer("custom_min_walls"),
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

export const spikeVaults = pgTable(
  "spike_vaults",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: integer("user_id").references(() => userTable.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    seed: text("seed").notNull(),
    description: text("description"),
    depthGoal: integer("depth_goal").notNull().default(20),
    currentDepth: integer("current_depth").default(0),
    status: text("status").notNull().default("in_progress"),
    deleted: boolean("deleted").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique("unique_user_slug").on(table.userId, table.slug)]
)

export const spikeVaultLevels = pgTable("spike_vault_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => userTable.id),
  spikeVaultId: uuid("spike_vault_id").references(() => spikeVaults.id),
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
  levelNumber: integer("level_number").notNull(),
  setting: jsonb("endless_settings").$type<EndlessSettings>(),
  isCompleted: boolean("is_completed").default(false),
  steps: integer("steps"),
  timeMs: integer("time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at").defaultNow(),
})

export const boxobanLevels = pgTable("boxoban_levels", {
  levelId: text("level_id").primaryKey(), // e.g., "medium-0-420"
  category: text("category").notNull(), // "medium" | "hard" | "unfiltered"
  fileNumber: integer("file_number").notNull(),
  levelNumber: integer("level_number").notNull(),
  assignedTo: integer("assigned_to").references(() => userTable.id),
  status: text("status").notNull().default("available"), // 'available' | 'assigned' | 'solved'
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const boxobanGlobalProgress = pgTable("boxoban_global_progress", {
  category: text("category").primaryKey(), // e.g., "medium"
  totalLevels: integer("total_levels").notNull(), // e.g., 450000
  solvedLevels: integer("solved_levels").default(0),
  discardedLevels: integer("discarded_levels").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const boxobanUserData = pgTable("boxoban_user_data", {
  userId: integer("user_id")
    .references(() => userTable.id)
    .primaryKey(),

  currentLevelId: text("current_level_id").references(
    () => boxobanLevels.levelId
  ),

  mode: text("mode", { enum: ["medium", "hard", "unfiltered"] }).notNull(),

  mediumSolved: integer("medium_solved").default(0),
  hardSolved: integer("hard_solved").default(0),
  unfilteredSolved: integer("unfiltered_solved").default(0),
  totalSolved: integer("total_solved").default(0),

  updatedAt: timestamp("updated_at").defaultNow(),
})

// Relations
export const userRelations = relations(userTable, ({ many, one }) => ({
  spikeVaults: many(spikeVaults),
  spikeVaultLevels: many(spikeVaultLevels),
  endlessLevels: many(endlessLevels),
  endlessUserData: one(endlessUserData),
}))

export const endlessUserDataRelations = relations(
  endlessUserData,
  ({ one }) => ({
    user: one(userTable, {
      fields: [endlessUserData.userId],
      references: [userTable.id],
    }),
  })
)

export const spikeVaultsRelations = relations(spikeVaults, ({ one, many }) => ({
  user: one(userTable, {
    fields: [spikeVaults.userId],
    references: [userTable.id],
  }),
  levels: many(spikeVaultLevels),
}))

export const spikeVaultLevelsRelations = relations(
  spikeVaultLevels,
  ({ one }) => ({
    user: one(userTable, {
      fields: [spikeVaultLevels.userId],
      references: [userTable.id],
    }),
    spikeVault: one(spikeVaults, {
      fields: [spikeVaultLevels.spikeVaultId],
      references: [spikeVaults.id],
    }),
  })
)

export const endlessLevelsRelations = relations(endlessLevels, ({ one }) => ({
  user: one(userTable, {
    fields: [endlessLevels.userId],
    references: [userTable.id],
  }),
}))

export const boxobanLevelsRelations = relations(boxobanLevels, ({ one }) => ({
  assignedUser: one(userTable, {
    fields: [boxobanLevels.assignedTo],
    references: [userTable.id],
  }),
}))

export const boxobanUserDataRelations = relations(
  boxobanUserData,
  ({ one }) => ({
    user: one(userTable, {
      fields: [boxobanUserData.userId],
      references: [userTable.id],
    }),
    currentLevel: one(boxobanLevels, {
      fields: [boxobanUserData.currentLevelId],
      references: [boxobanLevels.levelId],
    }),
  })
)

export type User = InferSelectModel<typeof userTable>
export type Session = InferSelectModel<typeof sessionTable>
export type SpikeVault = InferSelectModel<typeof spikeVaults>
export type SpikeVaultLevel = InferSelectModel<typeof spikeVaultLevels>
export type EndlessLevel = InferSelectModel<typeof endlessLevels>
export type EndlessUserData = InferSelectModel<typeof endlessUserData>
export type BoxobanLevel = InferSelectModel<typeof boxobanLevels>
export type BoxobanGlobalProgress = InferSelectModel<
  typeof boxobanGlobalProgress
>
export type BoxobanUserData = InferSelectModel<typeof boxobanUserData>

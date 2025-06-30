"use server"

import { PAGE_SIZE } from "@/lib/common/constants"
import { db } from "@/lib/server/db"
import { overclockLevels } from "@/lib/server/db/schema"
import { authActionClient } from "@/lib/server/safe-action"
import { and, eq, sql, desc } from "drizzle-orm"
import { type PgColumn } from "drizzle-orm/pg-core"
import { z } from "zod"
import { checkOverclockAccess } from "./queries"

export type OverclockRecordsParams = z.infer<
  typeof overclockRecordsParamsSchema
>

const overclockRecordsParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  sortBy: z
    .enum(["levelNumber", "steps", "timeMs", "completedAt"])
    .default("completedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export const getOverclockRecords = authActionClient
  .metadata({ actionName: "getOverclockRecords" })
  .schema(overclockRecordsParamsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { page, sortBy, sortOrder } = parsedInput
    const { user } = ctx
    const offset = (page - 1) * PAGE_SIZE

    // Check if user has access to Overclock mode
    const hasAccess = await checkOverclockAccess(user.id)
    if (!hasAccess) {
      throw new Error("Access denied. Overclock mode requires premium access.")
    }

    // Build the base query
    const baseQuery = and(
      eq(overclockLevels.userId, user.id),
      eq(overclockLevels.completed, true)
    )

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(overclockLevels)
      .where(baseQuery)

    // Determine sort column
    const sortColumn: PgColumn = (() => {
      switch (sortBy) {
        case "levelNumber":
          return overclockLevels.levelNumber
        case "steps":
          return overclockLevels.steps
        case "timeMs":
          return overclockLevels.timeMs
        case "completedAt":
          return overclockLevels.completedAt
        default:
          return overclockLevels.completedAt
      }
    })()

    // Get records with pagination and sorting
    const records = await db
      .select()
      .from(overclockLevels)
      .where(baseQuery)
      .orderBy(sortOrder === "asc" ? sortColumn : desc(sortColumn))
      .limit(PAGE_SIZE)
      .offset(offset)

    const totalPages = Math.ceil(count / PAGE_SIZE)

    return {
      records,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: PAGE_SIZE,
      },
      sortBy,
      sortOrder,
    }
  })

export const checkPaymentStatus = authActionClient
  .metadata({ actionName: "checkPaymentStatus" })
  .action(async ({ ctx }) => {
    const { user } = ctx
    const hasAccess = await checkOverclockAccess(user.id)
    return { hasAccess }
  })

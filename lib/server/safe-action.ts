import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"
import "server-only"
import { getCurrentSession } from "./auth/session"

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  defineMetadataSchema: () =>
    z.object({
      actionName: z.string(),
    }),
  handleServerError: (err, utils) => {
    console.error(`Error in ${utils.metadata.actionName}:`, err)

    if (err instanceof ActionError) {
      return {
        type: "action-error",
        message: err.message,
      }
    }

    return {
      type: "internal-error",
      message: "Internal server error",
    }
  },
})

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await getCurrentSession()

  if (!session.user || !session.session) {
    throw new ActionError("Unauthorized")
  }

  return next({ ctx: { user: session.user, session: session.session } })
})

import { redirect } from "next/navigation"
import { getCurrentSession, type SessionValidationResult } from "./session"

export type ValidatedSession = Exclude<
  SessionValidationResult,
  { session: null; user: null }
>

type Handler<TArgs extends unknown[], TReturnType> = (
  session: ValidatedSession,
  ...args: TArgs
) => Promise<TReturnType>

export function withSessionValidated<TArgs extends unknown[], TReturnType>(
  handler: Handler<TArgs, TReturnType>
) {
  return async (...args: TArgs): Promise<TReturnType> => {
    const session = await getCurrentSession()

    if (!session.user || !session.session) {
      return redirect("/")
    }

    return handler(session, ...args)
  }
}

export function withSessionValidatedPage<TProps extends object>(
  Component: React.ComponentType<TProps & { session: ValidatedSession }>
) {
  return async (props: TProps) => {
    const session = await getCurrentSession()

    if (!session.user || !session.session) {
      return redirect("/")
    }

    return <Component session={session} {...props} />
  }
}

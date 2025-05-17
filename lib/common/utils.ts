type TrySuccess<T> = {
  status: "ok"
  data: T
}

type TryError = {
  status: "error"
  error: Error
}

type TryResult<T> = TrySuccess<T> | TryError

export async function withTryCatch<T>(
  promise: Promise<T>
): Promise<TryResult<T>> {
  try {
    const data = await promise
    return { status: "ok", data }
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error(`Unknown error: ${JSON.stringify(err)}`)
    return {
      status: "error",
      error,
    }
  }
}

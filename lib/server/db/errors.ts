type NeonDbErrorLike = {
  code: string
  constructor: { name: string }
}

export function isNeonDbError(err: unknown): err is NeonDbErrorLike {
  return (
    typeof err === "object" &&
    err !== null &&
    "constructor" in err &&
    typeof err.constructor?.name === "string" &&
    err.constructor.name === "DatabaseError" &&
    "code" in err &&
    typeof err.code === "string"
  )
}

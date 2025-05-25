const baseUrl = process.env.SITE_URL

export async function checkSolution({
  level,
  solution,
}: {
  level: string
  solution: string
}) {
  const response = await fetch(`${baseUrl}/api/check-solution/index`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      level,
      solution,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to verify solution.")
  }

  const { isValid } = await response.json()

  return isValid
}

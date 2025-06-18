import { googleGenAI } from "."
import { Type } from "@google/genai"

export async function generateVaultData(
  partialVaultData: Partial<{
    name: string
    description: string
    depthGoal: number
  }>
) {
  const prompt = `You are an assistant for a Sokoban-based puzzle game called Sokoverse. In the "Spike Vaults" mode, players explore procedurally generated dungeons that increase in difficulty.

Your task is to complete missing information in a partially filled vault configuration object. Each vault includes:
- A **unique name** that evokes mystery, danger, or curiosity — it can be whimsical, dark, ancient, cryptic, etc.
- A **depth goal**: how many puzzle levels the player must clear (between 20 and 100)
- A **short description** (under 200 characters) to set the mood or hint at the journey ahead

Only generate values for fields that are missing or empty. Leave user-provided fields unchanged.

You're encouraged to vary styles across themes — sci-fi, ancient ruins, arcane, surreal, mythic, glitchy tech, cosmic, cursed artifacts, or anything atmospheric.

Do **not** reuse names. Be original.

### Input:
${JSON.stringify(partialVaultData)}

Output a single complete JSON object with filled fields. Keep existing values unchanged. The name must be **distinct from all prior names**, even if similar in style.
`

  const response = await googleGenAI.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            minLength: 3,
            maxLength: 50,
          },
          description: {
            type: Type.STRING,
            maxLength: 200,
          },
          depthGoal: {
            type: Type.NUMBER,
            minimum: 20,
            maximum: 100,
          },
        },
        propertyOrdering: ["name", "description", "depthGoal"],
      },
    },
  })

  return response.text
}

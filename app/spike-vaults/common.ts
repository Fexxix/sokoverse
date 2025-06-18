import { generateSpikeVaultLevel } from "@/lib/server/auto-sokoban"
import { db } from "@/lib/server/db"
import { type SpikeVault, spikeVaultLevels } from "@/lib/server/db/schema"

export async function createNextSpikeVaultLevel({
  userId,
  vault,
}: {
  userId: number
  vault: SpikeVault
}) {
  const data = await generateSpikeVaultLevel(
    Number(vault.seed),
    vault.currentDepth! + 1
  )

  const [nextLevel] = await db
    .insert(spikeVaultLevels)
    .values({
      userId: userId,
      spikeVaultId: vault.id,
      levelNumber: vault.currentDepth! + 1,
      levelData: data.level,
      completed: false,
      createdAt: new Date(),
    })
    .returning()

  return nextLevel
}

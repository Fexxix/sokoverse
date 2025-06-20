import { Package, Settings, Lock } from "lucide-react"

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case "unfiltered":
      return <Package className="w-4 h-4" />
    case "medium":
      return <Settings className="w-4 h-4" />
    case "hard":
      return <Lock className="w-4 h-4" />
    default:
      return <Package className="w-4 h-4" />
  }
}

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "unfiltered":
      return "text-green-400"
    case "medium":
      return "text-yellow-400"
    case "hard":
      return "text-red-400"
    default:
      return "text-green-400"
  }
}

const BOXOBAN_DATASET_REPO_URL =
  "https://raw.githubusercontent.com/Fexxix/boxoban-levels/refs/heads/master"

export async function getBoxobanLevel({
  category,
  fileNumber,
  levelNumber,
}: {
  category: string
  fileNumber: number
  levelNumber: number
}) {
  const response = await fetch(
    `${BOXOBAN_DATASET_REPO_URL}/${category}/${fileNumber}.txt`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch level ${fileNumber}`)
  }

  const text = await response.text()

  const level = text
    .replace(";", "")
    .split(";")
    [levelNumber].split("\n")
    .slice(1, 11)

  return level
}

"use client"

import { usePathname } from "next/navigation"
import { useRouter } from "nextjs-toploader/app"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ENDLESS_PRESET_CONFIG } from "@/lib/common/constants"

interface PresetFilterProps {
  currentPreset?: string
}

export default function PresetFilter({ currentPreset }: PresetFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handlePresetChange = (value: string) => {
    if (value === "all") {
      router.push(pathname)
    } else {
      router.push(`${pathname}?preset=${value}`)
    }
  }

  const currentValue = isValidPreset(currentPreset || "all")
    ? currentPreset
    : "all"

  return (
    <div className="flex items-center space-x-2">
      <span className="font-mono text-sm">Filter:</span>
      <Select value={currentValue} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px] pixelated-border">
          <SelectValue placeholder="Filter by difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Difficulties</SelectItem>
          <SelectItem value="casual">Casual</SelectItem>
          <SelectItem value="balanced">Balanced</SelectItem>
          <SelectItem value="challenging">Challenging</SelectItem>
          <SelectItem value="extended">Extended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function isValidPreset(preset: string) {
  return Object.keys(ENDLESS_PRESET_CONFIG).includes(preset)
}

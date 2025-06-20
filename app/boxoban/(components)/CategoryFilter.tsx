"use client"

import { Package, Settings, Lock, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "nextjs-toploader/app"
import { usePathname, useSearchParams } from "next/navigation"

interface CategoryFilterProps {
  currentCategory?: "medium" | "hard" | "unfiltered"
}

const categories = [
  {
    value: undefined,
    label: "All Categories",
    icon: Filter,
    color: "text-foreground",
  },
  {
    value: "unfiltered" as const,
    label: "Unfiltered",
    icon: Package,
    color: "text-green-400",
  },
  {
    value: "medium" as const,
    label: "Medium",
    icon: Settings,
    color: "text-yellow-400",
  },
  {
    value: "hard" as const,
    label: "Hard",
    icon: Lock,
    color: "text-red-400",
  },
]

export default function CategoryFilter({ currentCategory }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleCategoryChange = (category?: "medium" | "hard" | "unfiltered") => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }
    
    // Reset to page 1 when changing category
    params.delete("page")

    router.push(`${pathname}?${params.toString()}`)
  }

  const currentCategoryData = categories.find(cat => cat.value === currentCategory) || categories[0]
  const CurrentIcon = currentCategoryData.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="pixelated-border font-mono"
        >
          <CurrentIcon className="w-3 h-3 mr-2" />
          {currentCategoryData.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {categories.map((category) => {
          const Icon = category.icon
          const isSelected = category.value === currentCategory
          
          return (
            <DropdownMenuItem
              key={category.value || "all"}
              onClick={() => handleCategoryChange(category.value)}
              className={`cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className={`w-4 h-4 ${category.color}`} />
                <span className={`font-mono ${category.color} ${isSelected ? "font-bold" : ""}`}>
                  {category.label}
                  {isSelected && " ✓"}
                </span>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

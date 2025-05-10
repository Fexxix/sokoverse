"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/client/utils"

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const themes = [
    { name: "Green Terminal", value: "green", color: "bg-green-500" },
    { name: "Cyber Blue", value: "blue", color: "bg-blue-500" },
    { name: "Deep Purple", value: "purple", color: "bg-purple-500" },
    { name: "Classic Monochrome", value: "monochrome", color: "bg-gray-500" },
  ]

  if (!mounted) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="pixelated-border">
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 font-mono [font-size:1rem_!important]"
        align="end"
      >
        <div className="space-y-2">
          <h4 className="font-pixel text-sm">Color Theme</h4>
          <div className="grid grid-cols-1 gap-2">
            {themes.map((t) => (
              <Button
                key={t.value}
                variant={theme === t.value ? "default" : "outline"}
                size="sm"
                className={cn("justify-start font-mono text-xs h-auto py-2", {
                  "bg-primary/70": theme === t.value,
                })}
                onClick={() => {
                  document.documentElement.className = t.value
                  setTheme(t.value)
                  setOpen(false)
                }}
              >
                <div
                  className={`mr-2 h-3 w-3 rounded-full ${t.color}`}
                  style={{
                    boxShadow: `0 0 8px ${t.color
                      .replace("bg-", "")
                      .replace("-500", "")}`,
                  }}
                />
                {t.name}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ThemeSwitcher

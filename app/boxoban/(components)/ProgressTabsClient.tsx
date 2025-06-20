"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { type ReactNode, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, User } from "lucide-react"

interface ProgressTabsClientProps {
  globalContent: ReactNode
  personalContent: ReactNode
}

type ProgressTab = "global" | "personal"

export default function ProgressTabsClient({
  globalContent,
  personalContent,
}: ProgressTabsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const tabParam = searchParams.get("tab")
  const [selectedTab, setSelectedTab] = useState<ProgressTab>(
    tabParam === "personal" ? "personal" : "global"
  )

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as ProgressTab)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("tab", tab)
    router.replace(newUrl.toString(), { scroll: false })
  }

  return (
    <Tabs
      value={selectedTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="pixelated-border font-pixel grid w-full grid-cols-2">
        <TabsTrigger value="global" className="flex items-center gap-2">
          <Globe className="w-3 h-3" />
          Global Progress
        </TabsTrigger>
        <TabsTrigger value="personal" className="flex items-center gap-2">
          <User className="w-3 h-3" />
          Personal Progress
        </TabsTrigger>
      </TabsList>

      <TabsContent value="global" className="mt-6">
        {globalContent}
      </TabsContent>

      <TabsContent value="personal" className="mt-6">
        {personalContent}
      </TabsContent>
    </Tabs>
  )
}

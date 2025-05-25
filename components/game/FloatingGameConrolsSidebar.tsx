import { Terminal, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip"

type FloatingGameConrolsSidebarProps = {
  onReset: () => void
  isLoading?: boolean
  children?: React.ReactNode
}

export function FloatingGameConrolsSidebar({
  onReset,
  isLoading = false,
  children,
}: FloatingGameConrolsSidebarProps) {
  return (
    <TooltipProvider>
      <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 justify-between items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label="Return to terminal"
            >
              <Link href="/terminal">
                <Terminal className="h-5 w-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">Return to terminal</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onReset}
              aria-label="Reset level"
              disabled={isLoading}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-mono">Reset level (R)</p>
          </TooltipContent>
        </Tooltip>

        {children}
      </div>
    </TooltipProvider>
  )
}

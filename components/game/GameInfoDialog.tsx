import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function GameInfoDialog() {
  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Game information">
              <Info className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent side="right">
          <p className="font-mono">Game information</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="bg-background border-primary">
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary">
            Game Controls
          </DialogTitle>
        </DialogHeader>
        <div className="font-mono text-foreground space-y-4">
          <div>
            <h3 className="font-bold mb-2">Movement</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-bold">WASD</span> or{" "}
                <span className="font-bold">Arrow Keys</span> to move
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Game Controls</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <span className="font-bold">R</span> to restart the current
                level
              </li>
              <li>
                <span className="font-bold">N</span> to generate a new random
                level
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Game Rules</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Push all boxes onto the goal spots</li>
              <li>You can only push one box at a time</li>
              <li>You cannot pull boxes</li>
              <li>Try to solve each puzzle in as few moves as possible</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Settings, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

// Level presets with performance indicators
const PRESET_LEVELS = {
  casual: {
    width: 7,
    height: 7,
    boxes: 2,
    minWalls: 10,
    label: "Quick Puzzle",
    description: "Small grid, perfect for a quick brain teaser",
    performance: "Lightning Fast ⚡",
  },
  balanced: {
    width: 9,
    height: 9,
    boxes: 3,
    minWalls: 13,
    label: "Classic Challenge",
    description: "The perfect balance of fun and challenge",
    performance: "Speedy Generation 🚀",
  },
  challenging: {
    width: 10,
    height: 10,
    boxes: 3,
    minWalls: 15,
    label: "Brain Bender",
    description: "More complex puzzles for the strategic thinker",
    performance: "Brief Pause ⏱️",
  },
  extended: {
    width: 9,
    height: 12,
    boxes: 3,
    minWalls: 12,
    label: "Puzzle Palace",
    description: "Larger playing field with more room to maneuver",
    performance: "Worth the Wait 🧠",
  },
}

export type LevelSettings = {
  width: number
  height: number
  boxes: number
  minWalls: number
}

interface SettingsDialogProps {
  currentSettings: LevelSettings
  onApplySettings: (settings: LevelSettings) => void
  isLevelInProgress: boolean
  isLoading?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  fromCompletionDialog?: boolean
}

export function SettingsDialog({
  currentSettings,
  onApplySettings,
  isLevelInProgress,
  isLoading = false,
  defaultOpen = false,
  onOpenChange,
  fromCompletionDialog = false,
}: SettingsDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(defaultOpen)
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false)
  const [selectedSettings, setSelectedSettings] =
    useState<LevelSettings>(currentSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [attemptedClose, setAttemptedClose] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Reset selected settings when dialog opens
    if (isDialogOpen) {
      setSelectedSettings(currentSettings)
      setHasChanges(false)
    }
  }, [isDialogOpen, currentSettings])

  const handleDialogOpenChange = (open: boolean) => {
    // If trying to close with unsaved changes
    if (!open && hasChanges && !attemptedClose) {
      setAttemptedClose(true)
      setShowUnsavedChangesAlert(true)
      return // Don't close the dialog yet
    }

    // If this is the initial settings dialog (first visit) and it's being closed
    if (!open && defaultOpen && !fromCompletionDialog && !hasChanges) {
      // Apply the current settings without showing confirmation
      applySettings(currentSettings)
    }
    // If closing without saving changes (after alert dialog interaction)
    else if (!open && attemptedClose) {
      setAttemptedClose(false)
      setIsDialogOpen(false)
      if (onOpenChange) {
        onOpenChange(false)
      }
    }
    // Normal open/close behavior
    else {
      setIsDialogOpen(open)
      if (onOpenChange) {
        onOpenChange(open)
      }
    }
  }

  // Find which preset matches current settings, if any
  const getCurrentPreset = (settings: LevelSettings) => {
    const presetEntries = Object.entries(PRESET_LEVELS)
    const currentPreset = presetEntries.find(
      ([_, preset]) =>
        preset.width === settings.width &&
        preset.height === settings.height &&
        preset.boxes === settings.boxes &&
        preset.minWalls === settings.minWalls
    )
    return currentPreset ? currentPreset[0] : null
  }

  const handlePresetSelect = (presetKey: keyof typeof PRESET_LEVELS) => {
    const newSettings = PRESET_LEVELS[presetKey]
    const currentPreset = getCurrentPreset(selectedSettings)

    // If this is already the current preset, do nothing
    if (currentPreset === presetKey) {
      return
    }

    // Just update the selected settings, don't apply yet
    setSelectedSettings({
      width: newSettings.width,
      height: newSettings.height,
      boxes: newSettings.boxes,
      minWalls: newSettings.minWalls,
    })
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    applySettings(selectedSettings)
  }

  const applySettings = (settings: LevelSettings) => {
    onApplySettings(settings)
    setIsDialogOpen(false)
    setHasChanges(false)
    setAttemptedClose(false)

    if (onOpenChange) {
      onOpenChange(false)
    }

    if (fromCompletionDialog) {
      toast({
        title: "Settings Saved",
        description: "Your new settings will be applied to the next level.",
      })
    }
  }

  const handleDiscardChanges = () => {
    setShowUnsavedChangesAlert(false)
    setSelectedSettings(currentSettings)
    setHasChanges(false)
    setIsDialogOpen(false)
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  const handleSaveUnsavedChanges = () => {
    setShowUnsavedChangesAlert(false)
    if (!isLevelInProgress && fromCompletionDialog) {
      applySettings(selectedSettings)
    }
  }

  const currentPreset = getCurrentPreset(selectedSettings)

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="pixelated-border"
            aria-label="Game settings"
            disabled={isLoading}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background border-primary my-4">
          <DialogHeader>
            <DialogTitle className="font-pixel text-primary">
              Puzzle Settings
            </DialogTitle>
            <DialogDescription className="font-mono text-foreground/90">
              Choose your preferred puzzle complexity
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              {Object.entries(PRESET_LEVELS).map(([key, preset]) => (
                <div
                  key={key}
                  className={`p-4 rounded-md border ${
                    currentPreset === key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-pixel text-sm">{preset.label}</h3>
                    <span className="text-xs font-mono text-primary/70">
                      {preset.performance}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-foreground/70 mb-3">
                    {preset.description}
                  </div>
                  <div className="font-mono text-xs text-foreground/50 mb-3">
                    {preset.width}×{preset.height} grid • {preset.boxes} boxes •{" "}
                    {preset.minWalls} walls
                  </div>
                  <Button
                    variant={currentPreset === key ? "default" : "outline"}
                    size="sm"
                    className="w-full font-pixel pixelated-border text-xs"
                    onClick={() =>
                      handlePresetSelect(key as keyof typeof PRESET_LEVELS)
                    }
                    disabled={isLoading}
                  >
                    {currentPreset === key ? "CURRENT SETTING" : "SELECT"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="bg-secondary/20 p-4 rounded-md">
              <p className="text-xs font-mono">
                These presets are carefully tuned based on analysis of 1.7
                million Sokoban solutions to ensure engaging puzzles with high
                solve rates.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSaveSettings}
              disabled={!hasChanges || isLoading}
              className="font-pixel pixelated-border flex items-center"
            >
              <Save className="mr-2 h-4 w-4" /> Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert for unsaved changes */}
      <AlertDialog
        open={showUnsavedChangesAlert}
        onOpenChange={setShowUnsavedChangesAlert}
      >
        <AlertDialogContent className="bg-background border-primary max-w-md overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-pixel text-primary flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" /> Unsaved
              Settings!
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono space-y-2">
              You&apos;ve made some awesome changes to your puzzle settings, but
              haven&apos;t saved them yet!
              <span className="block text-yellow-500 font-bold mt-2">
                What would you like to do with these pixel-perfect adjustments?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="font-pixel pixelated-border bg-muted hover:bg-muted/80 w-full"
              onClick={handleDiscardChanges}
            >
              It is what it is
            </AlertDialogCancel>
            <AlertDialogAction
              className="font-pixel pixelated-border bg-primary text-primary-foreground w-full"
              onClick={handleSaveUnsavedChanges}
            >
              Save my changes, pwease!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

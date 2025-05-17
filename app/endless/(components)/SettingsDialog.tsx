"use client"

import { useState, useEffect } from "react"
import { Settings, Save, AlertTriangle, Loader2 } from "lucide-react"
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
import {
  ENDLESS_PRESET_CONFIG,
  type EndlessSettings,
} from "@/lib/common/constants"
import { saveSettings } from "@/app/endless/actions"
import { useMutation } from "@tanstack/react-query"

// Level presets with performance indicators
export const PRESET_LEVELS_WITH_DESCRIPTION = {
  casual: {
    ...ENDLESS_PRESET_CONFIG.casual,
    label: "Quick Puzzle",
    description: "Small grid, perfect for a quick brain teaser",
    performance: "Lightning Fast ⚡",
  },
  balanced: {
    ...ENDLESS_PRESET_CONFIG.balanced,
    label: "Classic Challenge",
    description: "The perfect balance of fun and challenge",
    performance: "Speedy Generation 🚀",
  },
  challenging: {
    ...ENDLESS_PRESET_CONFIG.challenging,
    label: "Brain Bender",
    description: "More complex puzzles for the strategic thinker",
    performance: "Brief Pause ⏱️",
  },
  extended: {
    ...ENDLESS_PRESET_CONFIG.extended,
    label: "Puzzle Palace",
    description: "Larger playing field with more room to maneuver",
    performance: "Worth the Wait 🧠",
  },
} as const

interface SettingsDialogProps {
  isLoading?: boolean
  fromCompletionDialog?: boolean
  endlessSettings: EndlessSettings | null
  showSettingsDialog: boolean
  setShowSettingsDialog: (open: boolean) => void
  firstVisit: boolean
}

export function SettingsDialog({
  isLoading = false,
  fromCompletionDialog = false,
  showSettingsDialog,
  setShowSettingsDialog,
  endlessSettings,
  firstVisit,
}: SettingsDialogProps) {
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(
    endlessSettings?.preset ?? "balanced"
  )
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Show settings dialog if settings haven't been set yet (first visit)
    if (firstVisit) {
      return setShowSettingsDialog(true)
    }
  }, [firstVisit, setShowSettingsDialog])

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: firstVisit
          ? "Settings saved! Get ready to push some pixels!"
          : "Your new settings will be applied to the next level.",
      })

      setShowSettingsDialog(false)
      setHasChanges(false)

      // If this is the first visit and settings have been selected, generate a new level

      if (fromCompletionDialog) {
        toast({
          title: "Settings Saved",
          description: "Your new settings will be applied to the next level.",
        })
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    },
  })

  const handleDialogOpenChange = (open: boolean) => {
    // If this is the first visit and no settings have been selected, don't allow closing the dialog
    if (firstVisit && !open) return

    // If trying to close with unsaved changes
    if (!open && hasChanges) {
      setShowUnsavedChangesAlert(true)
      return // Don't close the dialog yet
    }
    // Normal open/close behavior
    else {
      setShowSettingsDialog(open)
    }
  }

  const handlePresetSelect = (
    presetKey: keyof typeof PRESET_LEVELS_WITH_DESCRIPTION
  ) => {
    // If this is already the current preset, do nothing
    if (selectedPreset === presetKey) {
      return
    }

    // Just update the selected settings, don't apply yet
    setSelectedPreset(presetKey)
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      preset: selectedPreset,
      pushRestriction: false,
    })
  }

  const handleDiscardChanges = () => {
    setShowUnsavedChangesAlert(false)
    setSelectedPreset(endlessSettings?.preset ?? "balanced")
    setHasChanges(false)
    setShowSettingsDialog(false)
  }

  const handleSaveUnsavedChanges = () => {
    handleSaveSettings()
    setShowUnsavedChangesAlert(false)
  }

  return (
    <>
      <Dialog open={showSettingsDialog} onOpenChange={handleDialogOpenChange}>
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
        <DialogContent
          className="bg-background border-primary my-4"
          hideCloseButton={firstVisit}
        >
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
              {Object.entries(PRESET_LEVELS_WITH_DESCRIPTION).map(
                ([key, preset]) => (
                  <div
                    key={key}
                    className={`p-4 transition-colors rounded-md border ${
                      selectedPreset === key
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
                      {preset.width}×{preset.height} grid • {preset.boxes} boxes
                      • {preset.minWalls} walls
                    </div>
                    <Button
                      variant={selectedPreset === key ? "default" : "outline"}
                      size="sm"
                      className="w-full font-pixel pixelated-border text-xs"
                      onClick={() =>
                        handlePresetSelect(
                          key as keyof typeof PRESET_LEVELS_WITH_DESCRIPTION
                        )
                      }
                      disabled={isLoading}
                    >
                      {selectedPreset === key ? "CURRENT" : "SELECT"}
                    </Button>
                  </div>
                )
              )}
            </div>

            <div className="bg-secondary/20 p-4 rounded-md">
              <p className="font-mono">
                These presets are carefully tuned based on analysis of 1.7
                million Sokoban solutions to ensure engaging puzzles with high
                solve rates.
              </p>
            </div>
          </div>

          <DialogFooter className="sticky -bottom-6 p-2 bg-background">
            <Button
              onClick={handleSaveSettings}
              disabled={
                firstVisit
                  ? false
                  : !hasChanges || saveSettingsMutation.isPending
              }
              className="font-pixel pixelated-border flex items-center"
            >
              {saveSettingsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spinW" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              {firstVisit ? "Go with Default" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert for unsaved changes */}
      <AlertDialog
        open={showUnsavedChangesAlert}
        onOpenChange={setShowUnsavedChangesAlert}
      >
        <AlertDialogContent className="bg-background border-primary">
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
          <AlertDialogFooter className="flex sm:flex-col justify-center gap-2">
            <AlertDialogAction
              className="font-pixel pixelated-border bg-primary text-primary-foreground w-full m-[0px_!important]"
              onClick={handleSaveUnsavedChanges}
            >
              Save changes, pwease!
            </AlertDialogAction>
            <AlertDialogCancel
              className="font-pixel pixelated-border bg-muted hover:bg-muted/80 w-full m-[0px_!important]"
              onClick={handleDiscardChanges}
            >
              It is what it is
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

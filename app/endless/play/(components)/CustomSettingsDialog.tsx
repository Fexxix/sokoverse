"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAction } from "next-safe-action/hooks"
import { useToast } from "@/hooks/use-toast"
import { predictLevelGenStats } from "../actions"
import { Check, Loader2, Timer } from "lucide-react"
import { EndlessPreset } from "@/lib/common/constants"
import { cn } from "@/lib/client/utils"

const customSettingsSchema = z.object({
  height: z.coerce.number().min(5).max(12),
  width: z.coerce.number().min(5).max(12),
  boxes: z.coerce
    .number({
      message: "Number of boxes must be 2, 3, or 4",
    })
    .min(2)
    .max(4),
  minWalls: z.coerce
    .number({ message: "Minimum number of walls must be between 5 and 20" })
    .min(5)
    .max(12),
})

type CustomSettingsForm = z.infer<typeof customSettingsSchema>

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  saveSettingsAction: ReturnType<typeof useAction>
  customWidth: number | null
  customHeight: number | null
  customBoxes: number | null
  customMinWalls: number | null
  savedPreset: EndlessPreset | undefined
  setSavedPreset: (preset: EndlessPreset | undefined) => void
}

export function CustomSettingsDialog({
  open,
  setOpen,
  saveSettingsAction,
  customHeight,
  customWidth,
  customBoxes,
  customMinWalls,
  savedPreset,
  setSavedPreset,
}: Props) {
  const { toast } = useToast()

  const form = useForm<CustomSettingsForm>({
    resolver: zodResolver(customSettingsSchema),
    defaultValues: {
      height: customHeight ?? 9,
      width: customWidth ?? 9,
      boxes: customBoxes ?? 3,
      minWalls: customMinWalls ?? 12,
    },
  })

  const [prediction, setPrediction] = useState<null | {
    generationTime: number
    successChance: number
  }>(null)
  const [isPredicted, setIsPredicted] = useState(false)

  const [savedSettings, setSavedSettings] = useState<{
    height: number | null
    width: number | null
    boxes: number | null
    minWalls: number | null
  }>({
    height: customHeight,
    width: customWidth,
    boxes: customBoxes,
    minWalls: customMinWalls,
  })

  const watchHeight = useWatch({
    control: form.control,
    name: "height",
  })
  const watchWidth = useWatch({
    control: form.control,
    name: "width",
  })
  const watchMinWalls = useWatch({
    control: form.control,
    name: "minWalls",
  })
  const watchBoxes = useWatch({
    control: form.control,
    name: "boxes",
  })

  const isSameFormSettingsAndSaved =
    parseInt(watchHeight.toString()) === savedSettings.height &&
    parseInt(watchWidth.toString()) === savedSettings.width &&
    parseInt(watchMinWalls.toString()) === savedSettings.minWalls &&
    parseInt(watchBoxes.toString()) === savedSettings.boxes

  useEffect(() => {
    // Check if the form settings are the same as the saved settings
    setIsPredicted(
      parseInt(watchHeight.toString()) === savedSettings.height &&
        parseInt(watchWidth.toString()) === savedSettings.width &&
        parseInt(watchMinWalls.toString()) === savedSettings.minWalls &&
        parseInt(watchBoxes.toString()) === savedSettings.boxes
    )
  }, [watchHeight, watchWidth, watchMinWalls, watchBoxes, savedSettings])

  const predictAction = useAction(predictLevelGenStats, {
    onSuccess: (res) => {
      if (res.data?.success) {
        setPrediction(res.data?.prediction)
        setIsPredicted(true)
      } else {
        toast({ title: "Prediction failed", description: res.data?.error })
      }
    },
    onError: () => {
      toast({ title: "Prediction error", description: "Something went wrong." })
    },
  })

  const handlePredict = (values: CustomSettingsForm) => {
    predictAction.executeAsync(values)
  }

  const handleSave = async (values: CustomSettingsForm) => {
    await saveSettingsAction.executeAsync({
      preset: "custom",
      pushRestriction: false,
      customWidth: values.width,
      customHeight: values.height,
      customBoxes: values.boxes,
      customMinWalls: values.minWalls,
    })

    setSavedSettings({
      height: values.height,
      width: values.width,
      boxes: values.boxes,
      minWalls: values.minWalls,
    })
    setSavedPreset("custom")

    toast({
      title: "Custom Settings Saved",
      description: "Your settings will apply to the next level.",
    })

    setOpen(false)
  }

  const isNotCustomPresetAndIsSaved =
    savedPreset !== "custom" && isSameFormSettingsAndSaved

  const disablePredictionButton =
    isPredicted || predictAction.isPending || saveSettingsAction.isPending
  const disableSaveButton = (() => {
    if (predictAction.isPending || saveSettingsAction.isPending) {
      return true
    }
    if (isNotCustomPresetAndIsSaved) {
      return false
    } else return !isPredicted || isSameFormSettingsAndSaved
  })()

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      {...(predictAction.isPending || saveSettingsAction.isPending
        ? { modal: true }
        : {})}
    >
      <DialogContent
        className="bg-background border-primary"
        hideCloseButton={
          predictAction.isPending || saveSettingsAction.isPending
        }
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary">
            Custom Settings
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-muted-foreground">
            Define your own level dimensions and difficulty. We’ll estimate
            generation performance first. Saving is disabled until you preview
            the results.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Height</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Width</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="boxes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Boxes</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minWalls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Min Walls</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage className="font-mono" />
                  </FormItem>
                )}
              />
            </div>

            <div className="text-sm font-mono text-foreground/80">
              {isPredicted ? (
                <div
                  className={cn({
                    "space-y-1 border rounded-md p-3 bg-secondary/20":
                      prediction,
                  })}
                >
                  {prediction && (
                    <>
                      <p className="flex items-center gap-2">
                        <Timer /> Estimated Time: {prediction.generationTime}s
                      </p>
                      <p className="flex items-center gap-2">
                        <Check /> Success Rate: {prediction.successChance}%
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-yellow-500">
                  Predict to see generation stats before saving.
                </p>
              )}
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="font-pixel pixelated-border"
                onClick={form.handleSubmit(handlePredict)}
                disabled={disablePredictionButton}
              >
                {predictAction.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Predict
              </Button>

              <Button
                type="submit"
                className="font-pixel pixelated-border"
                disabled={disableSaveButton}
              >
                {saveSettingsAction.isPending && (
                  <Loader2 className="animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

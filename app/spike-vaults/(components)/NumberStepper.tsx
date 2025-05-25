import { Input } from "@/components/ui/input"
import { cn } from "@/lib/client/utils"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

type NumberStepperProps = {
  value: number | undefined
  onChange: (val: number | undefined) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function NumberStepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled = false,
  placeholder,
  className,
}: NumberStepperProps) {
  const update = (next: number) => {
    if (next < min || next > max) return
    onChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === "" ? undefined : parseInt(val))
        }}
        placeholder={placeholder}
        className={cn("font-mono appearance-none w-4/5", className)}
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => update((value ?? min) + step)}
        disabled={disabled || (value ?? min) >= max}
      >
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => update((value ?? min) - step)}
        disabled={disabled || (value ?? min) <= min}
      >
        <Minus className="w-4 h-4" />
      </Button>
    </div>
  )
}

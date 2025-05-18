import { cn } from "@/lib/client/utils"

export function BrailleLoader({ className }: { className?: string }) {
  return <div className={cn("braille-loader", className)} />
}

export default function TypeWriterLoader({
  className,
}: {
  className?: string
}) {
  return <div className={cn("typewriter-loader", className)} />
}

export function FullPageLoader() {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-2">
      <BrailleLoader />
      <TypeWriterLoader />
    </div>
  )
}

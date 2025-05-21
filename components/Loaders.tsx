import { cn } from "@/lib/client/utils"

export function BrailleLoader({ className }: { className?: string }) {
  return <div className={cn("braille-loader", className)} />
}

export default function TypeWriterLoader({
  className,
  message = "Loading",
}: {
  className?: string
  message?: string
}) {
  return (
    <div className="flex items-center">
      <p className="font-pixel">{message}</p>
      <div className={cn("typewriter-loader", className)} />
    </div>
  )
}

export function Loader({ message }: { message?: string }) {
  return (
    <>
      <BrailleLoader />
      <TypeWriterLoader message={message} />
    </>
  )
}

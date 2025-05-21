import { Loader } from "@/components/Loaders"

export default function Loading() {
  return (
    <div className="h-screen [main>&]:h-full w-full flex flex-col justify-center items-center gap-2">
      <Loader />
    </div>
  )
}

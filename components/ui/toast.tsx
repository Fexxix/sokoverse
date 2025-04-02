"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: number
  title: string
  description?: string
  type?: "success" | "error" | "info"
  onDismiss: (id: number) => void
}

export function Toast({ id, title, description, type = "info", onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id)
    }, 3000)

    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-md shadow-lg border transition-all transform translate-y-0 opacity-100",
        "animate-in slide-in-from-bottom-5 duration-300",
        type === "success" && "bg-green-50 border-green-200 text-green-800",
        type === "error" && "bg-red-50 border-red-200 text-red-800",
        type === "info" && "bg-primary/10 border-primary/20 text-foreground",
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-pixel text-sm">{title}</h3>
          {description && <p className="text-xs font-mono mt-1">{description}</p>}
        </div>
        <button onClick={() => onDismiss(id)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onDismiss }: { toasts: any[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}


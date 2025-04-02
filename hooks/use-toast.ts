"use client"

import { useState, useCallback } from "react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  title: string
  description?: string
  type?: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, type = "info" }: Omit<Toast, "id">) => {
    const id = Date.now()
    const newToast = { id, title, description, type }

    setToasts((prevToasts) => [...prevToasts, newToast])

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, 3000)

    return id
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  return { toast, toasts, dismissToast }
}


import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  const isClient = typeof window !== "undefined"

  const readValue = (): T => {
    if (!isClient) return initialValue
    const item = window.localStorage.getItem(key)
    return item !== null ? JSON.parse(item) : initialValue
  }

  const [storedValue, setStoredValue] = useState<T>(readValue)

  useEffect(() => {
    if (!isClient) return
    const value = JSON.stringify(storedValue)
    window.localStorage.setItem(key, value)
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}

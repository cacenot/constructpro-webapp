import { useTheme as useNextTheme } from 'next-themes'
import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'

export function useTheme() {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme()
  const zustandTheme = useAppStore((s) => s.theme)
  const setZustandTheme = useAppStore((s) => s.setTheme)

  // Sync Zustand → next-themes on mount or when Zustand changes
  useEffect(() => {
    setNextTheme(zustandTheme)
  }, [zustandTheme, setNextTheme])

  // Custom setTheme that updates both stores
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setZustandTheme(newTheme)
    setNextTheme(newTheme)
  }

  return {
    theme: resolvedTheme as 'light' | 'dark',
    setTheme,
  }
}

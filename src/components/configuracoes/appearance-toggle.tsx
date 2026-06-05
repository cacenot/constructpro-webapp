import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useAppStore } from '@/stores/app-store'
import { SegmentedControl } from './segmented-control'

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function AppearanceToggle() {
  const { setTheme } = useTheme()
  // Preferência escolhida (light/dark/system), não o tema resolvido.
  const preference = useAppStore((s) => s.theme)

  return (
    <SegmentedControl
      aria-label="Tema da aparência"
      options={OPTIONS}
      value={preference}
      onChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
    />
  )
}

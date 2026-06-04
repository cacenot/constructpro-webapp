import { Moon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/hooks/use-theme'

export function AppearanceToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="dark-mode" className="flex cursor-pointer items-center gap-2 font-normal">
        <Moon className="size-4 text-muted-foreground" />
        Modo escuro
      </Label>
      <Switch
        id="dark-mode"
        checked={theme === 'dark'}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </div>
  )
}
